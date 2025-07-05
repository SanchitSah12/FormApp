const express = require('express');
const mongoose = require('mongoose');
const { parse } = require('json2csv');
const XLSX = require('xlsx');
const Response = require('../models/Response');
const Template = require('../models/Template');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper function to flatten response data
const flattenResponseData = (responses, template) => {
  const flatData = [];
  
  responses.forEach(response => {
    const row = {
      'Response ID': response._id,
      'User Name': `${response.userId.firstName} ${response.userId.lastName}`,
      'User Email': response.userId.email,
      'Company Name': response.userId.companyName || '',
      'Template Name': response.templateId.name,
      'Status': response.status,
      'Completion %': response.completionPercentage,
      'Submitted At': response.submittedAt || '',
      'Created At': response.createdAt,
      'Updated At': response.updatedAt
    };

    // Add dynamic fields from template
    if (template && template.sections) {
      template.sections.forEach(section => {
        section.fields.forEach(field => {
          const fieldKey = `${section.title} - ${field.label}`;
          let value = response.responses[field.id];
          
          // Handle different field types
          if (Array.isArray(value)) {
            value = value.join(', ');
          } else if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          
          row[fieldKey] = value || '';
        });
      });
    }

    flatData.push(row);
  });

  return flatData;
};

// Export responses as CSV
router.get('/csv', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId, status, startDate, endDate } = req.query;

    // Build query
    const query = {};
    if (templateId) query.templateId = templateId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get responses with populated data
    const responses = await Response.find(query)
      .populate('templateId')
      .populate('userId', 'firstName lastName email companyName')
      .sort({ createdAt: -1 });

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for export' });
    }

    // Get template for field structure
    const template = responses[0].templateId;
    
    // Flatten data
    const flatData = flattenResponseData(responses, template);

    // Convert to CSV
    const csv = parse(flatData);

    // Set headers for file download
    const filename = `responses_${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export responses as Excel
router.get('/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId, status, startDate, endDate } = req.query;

    // Build query
    const query = {};
    if (templateId) query.templateId = templateId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get responses with populated data
    const responses = await Response.find(query)
      .populate('templateId')
      .populate('userId', 'firstName lastName email companyName')
      .sort({ createdAt: -1 });

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for export' });
    }

    // Get template for field structure
    const template = responses[0].templateId;
    
    // Flatten data
    const flatData = flattenResponseData(responses, template);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatData);

    // Auto-size columns
    const colWidths = [];
    const headers = Object.keys(flatData[0] || {});
    headers.forEach((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...flatData.map(row => String(row[header] || '').length)
      );
      colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const filename = `responses_${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
});

// Export template structure as JSON
router.get('/template/:id/json', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const filename = `template_${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(template);
  } catch (error) {
    console.error('Template JSON export error:', error);
    res.status(500).json({ error: 'Failed to export template' });
  }
});

// Export summary statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId, format = 'json' } = req.query;

    const matchStage = templateId ? { templateId: mongoose.Types.ObjectId(templateId) } : {};

    // Get basic statistics
    const totalResponses = await Response.countDocuments(matchStage);
    
    const statusStats = await Response.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const completionStats = await Response.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' },
          minCompletion: { $min: '$completionPercentage' },
          maxCompletion: { $max: '$completionPercentage' }
        }
      }
    ]);

    const timeStats = await Response.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const statsData = {
      totalResponses,
      statusBreakdown: statusStats,
      completionStats: completionStats[0] || {
        avgCompletion: 0,
        minCompletion: 0,
        maxCompletion: 0
      },
      dailyStats: timeStats,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Convert to CSV format
      const flatStats = [
        { metric: 'Total Responses', value: totalResponses },
        { metric: 'Average Completion %', value: statsData.completionStats.avgCompletion },
        { metric: 'Min Completion %', value: statsData.completionStats.minCompletion },
        { metric: 'Max Completion %', value: statsData.completionStats.maxCompletion }
      ];

      // Add status breakdown
      statusStats.forEach(stat => {
        flatStats.push({
          metric: `Status: ${stat._id}`,
          value: stat.count
        });
      });

      const csv = parse(flatStats);

      const filename = `stats_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      // Return as JSON
      res.json(statsData);
    }
  } catch (error) {
    console.error('Stats export error:', error);
    res.status(500).json({ error: 'Failed to export statistics' });
  }
});

// Export responses for a specific template as CSV
router.get('/template/:templateId/csv', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Build query
    const query = { templateId };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get responses with populated data
    const responses = await Response.find(query)
      .populate('templateId')
      .populate('userId', 'firstName lastName email companyName')
      .sort({ createdAt: -1 });

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for this template' });
    }

    // Get template for field structure
    const template = responses[0].templateId;
    
    // Flatten data
    const flatData = flattenResponseData(responses, template);

    // Convert to CSV
    const csv = parse(flatData);

    // Set headers for file download
    const filename = `${template.name.replace(/\s+/g, '_')}_responses_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csv);
  } catch (error) {
    console.error('Template CSV export error:', error);
    res.status(500).json({ error: 'Failed to export template responses as CSV' });
  }
});

// Export responses for a specific template as Excel
router.get('/template/:templateId/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Build query
    const query = { templateId };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get responses with populated data
    const responses = await Response.find(query)
      .populate('templateId')
      .populate('userId', 'firstName lastName email companyName')
      .sort({ createdAt: -1 });

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for this template' });
    }

    // Get template for field structure
    const template = responses[0].templateId;
    
    // Flatten data
    const flatData = flattenResponseData(responses, template);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatData);

    // Auto-size columns
    const colWidths = [];
    const headers = Object.keys(flatData[0] || {});
    headers.forEach((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...flatData.map(row => String(row[header] || '').length)
      );
      colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const filename = `${template.name.replace(/\s+/g, '_')}_responses_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Template Excel export error:', error);
    res.status(500).json({ error: 'Failed to export template responses as Excel' });
  }
});

// Get responses for a specific template (for viewing)
router.get('/template/:templateId/responses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      search = '' 
    } = req.query;
    
    const query = { templateId };
    if (status) {
      query.status = status;
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

    // Get template info
    const template = await Template.findById(templateId);

    res.json({
      responses: results,
      template,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get template responses error:', error);
    res.status(500).json({ error: 'Failed to get template responses' });
  }
});

module.exports = router; 