const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const Template = require('../models/Template');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const fieldSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid('text', 'email', 'number', 'select', 'multiselect', 'file', 'textarea', 'checkbox', 'radio', 'date', 'phone').required(),
  label: Joi.string().required(),
  placeholder: Joi.string().optional(),
  required: Joi.boolean().default(false),
  options: Joi.array().items(Joi.object({
    value: Joi.string().required(),
    label: Joi.string().required()
  })).optional(),
  validation: Joi.object({
    min: Joi.number().optional(),
    max: Joi.number().optional(),
    pattern: Joi.string().optional(),
    message: Joi.string().optional()
  }).optional(),
  helpText: Joi.string().optional(),
  helpFiles: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    url: Joi.string().required(),
    size: Joi.number().optional()
  })).optional(),
  conditionalLogic: Joi.object({
    dependsOn: Joi.string().optional(),
    condition: Joi.string().optional(),
    value: Joi.any().optional()
  }).optional(),
  order: Joi.number().default(0),
  _id: Joi.string().optional()
}).unknown(true);

const sectionSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  fields: Joi.array().items(fieldSchema).required(),
  order: Joi.number().default(0),
  conditionalLogic: Joi.object({
    dependsOn: Joi.string().optional(),
    condition: Joi.string().optional(),
    value: Joi.any().optional()
  }).optional()
}).unknown(true);

const templateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  category: Joi.string().valid('construction', 'payroll', 'general').required(),
  sections: Joi.array().items(sectionSchema).required(),
  isActive: Joi.boolean().default(true)
});

// Get all templates (public endpoint for users)
router.get('/', async (req, res) => {
  try {
    const { category, isActive = 'true' } = req.query;
    
    const query = { isActive: isActive === 'true' };
    if (category) {
      query.category = category;
    }

    const templates = await Template.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Get general template statistics
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const Response = require('../models/Response');
    
    // Get total templates count
    const totalTemplates = await Template.countDocuments({ isActive: true });
    
    // Get templates by category
    const templatesByCategory = await Template.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total responses across all templates
    const totalResponses = await Response.countDocuments();
    
    // Get response statistics
    const responseStats = await Response.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average completion percentage
    const avgCompletion = await Response.aggregate([
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' }
        }
      }
    ]);

    // Get recent activity (last 5 responses)
    const recentResponses = await Response.find()
      .populate('templateId', 'name')
      .populate('userId', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      totalTemplates,
      templatesByCategory,
      totalResponses,
      responseStatusBreakdown: responseStats,
      averageCompletion: avgCompletion[0]?.avgCompletion || 0,
      recentActivity: recentResponses
    });
  } catch (error) {
    console.error('Get template statistics error:', error);
    res.status(500).json({ error: 'Failed to get template statistics' });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// Admin: Create new template
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error, value } = templateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const template = new Template({
      ...value,
      createdBy: req.user._id
    });

    await template.save();
    await template.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Admin: Update template
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error, value } = templateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const template = await Template.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...value,
          updatedBy: req.user._id
        },
        $inc: {
          version: 1
        }
      },
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'firstName lastName email');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Admin: Delete template
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Admin: Toggle template active status
router.patch('/:id/toggle-active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    template.isActive = !template.isActive;
    template.updatedBy = req.user._id;
    await template.save();

    res.json({
      message: `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`,
      template
    });
  } catch (error) {
    console.error('Toggle template status error:', error);
    res.status(500).json({ error: 'Failed to toggle template status' });
  }
});

// Admin: Clone template
router.post('/:id/clone', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const originalTemplate = await Template.findById(req.params.id);

    if (!originalTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const clonedTemplate = new Template({
      name: `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      category: originalTemplate.category,
      sections: originalTemplate.sections,
      isActive: false,
      createdBy: req.user._id
    });

    await clonedTemplate.save();
    await clonedTemplate.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Template cloned successfully',
      template: clonedTemplate
    });
  } catch (error) {
    console.error('Clone template error:', error);
    res.status(500).json({ error: 'Failed to clone template' });
  }
});

// Get template statistics
router.get('/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const Response = require('../models/Response');
    
    const templateId = req.params.id;
    
    const stats = await Response.aggregate([
      { $match: { templateId: mongoose.Types.ObjectId(templateId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalResponses = await Response.countDocuments({ templateId });
    const avgCompletion = await Response.aggregate([
      { $match: { templateId: mongoose.Types.ObjectId(templateId) } },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' }
        }
      }
    ]);

    res.json({
      templateId,
      totalResponses,
      averageCompletion: avgCompletion[0]?.avgCompletion || 0,
      statusBreakdown: stats
    });
  } catch (error) {
    console.error('Get template stats error:', error);
    res.status(500).json({ error: 'Failed to get template statistics' });
  }
});

// Generate public sharing link for template
router.post('/:id/share', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { allowAnonymous = true, expiresAt } = req.body;
    
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Generate a unique sharing token
    const crypto = require('crypto');
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Add sharing configuration to template
    template.sharingConfig = {
      isPublic: true,
      shareToken,
      allowAnonymous,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id,
      createdAt: new Date()
    };

    await template.save();

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const shareUrl = `${frontendUrl}/public/forms/${shareToken}`;

    res.json({
      message: 'Sharing link generated successfully',
      shareUrl,
      shareToken,
      expiresAt: template.sharingConfig.expiresAt
    });
  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({ error: 'Failed to generate sharing link' });
  }
});

// Disable public sharing for template
router.delete('/:id/share', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    template.sharingConfig = {
      isPublic: false,
      shareToken: null,
      allowAnonymous: false,
      expiresAt: null,
      createdBy: null,
      createdAt: null
    };

    await template.save();

    res.json({
      message: 'Public sharing disabled successfully'
    });
  } catch (error) {
    console.error('Disable share link error:', error);
    res.status(500).json({ error: 'Failed to disable sharing link' });
  }
});

// Get template by share token (public access)
router.get('/public/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;

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

    // Return template without sensitive information
    const publicTemplate = {
      _id: template._id,
      name: template.name,
      description: template.description,
      category: template.category,
      sections: template.sections,
      sharingConfig: {
        allowAnonymous: template.sharingConfig.allowAnonymous,
        expiresAt: template.sharingConfig.expiresAt
      }
    };

    res.json({ template: publicTemplate });
  } catch (error) {
    console.error('Get public template error:', error);
    res.status(500).json({ error: 'Failed to get form' });
  }
});

module.exports = router; 