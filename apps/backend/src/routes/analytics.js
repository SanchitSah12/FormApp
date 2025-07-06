const express = require('express');
const mongoose = require('mongoose');
const Template = require('../models/Template');
const Response = require('../models/Response');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const json2csv = require('json2csv');
const xlsx = require('xlsx');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30d', templateId } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    const templateFilter = templateId ? { templateId: new mongoose.Types.ObjectId(templateId) } : {};
    const combinedFilter = { ...dateFilter, ...templateFilter };

    // Get basic statistics
    const [
      totalResponses,
      submittedResponses,
      draftResponses,
      averageCompletion,
      totalUsers,
      activeTemplates,
      totalRevenue
    ] = await Promise.all([
      Response.countDocuments(combinedFilter),
      Response.countDocuments({ ...combinedFilter, status: 'submitted' }),
      Response.countDocuments({ ...combinedFilter, status: 'draft' }),
      Response.aggregate([
        { $match: combinedFilter },
        { $group: { _id: null, avg: { $avg: '$completionPercentage' } } }
      ]),
      User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Template.countDocuments({ isActive: true }),
      Response.aggregate([
        { $match: { ...combinedFilter, 'paymentInfo.status': 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$paymentInfo.amount' } } }
      ])
    ]);

    // Get submissions over time
    const submissionsOverTime = await Response.aggregate([
      { $match: combinedFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get template performance
    const templatePerformance = await Response.aggregate([
      { $match: combinedFilter },
      {
        $group: {
          _id: '$templateId',
          totalResponses: { $sum: 1 },
          submittedResponses: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          averageCompletion: { $avg: '$completionPercentage' },
          revenue: { $sum: '$paymentInfo.amount' }
        }
      },
      {
        $lookup: {
          from: 'templates',
          localField: '_id',
          foreignField: '_id',
          as: 'template'
        }
      },
      { $unwind: '$template' },
      {
        $project: {
          templateName: '$template.name',
          totalResponses: 1,
          submittedResponses: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$submittedResponses', '$totalResponses'] },
              100
            ]
          },
          averageCompletion: 1,
          revenue: 1
        }
      },
      { $sort: { totalResponses: -1 } }
    ]);

    // Get drop-off analysis
    const dropOffAnalysis = await Response.aggregate([
      { $match: combinedFilter },
      {
        $group: {
          _id: '$completionPercentage',
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get user activity
    const userActivity = await Response.aggregate([
      { $match: combinedFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$userId',
          userName: { $first: { $concat: ['$user.firstName', ' ', '$user.lastName'] } },
          userEmail: { $first: '$user.email' },
          totalResponses: { $sum: 1 },
          submittedResponses: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          lastActivity: { $max: '$updatedAt' }
        }
      },
      { $sort: { totalResponses: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      summary: {
        totalResponses,
        submittedResponses,
        draftResponses,
        completionRate: submittedResponses > 0 ? ((submittedResponses / totalResponses) * 100).toFixed(1) : 0,
        averageCompletion: averageCompletion[0]?.avg || 0,
        totalUsers,
        activeTemplates,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      submissionsOverTime,
      templatePerformance,
      dropOffAnalysis,
      userActivity
    });
  } catch (error) {
    console.error('Analytics fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get template-specific analytics
router.get('/template/:templateId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { period = '30d' } = req.query;

    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period.replace('d', '')));

    const filter = {
      templateId: new mongoose.Types.ObjectId(templateId),
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Get field-level analytics
    const fieldAnalytics = await Response.aggregate([
      { $match: filter },
      { $unwind: { path: '$responses', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$responses.fieldId',
          totalResponses: { $sum: 1 },
          filledResponses: { $sum: { $cond: [{ $ne: ['$responses.value', null] }, 1, 0] } },
          values: { $push: '$responses.value' }
        }
      },
      {
        $project: {
          fieldId: '$_id',
          totalResponses: 1,
          filledResponses: 1,
          fillRate: {
            $multiply: [
              { $divide: ['$filledResponses', '$totalResponses'] },
              100
            ]
          }
        }
      }
    ]);

    // Get completion funnel
    const completionFunnel = await Response.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$completionPercentage', 0] }, then: 'Not Started' },
                { case: { $and: [{ $gt: ['$completionPercentage', 0] }, { $lt: ['$completionPercentage', 25] }] }, then: '0-25%' },
                { case: { $and: [{ $gte: ['$completionPercentage', 25] }, { $lt: ['$completionPercentage', 50] }] }, then: '25-50%' },
                { case: { $and: [{ $gte: ['$completionPercentage', 50] }, { $lt: ['$completionPercentage', 75] }] }, then: '50-75%' },
                { case: { $and: [{ $gte: ['$completionPercentage', 75] }, { $lt: ['$completionPercentage', 100] }] }, then: '75-99%' },
                { case: { $eq: ['$completionPercentage', 100] }, then: 'Completed' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get time-based analytics
    const timeAnalytics = await Response.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            day: { $dayOfWeek: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      template: {
        id: template._id,
        name: template.name,
        description: template.description
      },
      fieldAnalytics,
      completionFunnel,
      timeAnalytics
    });
  } catch (error) {
    console.error('Template analytics fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch template analytics' });
  }
});

// Generate custom report
router.post('/custom-report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      templateIds,
      startDate,
      endDate,
      metrics,
      groupBy,
      filters,
      format = 'json'
    } = req.body;

    // Build query
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (templateIds && templateIds.length > 0) {
      query.templateId = { $in: templateIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (filters) {
      Object.keys(filters).forEach(key => {
        query[key] = filters[key];
      });
    }

    // Build aggregation pipeline
    const pipeline = [{ $match: query }];

    // Add grouping
    if (groupBy) {
      const groupStage = {
        $group: {
          _id: groupBy === 'template' ? '$templateId' : `$${groupBy}`,
          count: { $sum: 1 }
        }
      };

      // Add requested metrics
      if (metrics.includes('averageCompletion')) {
        groupStage.$group.averageCompletion = { $avg: '$completionPercentage' };
      }
      if (metrics.includes('revenue')) {
        groupStage.$group.revenue = { $sum: '$paymentInfo.amount' };
      }

      pipeline.push(groupStage);
    }

    // Add template lookup if grouping by template
    if (groupBy === 'template') {
      pipeline.push({
        $lookup: {
          from: 'templates',
          localField: '_id',
          foreignField: '_id',
          as: 'template'
        }
      });
      pipeline.push({ $unwind: '$template' });
    }

    const results = await Response.aggregate(pipeline);

    // Format results based on requested format
    if (format === 'csv') {
      const fields = ['_id', 'count'];
      if (metrics.includes('averageCompletion')) fields.push('averageCompletion');
      if (metrics.includes('revenue')) fields.push('revenue');

      const csv = json2csv.parse(results, { fields });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="custom_report.csv"');
      res.send(csv);
    } else if (format === 'xlsx') {
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(results);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Report');
      
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="custom_report.xlsx"');
      res.send(buffer);
    } else {
      res.json({ results });
    }
  } catch (error) {
    console.error('Custom report generation failed:', error);
    res.status(500).json({ error: 'Failed to generate custom report' });
  }
});

// Schedule automated reports
router.post('/schedule-report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      schedule, // cron expression
      templateIds,
      metrics,
      recipients,
      format = 'csv'
    } = req.body;

    // Validate cron expression
    if (!cron.validate(schedule)) {
      return res.status(400).json({ error: 'Invalid cron schedule' });
    }

    // Store scheduled report configuration
    const scheduledReport = {
      id: new mongoose.Types.ObjectId(),
      name,
      schedule,
      templateIds,
      metrics,
      recipients,
      format,
      createdBy: req.user._id,
      createdAt: new Date(),
      isActive: true
    };

    // Schedule the report
    cron.schedule(schedule, async () => {
      try {
        await generateAndSendReport(scheduledReport);
      } catch (error) {
        console.error('Scheduled report generation failed:', error);
      }
    });

    res.json({ success: true, reportId: scheduledReport.id });
  } catch (error) {
    console.error('Report scheduling failed:', error);
    res.status(500).json({ error: 'Failed to schedule report' });
  }
});

// A/B testing analytics
router.get('/ab-testing/:templateId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { period = '30d' } = req.query;

    // Get template variants (assuming versions represent A/B variants)
    const variants = await Template.find({
      $or: [
        { _id: new mongoose.Types.ObjectId(templateId) },
        { originalTemplateId: new mongoose.Types.ObjectId(templateId) }
      ]
    });

    const results = await Promise.all(
      variants.map(async (variant) => {
        const responses = await Response.aggregate([
          { $match: { templateId: variant._id } },
          {
            $group: {
              _id: null,
              totalResponses: { $sum: 1 },
              submissions: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
              averageCompletion: { $avg: '$completionPercentage' },
              revenue: { $sum: '$paymentInfo.amount' }
            }
          }
        ]);

        const stats = responses[0] || {
          totalResponses: 0,
          submissions: 0,
          averageCompletion: 0,
          revenue: 0
        };

        return {
          variant: variant.name,
          version: variant.version,
          ...stats,
          conversionRate: stats.totalResponses > 0 ? (stats.submissions / stats.totalResponses) * 100 : 0
        };
      })
    );

    res.json({ variants: results });
  } catch (error) {
    console.error('A/B testing analytics failed:', error);
    res.status(500).json({ error: 'Failed to fetch A/B testing analytics' });
  }
});

// Helper function to generate and send reports
async function generateAndSendReport(reportConfig) {
  try {
    // Generate report data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const query = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (reportConfig.templateIds && reportConfig.templateIds.length > 0) {
      query.templateId = { $in: reportConfig.templateIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const data = await Response.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$templateId',
          totalResponses: { $sum: 1 },
          submissions: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          averageCompletion: { $avg: '$completionPercentage' },
          revenue: { $sum: '$paymentInfo.amount' }
        }
      },
      {
        $lookup: {
          from: 'templates',
          localField: '_id',
          foreignField: '_id',
          as: 'template'
        }
      },
      { $unwind: '$template' },
      {
        $project: {
          templateName: '$template.name',
          totalResponses: 1,
          submissions: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$submissions', '$totalResponses'] },
              100
            ]
          },
          averageCompletion: 1,
          revenue: 1
        }
      }
    ]);

    // Generate file
    let attachment;
    if (reportConfig.format === 'csv') {
      const csv = json2csv.parse(data);
      attachment = {
        filename: `report_${new Date().toISOString().split('T')[0]}.csv`,
        content: csv
      };
    } else if (reportConfig.format === 'xlsx') {
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Report');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      attachment = {
        filename: `report_${new Date().toISOString().split('T')[0]}.xlsx`,
        content: buffer
      };
    }

    // Send email
    const transporter = nodemailer.createTransporter({
      // Configure your email service
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: reportConfig.recipients.join(', '),
      subject: `Scheduled Report: ${reportConfig.name}`,
      text: `Please find attached the scheduled report: ${reportConfig.name}`,
      attachments: [attachment]
    });

    console.log(`Scheduled report sent: ${reportConfig.name}`);
  } catch (error) {
    console.error('Report generation and sending failed:', error);
  }
}

module.exports = router;