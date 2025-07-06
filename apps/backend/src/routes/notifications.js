const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { NotificationPreference, NotificationHistory } = require('../models/Notification');
const notificationService = require('../utils/notificationService');
const User = require('../models/User');

const router = express.Router();

// Get notification preferences for current admin
router.get('/preferences', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.user._id });
    
    if (!preferences) {
      // Create default preferences if none exist
      preferences = new NotificationPreference({
        userId: req.user._id,
        emailNotifications: {
          formSubmissions: true,
          formResponses: true,
          systemUpdates: true,
          weeklyReports: false
        },
        frequency: 'immediate',
        quietHours: {
          enabled: false,
          startTime: "22:00",
          endTime: "08:00",
          timezone: "UTC"
        }
      });
      await preferences.save();
    }

    res.json({ preferences });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { emailNotifications, frequency, quietHours, templateNotifications } = req.body;

    let preferences = await NotificationPreference.findOne({ userId: req.user._id });
    
    if (!preferences) {
      preferences = new NotificationPreference({ userId: req.user._id });
    }

    if (emailNotifications) {
      preferences.emailNotifications = { ...preferences.emailNotifications, ...emailNotifications };
    }
    if (frequency) {
      preferences.frequency = frequency;
    }
    if (quietHours) {
      preferences.quietHours = { ...preferences.quietHours, ...quietHours };
    }
    if (templateNotifications) {
      preferences.templateNotifications = templateNotifications;
    }

    await preferences.save();

    res.json({
      message: 'Notification preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Get notification history for current admin
router.get('/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = '', status = '' } = req.query;

    const query = { userId: req.user._id };
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    const notifications = await NotificationHistory.find(query)
      .populate('relatedId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await NotificationHistory.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

// Mark notification as read
router.patch('/history/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notification = await NotificationHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'read', readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await NotificationHistory.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: { $sum: { $cond: [{ $ne: ['$status', 'read'] }, 1, 0] } }
        }
      }
    ]);

    const totalNotifications = await NotificationHistory.countDocuments({ userId: req.user._id });
    const unreadNotifications = await NotificationHistory.countDocuments({ 
      userId: req.user._id, 
      status: { $ne: 'read' } 
    });

    res.json({
      totalNotifications,
      unreadNotifications,
      byType: stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Failed to get notification statistics' });
  }
});

// Test email configuration (super admin only)
router.post('/test-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Check if user is super admin for this operation
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { testEmail } = req.body;
    const emailToTest = testEmail || req.user.email;

    const result = await notificationService.testEmailConfiguration();
    
    if (result.success) {
      // Send a test email
      await notificationService.sendCustomNotification(
        emailToTest,
        'Test Email - Form App Notifications',
        `
        <h2>Test Email Successful!</h2>
        <p>This is a test email to verify that the notification system is working correctly.</p>
        <p><strong>Configuration Status:</strong> ✅ Working</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> Form App Notification System</p>
        `,
        true
      );

      res.json({
        success: true,
        message: 'Test email sent successfully',
        details: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Email configuration test failed',
        details: result
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to test email configuration',
      details: error.message 
    });
  }
});

// Send custom notification to all admins (super admin only)
router.post('/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Check if user is super admin for this operation
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { subject, message, isHtml = false } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Get all active admin emails
    const admins = await User.find({ 
      role: { $in: ['admin', 'superadmin'] }, 
      isActive: true 
    }).select('email firstName lastName');

    const adminEmails = admins.map(admin => admin.email);

    if (adminEmails.length === 0) {
      return res.status(404).json({ error: 'No active admins found' });
    }

    // Send broadcast notification
    const success = await notificationService.sendCustomNotification(
      adminEmails,
      subject,
      message,
      isHtml
    );

    if (success) {
      // Log notification history for each admin
      const notificationPromises = admins.map(admin => 
        NotificationHistory.create({
          userId: admin._id,
          type: 'system_update',
          title: subject,
          message: message,
          status: 'sent',
          sentAt: new Date(),
          deliveryMethod: 'email',
          metadata: {
            sentBy: req.user._id,
            isBroadcast: true
          }
        })
      );

      await Promise.all(notificationPromises);

      res.json({
        success: true,
        message: `Broadcast notification sent to ${adminEmails.length} admins`,
        recipients: adminEmails.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send broadcast notification'
      });
    }
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ error: 'Failed to send broadcast notification' });
  }
});

// Get all admins for notification management (super admin only)
router.get('/admins', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const admins = await User.find({ 
      role: { $in: ['admin', 'superadmin'] }, 
      isActive: true 
    }).select('email firstName lastName role createdAt lastLogin');

    // Get notification preferences for each admin
    const adminIds = admins.map(admin => admin._id);
    const preferences = await NotificationPreference.find({ 
      userId: { $in: adminIds } 
    });

    const preferencesMap = {};
    preferences.forEach(pref => {
      preferencesMap[pref.userId.toString()] = pref;
    });

    const adminsWithPreferences = admins.map(admin => ({
      ...admin.toObject(),
      notificationPreferences: preferencesMap[admin._id.toString()] || null
    }));

    res.json({ admins: adminsWithPreferences });
  } catch (error) {
    console.error('Get admins for notifications error:', error);
    res.status(500).json({ error: 'Failed to get admin notification data' });
  }
});

module.exports = router; 