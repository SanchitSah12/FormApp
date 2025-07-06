const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Template = require('../models/Template');
const { diff_match_patch } = require('diff-match-patch');

const dmp = new diff_match_patch();

// Active sessions store
const activeSessions = new Map();
const activeUsers = new Map();
const fieldLocks = new Map();

// Socket middleware for authentication
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

// Initialize Socket.IO
const initializeCollaboration = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.email} connected`);

    // Join template room
    socket.on('join-template', async (templateId) => {
      try {
        const template = await Template.findById(templateId);
        if (!template) {
          socket.emit('error', 'Template not found');
          return;
        }

        // Check permissions
        if (template.createdBy.toString() !== socket.user._id.toString() && socket.user.role !== 'admin' && socket.user.role !== 'superadmin') {
          socket.emit('error', 'Permission denied');
          return;
        }

        socket.join(templateId);
        socket.templateId = templateId;

        // Add user to active sessions
        if (!activeSessions.has(templateId)) {
          activeSessions.set(templateId, new Set());
        }
        activeSessions.get(templateId).add(socket.user._id.toString());

        // Track user
        activeUsers.set(socket.id, {
          userId: socket.user._id.toString(),
          templateId,
          user: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            email: socket.user.email,
            role: socket.user.role
          }
        });

        // Notify others in the room
        socket.broadcast.to(templateId).emit('user-joined', {
          userId: socket.user._id,
          user: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            email: socket.user.email,
            role: socket.user.role
          }
        });

        // Send current active users
        const currentUsers = Array.from(io.sockets.sockets.values())
          .filter(s => s.templateId === templateId && s.user)
          .map(s => ({
            userId: s.user._id,
            user: {
              _id: s.user._id,
              firstName: s.user.firstName,
              lastName: s.user.lastName,
              email: s.user.email,
              role: s.user.role
            }
          }));

        socket.emit('active-users', currentUsers);

        // Send current field locks
        const templateLocks = Array.from(fieldLocks.entries())
          .filter(([key]) => key.startsWith(templateId))
          .map(([key, value]) => ({
            fieldId: key.split(':')[1],
            user: value
          }));

        socket.emit('field-locks', templateLocks);

      } catch (error) {
        socket.emit('error', 'Failed to join template');
      }
    });

    // Handle field lock
    socket.on('lock-field', (data) => {
      const { fieldId } = data;
      const lockKey = `${socket.templateId}:${fieldId}`;

      if (fieldLocks.has(lockKey)) {
        socket.emit('field-lock-denied', { fieldId });
        return;
      }

      fieldLocks.set(lockKey, {
        userId: socket.user._id,
        user: {
          _id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          email: socket.user.email,
          role: socket.user.role
        }
      });

      socket.broadcast.to(socket.templateId).emit('field-locked', {
        fieldId,
        user: {
          _id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          email: socket.user.email,
          role: socket.user.role
        }
      });
    });

    // Handle field unlock
    socket.on('unlock-field', (data) => {
      const { fieldId } = data;
      const lockKey = `${socket.templateId}:${fieldId}`;

      if (fieldLocks.has(lockKey)) {
        fieldLocks.delete(lockKey);
        socket.broadcast.to(socket.templateId).emit('field-unlocked', { fieldId });
      }
    });

    // Handle template updates
    socket.on('template-update', async (data) => {
      try {
        const { templateId, updates, version } = data;
        
        // Get current template
        const template = await Template.findById(templateId);
        if (!template) {
          socket.emit('error', 'Template not found');
          return;
        }

        // Check version for conflict resolution
        if (template.version !== version) {
          socket.emit('version-conflict', {
            currentVersion: template.version,
            serverTemplate: template
          });
          return;
        }

        // Apply updates
        Object.assign(template, updates);
        template.version = (template.version || 0) + 1;
        template.lastModified = new Date();
        template.lastModifiedBy = socket.user._id;

        await template.save();

        // Broadcast to all users in the room except sender
        socket.broadcast.to(templateId).emit('template-updated', {
          updates,
          version: template.version,
          lastModified: template.lastModified,
          lastModifiedBy: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            email: socket.user.email
          }
        });

        socket.emit('template-update-success', {
          version: template.version,
          lastModified: template.lastModified
        });

      } catch (error) {
        socket.emit('error', 'Failed to update template');
      }
    });

    // Handle comments
    socket.on('add-comment', async (data) => {
      try {
        const { templateId, fieldId, comment, parentId } = data;
        
        const template = await Template.findById(templateId);
        if (!template) {
          socket.emit('error', 'Template not found');
          return;
        }

        const newComment = {
          _id: new Date().getTime().toString(),
          fieldId,
          parentId: parentId || null,
          text: comment,
          author: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            email: socket.user.email
          },
          createdAt: new Date(),
          resolved: false
        };

        if (!template.comments) {
          template.comments = [];
        }
        template.comments.push(newComment);

        await template.save();

        // Broadcast to all users in the room
        io.to(templateId).emit('comment-added', newComment);

      } catch (error) {
        socket.emit('error', 'Failed to add comment');
      }
    });

    // Handle comment resolution
    socket.on('resolve-comment', async (data) => {
      try {
        const { templateId, commentId } = data;
        
        const template = await Template.findById(templateId);
        if (!template) {
          socket.emit('error', 'Template not found');
          return;
        }

        const comment = template.comments.find(c => c._id === commentId);
        if (!comment) {
          socket.emit('error', 'Comment not found');
          return;
        }

        comment.resolved = true;
        comment.resolvedBy = socket.user._id;
        comment.resolvedAt = new Date();

        await template.save();

        // Broadcast to all users in the room
        io.to(templateId).emit('comment-resolved', {
          commentId,
          resolvedBy: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            email: socket.user.email
          },
          resolvedAt: comment.resolvedAt
        });

      } catch (error) {
        socket.emit('error', 'Failed to resolve comment');
      }
    });

    // Handle cursor position
    socket.on('cursor-position', (data) => {
      const { fieldId, position } = data;
      socket.broadcast.to(socket.templateId).emit('cursor-updated', {
        userId: socket.user._id,
        fieldId,
        position,
        user: {
          _id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          email: socket.user.email,
          role: socket.user.role
        }
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.email} disconnected`);
      
      if (socket.templateId) {
        // Remove user from active sessions
        if (activeSessions.has(socket.templateId)) {
          activeSessions.get(socket.templateId).delete(socket.user._id.toString());
          if (activeSessions.get(socket.templateId).size === 0) {
            activeSessions.delete(socket.templateId);
          }
        }

        // Remove all field locks for this user
        for (const [lockKey, lockValue] of fieldLocks.entries()) {
          if (lockValue.userId === socket.user._id.toString() && lockKey.startsWith(socket.templateId)) {
            fieldLocks.delete(lockKey);
            const fieldId = lockKey.split(':')[1];
            socket.broadcast.to(socket.templateId).emit('field-unlocked', { fieldId });
          }
        }

        // Notify others in the room
        socket.broadcast.to(socket.templateId).emit('user-left', {
          userId: socket.user._id
        });
      }

      // Remove from active users
      activeUsers.delete(socket.id);
    });
  });
};

module.exports = { initializeCollaboration, activeSessions, activeUsers, fieldLocks };