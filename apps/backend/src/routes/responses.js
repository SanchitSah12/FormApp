const express = require('express');
const mongoose = require('mongoose');
const Response = require('../models/Response');
const Template = require('../models/Template');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireUser } = require('../middleware/auth');
const notificationService = require('../utils/notificationService');
const { NotificationHistory } = require('../models/Notification');

const router = express.Router();

// Get user's responses
router.get('/my-responses', authenticateToken, requireUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', templateId = '' } = req.query;
    
    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }
    if (templateId) {
      query.templateId = templateId;
    }

    const responses = await Response.find(query)
      .populate('templateId', 'name description category')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Response.countDocuments(query);

    res.json({
      responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user responses error:', error);
    res.status(500).json({ error: 'Failed to get responses' });
  }
});

// Get specific response
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const response = await Response.findById(req.params.id)
      .populate('templateId')
      .populate('userId', 'firstName lastName email companyName')
      .populate('reviewedBy', 'firstName lastName email');

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && response.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ response });
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

// Create or update response
router.post('/', authenticateToken, requireUser, async (req, res) => {
  try {
    const { templateId, responses, currentSection } = req.body;

    if (!templateId || !responses) {
      return res.status(400).json({ error: 'Template ID and responses are required' });
    }

    // Get template to calculate completion percentage
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Find existing response or create new one
    let response = await Response.findOne({
      templateId,
      userId: req.user._id
    });

    if (response) {
      // Update existing response
      response.responses = { ...response.responses, ...responses };
      response.currentSection = currentSection;
      response.completionPercentage = response.calculateCompletion(template);
      response.updatedAt = new Date();
    } else {
      // Create new response
      response = new Response({
        templateId,
        userId: req.user._id,
        responses,
        currentSection,
        completionPercentage: 0
      });
      response.completionPercentage = response.calculateCompletion(template);
    }

    await response.save();
    await response.populate('templateId', 'name description category');

    res.json({
      message: 'Response saved successfully',
      response
    });
  } catch (error) {
    console.error('Save response error:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
});

// Submit response
router.post('/:id/submit', authenticateToken, requireUser, async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Check permissions
    if (response.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (response.status !== 'draft') {
      return res.status(400).json({ error: 'Response has already been submitted' });
    }

    response.status = 'submitted';
    response.submittedAt = new Date();
    await response.save();

    // Send notification to admins
    try {
      await response.populate('userId', 'firstName lastName email companyName');
      const submitterInfo = {
        firstName: response.userId.firstName,
        lastName: response.userId.lastName,
        email: response.userId.email,
        companyName: response.userId.companyName
      };
      
      await notificationService.sendFormSubmissionNotification(
        response.templateId,
        response._id,
        submitterInfo,
        false // not a public submission
      );

      // Log notification history
      await NotificationHistory.create({
        userId: response.userId._id,
        type: 'form_submission',
        title: 'Form Submitted',
        message: `Form response submitted successfully`,
        relatedId: response._id,
        relatedModel: 'Response',
        status: 'sent',
        sentAt: new Date(),
        deliveryMethod: 'email'
      });
    } catch (notificationError) {
      console.error('Failed to send submission notification:', notificationError);
      // Don't fail the response submission if notification fails
    }

    res.json({
      message: 'Response submitted successfully',
      response
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Update specific response
router.put('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const { responses, currentSection, status } = req.body;

    // Find the response
    const response = await Response.findById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Check permissions
    if (response.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get template to calculate completion percentage
    const template = await Template.findById(response.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Update response data
    if (responses) {
      response.responses = { ...response.responses, ...responses };
    }
    if (currentSection) {
      response.currentSection = currentSection;
    }
    const wasSubmitted = status === 'submitted' && response.status !== 'submitted';
    
    if (status) {
      response.status = status;
      if (status === 'submitted') {
        response.submittedAt = new Date();
      }
    }

    // Recalculate completion percentage
    response.completionPercentage = response.calculateCompletion(template);
    response.updatedAt = new Date();

    await response.save();
    await response.populate('templateId', 'name description category');

    // Send notification if form was just submitted
    if (wasSubmitted) {
      try {
        await response.populate('userId', 'firstName lastName email companyName');
        const submitterInfo = {
          firstName: response.userId.firstName,
          lastName: response.userId.lastName,
          email: response.userId.email,
          companyName: response.userId.companyName
        };
        
        await notificationService.sendFormSubmissionNotification(
          response.templateId._id,
          response._id,
          submitterInfo,
          false // not a public submission
        );

        // Log notification history
        await NotificationHistory.create({
          userId: response.userId._id,
          type: 'form_submission',
          title: 'Form Submitted',
          message: `Form response submitted successfully`,
          relatedId: response._id,
          relatedModel: 'Response',
          status: 'sent',
          sentAt: new Date(),
          deliveryMethod: 'email'
        });
      } catch (notificationError) {
        console.error('Failed to send submission notification:', notificationError);
        // Don't fail the response submission if notification fails
      }
    }

    res.json({
      message: 'Response updated successfully',
      response
    });
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

// Admin: Get all responses
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      templateId = '',
      userId = '',
      search = ''
    } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    if (templateId) {
      query.templateId = templateId;
    }
    if (userId) {
      query.userId = userId;
    }

    let responses = Response.find(query)
      .populate('templateId', 'name description category')
      .populate('userId', 'firstName lastName email companyName')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ updatedAt: -1 });

    // Apply search filter if provided
    if (search) {
      responses = responses.populate({
        path: 'userId',
        match: {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { companyName: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    const results = await responses
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Response.countDocuments(query);

    res.json({
      responses: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all responses error:', error);
    res.status(500).json({ error: 'Failed to get responses' });
  }
});

// Admin: Update response status
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['reviewed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const response = await Response.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('templateId userId reviewedBy');

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({
      message: 'Response status updated successfully',
      response
    });
  } catch (error) {
    console.error('Update response status error:', error);
    res.status(500).json({ error: 'Failed to update response status' });
  }
});

// Admin: Delete response
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await Response.findByIdAndDelete(req.params.id);

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

// Get response statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId } = req.query;

    const matchStage = templateId ? { templateId: mongoose.Types.ObjectId(templateId) } : {};

    const stats = await Response.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalResponses = await Response.countDocuments(matchStage);
    
    const avgCompletion = await Response.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' }
        }
      }
    ]);

    const recentResponses = await Response.find(matchStage)
      .populate('templateId', 'name')
      .populate('userId', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      totalResponses,
      averageCompletion: avgCompletion[0]?.avgCompletion || 0,
      statusBreakdown: stats,
      recentResponses
    });
  } catch (error) {
    console.error('Get response stats error:', error);
    res.status(500).json({ error: 'Failed to get response statistics' });
  }
});

// Public form submission (no authentication required)
router.post('/public/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { responses, submitterInfo } = req.body;

    if (!responses) {
      return res.status(400).json({ error: 'Responses are required' });
    }

    // Find template by share token
    const template = await Template.findOne({
      'sharingConfig.shareToken': shareToken,
      'sharingConfig.isPublic': true,
      isActive: true
    });

    if (!template) {
      return res.status(404).json({ error: 'Form not found or no longer available' });
    }

    // Check if link has expired
    if (template.sharingConfig.expiresAt && new Date() > template.sharingConfig.expiresAt) {
      return res.status(410).json({ error: 'This form link has expired' });
    }

    // Create response
    const response = new Response({
      templateId: template._id,
      userId: null, // No user for public submissions
      responses,
      status: 'submitted',
      submittedAt: new Date(),
      completionPercentage: 100,
      submitterInfo: submitterInfo || null, // Store submitter info for anonymous submissions
      isPublicSubmission: true
    });

    await response.save();

    // Send notification to admins for public submission
    try {
      await notificationService.sendFormSubmissionNotification(
        template._id,
        response._id,
        submitterInfo,
        true // this is a public submission
      );

      // Log notification history for each admin who received the notification
      const admins = await User.find({ 
        role: { $in: ['admin', 'superadmin'] }, 
        isActive: true 
      }).select('_id');

      const notificationHistoryPromises = admins.map(admin => 
        NotificationHistory.create({
          userId: admin._id,
          type: 'form_submission',
          title: 'Public Form Submitted',
          message: `Public form submission received`,
          relatedId: response._id,
          relatedModel: 'Response',
          status: 'sent',
          sentAt: new Date(),
          deliveryMethod: 'email',
          metadata: {
            isPublicSubmission: true,
            submitterInfo: submitterInfo
          }
        })
      );

      await Promise.all(notificationHistoryPromises);
    } catch (notificationError) {
      console.error('Failed to send public submission notification:', notificationError);
      // Don't fail the response submission if notification fails
    }

    res.json({
      message: 'Form submitted successfully',
      responseId: response._id
    });
  } catch (error) {
    console.error('Public form submission error:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Save progress for public form (no authentication required)
router.post('/public/:shareToken/save', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { responses, submitterInfo, sessionId } = req.body;

    if (!responses) {
      return res.status(400).json({ error: 'Responses are required' });
    }

    // Find template by share token
    const template = await Template.findOne({
      'sharingConfig.shareToken': shareToken,
      'sharingConfig.isPublic': true,
      isActive: true
    });

    if (!template) {
      return res.status(404).json({ error: 'Form not found or no longer available' });
    }

    // Check if link has expired
    if (template.sharingConfig.expiresAt && new Date() > template.sharingConfig.expiresAt) {
      return res.status(410).json({ error: 'This form link has expired' });
    }

    // Calculate completion percentage
    let totalFields = 0;
    let completedFields = 0;
    
    template.sections.forEach(section => {
      section.fields.forEach(field => {
        totalFields++;
        if (responses[field.id] !== undefined && responses[field.id] !== null && responses[field.id] !== '') {
          completedFields++;
        }
      });
    });
    
    const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    // Try to find existing draft response by sessionId
    let response = null;
    if (sessionId) {
      response = await Response.findOne({
        templateId: template._id,
        sessionId: sessionId,
        status: 'draft'
      });
    }

    if (response) {
      // Update existing response
      response.responses = responses;
      response.completionPercentage = completionPercentage;
      response.submitterInfo = submitterInfo || response.submitterInfo;
      response.updatedAt = new Date();
    } else {
      // Create new response
      response = new Response({
        templateId: template._id,
        userId: null,
        responses,
        status: 'draft',
        completionPercentage,
        submitterInfo: submitterInfo || null,
        sessionId: sessionId || require('crypto').randomBytes(16).toString('hex'),
        isPublicSubmission: true
      });
    }

    await response.save();

    res.json({
      message: 'Progress saved successfully',
      responseId: response._id,
      sessionId: response.sessionId
    });
  } catch (error) {
    console.error('Public form save error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Get public form progress (no authentication required)
router.get('/public/:shareToken/:sessionId', async (req, res) => {
  try {
    const { shareToken, sessionId } = req.params;

    // Find template by share token
    const template = await Template.findOne({
      'sharingConfig.shareToken': shareToken,
      'sharingConfig.isPublic': true,
      isActive: true
    });

    if (!template) {
      return res.status(404).json({ error: 'Form not found or no longer available' });
    }

    // Find response by sessionId
    const response = await Response.findOne({
      templateId: template._id,
      sessionId: sessionId,
      status: 'draft'
    });

    if (!response) {
      return res.status(404).json({ error: 'No saved progress found' });
    }

    res.json({ response });
  } catch (error) {
    console.error('Get public form progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

module.exports = router; 