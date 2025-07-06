const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Joi = require('joi');
const Template = require('../models/Template');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { preprocessTemplateData } = require('../utils/templateUtils');
const { generateFormTemplate, improveTemplate } = require('../utils/openaiService');

const router = express.Router();



// Validation schemas
const fieldSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(
    // Basic Fields
    'text', 'textarea', 'email', 'phone', 'number', 'select', 'radio', 'checkbox', 'checkboxGroup',
    // Advanced Fields  
    'date', 'time', 'file', 'rating', 'currency', 'url', 'password',
    // Layout Fields
    'divider', 'heading', 'paragraph',
    // Special Fields
    'payment', 'signature', 'repeater', 'address', 'image',
    // Legacy support
    'multiselect', 'datetime', 'location', 'media', 'qr-scan', 'drawing', 'repeatable-group'
  ).required(),
  label: Joi.string().required(),
  placeholder: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow(''),
  required: Joi.boolean().default(false),
  order: Joi.number().default(0),
  section: Joi.string().optional(),
  
  // Properties object for field-specific settings
  properties: Joi.object({
    width: Joi.string().valid('full', 'half', 'third', 'quarter').optional(),
    options: Joi.array().items(Joi.object({
      id: Joi.string().required(),
      label: Joi.string().required(),
      value: Joi.string().required()
    })).optional(),
    min: Joi.number().optional(),
    max: Joi.number().optional(),
    minLength: Joi.number().optional(),
    maxLength: Joi.number().optional(),
    step: Joi.number().optional(),
    pattern: Joi.string().optional(),
    multiple: Joi.boolean().optional(),
    accept: Joi.string().optional(),
    maxFileSize: Joi.number().optional(),
    maxFiles: Joi.number().optional(),
    level: Joi.number().optional(),
    content: Joi.string().optional(),
    amount: Joi.number().optional(),
    currency: Joi.string().optional(),
    showLabels: Joi.boolean().optional(),
    allowHalf: Joi.boolean().optional(),
    maxRating: Joi.number().optional()
  }).optional(),
  
  // Legacy options support
  options: Joi.array().items(Joi.object({
    value: Joi.string().required(),
    label: Joi.string().required(),
    id: Joi.string().optional()
  })).optional(),
  
  // Validation rules
  validation: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    value: Joi.any().optional(),
    message: Joi.string().required()
  })).optional(),
  
  // Conditional logic
  conditionalLogic: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    conditions: Joi.array().items(Joi.object({
      fieldId: Joi.string().required(),
      operator: Joi.string().required(),
      value: Joi.any().required()
    })).required(),
    action: Joi.string().required(),
    operator: Joi.string().valid('and', 'or').default('and')
  })).optional(),
  
  // Collaboration data
  collaborationData: Joi.object({
    lockedBy: Joi.string().optional(),
    comments: Joi.array().optional(),
    lastModified: Joi.date().optional(),
    lastModifiedBy: Joi.string().optional()
  }).optional(),
  
  // Legacy validation support
  helpText: Joi.string().optional(),
  helpFiles: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    url: Joi.string().required(),
    size: Joi.number().optional()
  })).optional(),
  
  _id: Joi.string().optional()
}).unknown(true);

const sectionSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  order: Joi.number().default(0),
  fields: Joi.array().items(fieldSchema).required(),
  collapsible: Joi.boolean().optional(),
  collapsed: Joi.boolean().optional(),
  isDefault: Joi.boolean().optional(),
  
  // Conditional logic for sections
  conditionalLogic: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    conditions: Joi.array().items(Joi.object({
      fieldId: Joi.string().required(),
      operator: Joi.string().required(),
      value: Joi.any().required()
    })).required(),
    action: Joi.string().required(),
    operator: Joi.string().valid('and', 'or').default('and')
  })).optional(),
  
  // Legacy support
  dependsOn: Joi.string().optional(),
  condition: Joi.string().optional(),
  value: Joi.any().optional()
}).unknown(true);

// Schema for creating new templates (all required fields)
const templateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  category: Joi.string().valid('construction', 'payroll', 'general', 'Business Setup').required(),
  sections: Joi.array().items(sectionSchema).required(),
  isActive: Joi.boolean().default(true),
  
  // Section navigation settings
  sectionNavigation: Joi.object({
    type: Joi.string().valid('linear', 'conditional', 'free').optional(),
    allowBackNavigation: Joi.boolean().optional(),
    showProgressBar: Joi.boolean().optional(),
    showSectionList: Joi.boolean().optional(),
    autoAdvance: Joi.boolean().optional()
  }).optional(),
  
  // Form settings
  settings: Joi.object({
    allowDrafts: Joi.boolean().optional(),
    requireLogin: Joi.boolean().optional(),
    allowAnonymous: Joi.boolean().optional(),
    redirectUrl: Joi.string().optional(),
    confirmationMessage: Joi.string().optional(),
    theme: Joi.string().optional(),
    primaryColor: Joi.string().optional(),
    backgroundColor: Joi.string().optional(),
    fontFamily: Joi.string().optional(),
    showProgressBar: Joi.boolean().optional(),
    allowSaveAndContinue: Joi.boolean().optional(),
    autoSave: Joi.boolean().optional(),
    autoSaveInterval: Joi.number().optional(),
    enableCollaboration: Joi.boolean().optional(),
    enableOfflineMode: Joi.boolean().optional(),
    enablePayments: Joi.boolean().optional(),
    enableSignatures: Joi.boolean().optional(),
    enableGPS: Joi.boolean().optional(),
    enableFileUploads: Joi.boolean().optional(),
    enableCaptcha: Joi.boolean().optional()
  }).optional(),
  
  // Legacy fields support (flat structure)
  fields: Joi.array().items(fieldSchema).optional(),
  
  // Version and collaboration
  version: Joi.number().optional(),
  collaborators: Joi.array().items(Joi.string()).optional()
}).unknown(true);

// Schema for updating templates (partial updates allowed)
const templateUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  category: Joi.string().valid('construction', 'payroll', 'general', 'Business Setup').optional(),
  sections: Joi.array().items(sectionSchema).optional(),
  isActive: Joi.boolean().optional(),
  
  // Section navigation settings
  sectionNavigation: Joi.object({
    type: Joi.string().valid('linear', 'conditional', 'free').optional(),
    allowBackNavigation: Joi.boolean().optional(),
    showProgressBar: Joi.boolean().optional(),
    showSectionList: Joi.boolean().optional(),
    autoAdvance: Joi.boolean().optional()
  }).optional(),
  
  // Form settings
  settings: Joi.object({
    allowDrafts: Joi.boolean().optional(),
    requireLogin: Joi.boolean().optional(),
    allowAnonymous: Joi.boolean().optional(),
    redirectUrl: Joi.string().optional(),
    confirmationMessage: Joi.string().optional(),
    theme: Joi.string().optional(),
    primaryColor: Joi.string().optional(),
    backgroundColor: Joi.string().optional(),
    fontFamily: Joi.string().optional(),
    showProgressBar: Joi.boolean().optional(),
    allowSaveAndContinue: Joi.boolean().optional(),
    autoSave: Joi.boolean().optional(),
    autoSaveInterval: Joi.number().optional(),
    enableCollaboration: Joi.boolean().optional(),
    enableOfflineMode: Joi.boolean().optional(),
    enablePayments: Joi.boolean().optional(),
    enableSignatures: Joi.boolean().optional(),
    enableGPS: Joi.boolean().optional(),
    enableFileUploads: Joi.boolean().optional(),
    enableCaptcha: Joi.boolean().optional()
  }).optional(),
  
  // Legacy fields support (flat structure)
  fields: Joi.array().items(fieldSchema).optional(),
  
  // Version and collaboration
  version: Joi.number().optional(),
  collaborators: Joi.array().items(Joi.string()).optional()
}).unknown(true);

// Get all templates (public endpoint for users)
router.get('/', async (req, res) => {
  try {
    const { category, isActive = 'true' } = req.query;
    
    const query = {};
    
    // Handle isActive filter
    if (isActive === 'all') {
      // Don't filter by isActive - return all templates
    } else {
      query.isActive = isActive === 'true';
    }
    
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
    // Preprocess the data to handle string validation fields
    const preprocessedData = preprocessTemplateData(req.body);
    
    const { error, value } = templateSchema.validate(preprocessedData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const template = new Template({
      ...value,
      createdBy: req.user._id
    });

    try {
      await template.save();
    } catch (saveError) {
      console.error('Template save error:', saveError);
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors).map(key => ({
          field: key,
          message: saveError.errors[key].message,
          value: saveError.errors[key].value
        }));
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationErrors 
        });
      }
      throw saveError;
    }
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
    console.log('Update template request body:', JSON.stringify(req.body, null, 2));
    
    // Preprocess the data to handle string validation fields
    const preprocessedData = preprocessTemplateData(req.body);
    console.log('Preprocessed data:', JSON.stringify(preprocessedData, null, 2));
    
    const { error, value } = templateUpdateSchema.validate(preprocessedData);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    let template;
    try {
      template = await Template.findByIdAndUpdate(
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
    } catch (updateError) {
      console.error('Template update error:', updateError);
      if (updateError.name === 'ValidationError') {
        const validationErrors = Object.keys(updateError.errors).map(key => ({
          field: key,
          message: updateError.errors[key].message,
          value: updateError.errors[key].value
        }));
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationErrors 
        });
      }
      throw updateError;
    }

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

// Admin: Generate template from AI prompt
router.post('/generate-ai', authenticateToken, requireAdmin, async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[AI Controller] ${requestId} - Starting AI template generation request`);
  console.log(`[AI Controller] ${requestId} - User: ${req.user.email} (${req.user._id})`);
  
  try {
    const { prompt } = req.body;
    console.log(`[AI Controller] ${requestId} - Received prompt: "${prompt?.substring(0, 100)}${prompt?.length > 100 ? '...' : ''}"`);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.log(`[AI Controller] ${requestId} - Validation failed: Invalid prompt`);
      return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
    }

    console.log(`[AI Controller] ${requestId} - Calling OpenAI service...`);
    // Generate template using OpenAI
    const result = await generateFormTemplate(prompt.trim());

    if (result.error) {
      console.log(`[AI Controller] ${requestId} - OpenAI service returned error: ${result.error}`);
      return res.status(400).json({ error: result.error });
    }

    console.log(`[AI Controller] ${requestId} - OpenAI service successful, saving to database...`);
    console.log(`[AI Controller] ${requestId} - Generated template: "${result.template.name}" with ${result.template.sections?.length} sections`);

    // Preprocess the AI-generated template data to ensure it matches the schema
    console.log(`[AI Controller] ${requestId} - Preprocessing template data for database validation...`);
    console.log(`[AI Controller] ${requestId} - Raw AI template data:`, JSON.stringify(result.template, null, 2));
    const preprocessedData = preprocessTemplateData(result.template);
    console.log(`[AI Controller] ${requestId} - Template data preprocessed successfully`);
    console.log(`[AI Controller] ${requestId} - Preprocessed template data:`, JSON.stringify(preprocessedData, null, 2));

    // Create the template in the database
    const template = new Template({
      ...preprocessedData,
      createdBy: req.user._id,
      isActive: true // AI generated templates start as active
    });

    try {
      await template.save();
      console.log(`[AI Controller] ${requestId} - Template saved to database with ID: ${template._id}`);
    } catch (saveError) {
      console.error(`[AI Controller] ${requestId} - Template save error:`, saveError);
      if (saveError.name === 'ValidationError') {
        console.error(`[AI Controller] ${requestId} - Validation errors:`, saveError.errors);
        const validationDetails = Object.keys(saveError.errors).map(key => ({
          field: key,
          message: saveError.errors[key].message,
          value: saveError.errors[key].value,
          path: saveError.errors[key].path
        }));
        console.error(`[AI Controller] ${requestId} - Detailed validation errors:`, validationDetails);
        return res.status(400).json({ 
          error: 'AI-generated template validation failed',
          details: validationDetails
        });
      }
      throw saveError;
    }
    
    await template.populate('createdBy', 'firstName lastName email');

    const endTime = Date.now();
    console.log(`[AI Controller] ${requestId} - Request completed successfully in ${endTime - startTime}ms`);

    res.status(201).json({
      message: 'AI template generated successfully',
      template
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`[AI Controller] ${requestId} - Request failed after ${endTime - startTime}ms:`, error);
    console.error(`[AI Controller] ${requestId} - Error stack:`, error.stack);
    
    // Check for specific database errors
    if (error.name === 'ValidationError') {
      console.error(`[AI Controller] ${requestId} - Database validation error:`, error.errors);
      return res.status(400).json({ 
        error: 'Template validation failed',
        details: Object.keys(error.errors).map(key => error.errors[key].message)
      });
    }
    
    if (error.code === 11000) {
      console.error(`[AI Controller] ${requestId} - Duplicate key error`);
      return res.status(400).json({ error: 'Template with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to generate AI template' });
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

    try {
      await template.save();
    } catch (saveError) {
      console.error('Template save error in sharing:', saveError);
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors).map(key => ({
          field: key,
          message: saveError.errors[key].message,
          value: saveError.errors[key].value
        }));
        return res.status(400).json({ 
          error: 'Template validation failed', 
          details: validationErrors 
        });
      }
      throw saveError;
    }

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

// Admin: Improve existing template with AI
router.post('/:id/improve', authenticateToken, requireAdmin, async (req, res) => {
  const requestId = `improve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[AI Controller] ${requestId} - Starting template improvement request`);
  console.log(`[AI Controller] ${requestId} - User: ${req.user.email} (${req.user._id})`);
  console.log(`[AI Controller] ${requestId} - Template ID: ${req.params.id}`);
  
  try {
    const templateId = req.params.id;
    const { feedback } = req.body;
    console.log(`[AI Controller] ${requestId} - Received feedback: "${feedback?.substring(0, 100)}${feedback?.length > 100 ? '...' : ''}"`);

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      console.log(`[AI Controller] ${requestId} - Validation failed: Invalid feedback`);
      return res.status(400).json({ error: 'Feedback is required and must be a non-empty string' });
    }

    console.log(`[AI Controller] ${requestId} - Finding template in database...`);
    const template = await Template.findById(templateId);
    if (!template) {
      console.log(`[AI Controller] ${requestId} - Template not found`);
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[AI Controller] ${requestId} - Found template: "${template.name}"`);
    console.log(`[AI Controller] ${requestId} - Calling OpenAI improvement service...`);
    
    const result = await improveTemplate(template.toObject(), feedback.trim());

    if (result.error) {
      console.log(`[AI Controller] ${requestId} - OpenAI improvement service returned error: ${result.error}`);
      return res.status(400).json({ error: result.error });
    }

    console.log(`[AI Controller] ${requestId} - OpenAI improvement successful, updating template in database...`);
    
    // Update the template with improvements
    Object.assign(template, result.template);
    template.updatedBy = req.user._id;
    template.updatedAt = new Date();

    await template.save();
    console.log(`[AI Controller] ${requestId} - Template updated successfully`);
    
    await template.populate('createdBy updatedBy', 'firstName lastName email');

    const endTime = Date.now();
    console.log(`[AI Controller] ${requestId} - Template improvement completed successfully in ${endTime - startTime}ms`);

    res.status(200).json({
      message: 'Template improved successfully',
      template
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`[AI Controller] ${requestId} - Template improvement failed after ${endTime - startTime}ms:`, error);
    console.error(`[AI Controller] ${requestId} - Error stack:`, error.stack);
    
    // Check for specific database errors
    if (error.name === 'ValidationError') {
      console.error(`[AI Controller] ${requestId} - Database validation error:`, error.errors);
      return res.status(400).json({ 
        error: 'Template validation failed during improvement',
        details: Object.keys(error.errors).map(key => error.errors[key].message)
      });
    }
    
    res.status(500).json({ error: 'Failed to improve template' });
  }
});

module.exports = router; 