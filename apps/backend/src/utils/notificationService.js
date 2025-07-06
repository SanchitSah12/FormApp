const nodemailer = require('nodemailer');
const User = require('../models/User');
const Template = require('../models/Template');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.ENABLE_EMAIL_NOTIFICATIONS || process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      console.log('Email notifications are disabled');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email transporter verification failed:', error);
        } else {
          console.log('Email transporter is ready to send messages');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async getAdminEmails() {
    try {
      const admins = await User.find({ 
        role: { $in: ['admin', 'superadmin'] }, 
        isActive: true,
        email: { $exists: true, $ne: '' }
      }).select('email firstName lastName');
      
      return admins.map(admin => ({
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`.trim()
      }));
    } catch (error) {
      console.error('Failed to fetch admin emails:', error);
      return [];
    }
  }

  generateFormSubmissionEmail(templateName, submitterInfo, responseId, isPublic = false) {
    const submitterName = submitterInfo?.name || 
                          (submitterInfo?.firstName && submitterInfo?.lastName ? 
                           `${submitterInfo.firstName} ${submitterInfo.lastName}` : 
                           'Anonymous User');
    
    const submitterEmail = submitterInfo?.email || 'Not provided';
    const submitterCompany = submitterInfo?.company || submitterInfo?.companyName || 'Not provided';
    
    const subject = `New Form Submission: ${templateName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .info-table th { background-color: #e2e8f0; font-weight: bold; }
          .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .badge { display: inline-block; background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Form Submission</h1>
            <p>A ${isPublic ? 'public' : 'user'} form has been submitted</p>
          </div>
          <div class="content">
            <h2>Form Details</h2>
            <table class="info-table">
              <tr>
                <th>Form Name</th>
                <td>${templateName}</td>
              </tr>
              <tr>
                <th>Submission Type</th>
                <td><span class="badge">${isPublic ? 'Public Submission' : 'User Submission'}</span></td>
              </tr>
              <tr>
                <th>Submitted By</th>
                <td>${submitterName}</td>
              </tr>
              <tr>
                <th>Email</th>
                <td>${submitterEmail}</td>
              </tr>
              <tr>
                <th>Company</th>
                <td>${submitterCompany}</td>
              </tr>
              <tr>
                <th>Submission Time</th>
                <td>${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <th>Response ID</th>
                <td>${responseId}</td>
              </tr>
            </table>
            
            <div style="text-align: center;">
              <a href="${process.env.CORS_ORIGIN}/responses/${responseId}" class="button">
                View Response Details
              </a>
            </div>
            
            ${submitterInfo?.notes ? `
              <h3>Additional Notes</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                ${submitterInfo.notes}
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification from Form App</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Form Submission: ${templateName}

Form Details:
- Form Name: ${templateName}
- Submission Type: ${isPublic ? 'Public Submission' : 'User Submission'}
- Submitted By: ${submitterName}
- Email: ${submitterEmail}
- Company: ${submitterCompany}
- Submission Time: ${new Date().toLocaleString()}
- Response ID: ${responseId}

${submitterInfo?.notes ? `Additional Notes: ${submitterInfo.notes}` : ''}

View response details: ${process.env.CORS_ORIGIN}/responses/${responseId}

---
This is an automated notification from Form App
`;

    return { subject, html, text };
  }

  async sendFormSubmissionNotification(templateId, responseId, submitterInfo, isPublic = false) {
    if (!this.transporter) {
      console.log('Email transporter not available, skipping notification');
      return false;
    }

    try {
      // Get template details
      const template = await Template.findById(templateId).select('name');
      if (!template) {
        console.error('Template not found for notification:', templateId);
        return false;
      }

      // Get admin emails
      const adminContacts = await this.getAdminEmails();
      if (adminContacts.length === 0) {
        console.log('No admin emails found, skipping notification');
        return false;
      }

      // Generate email content
      const emailContent = this.generateFormSubmissionEmail(
        template.name, 
        submitterInfo, 
        responseId, 
        isPublic
      );

      // Send email to each admin
      const emailPromises = adminContacts.map(admin => {
        return this.transporter.sendMail({
          from: `"${process.env.FROM_NAME || 'Form App'}" <${process.env.FROM_EMAIL}>`,
          to: admin.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });
      });

      await Promise.all(emailPromises);
      
      console.log(`Form submission notification sent to ${adminContacts.length} admins for response ${responseId}`);
      return true;
    } catch (error) {
      console.error('Failed to send form submission notification:', error);
      return false;
    }
  }

  async sendCustomNotification(to, subject, content, isHtml = false) {
    if (!this.transporter) {
      console.log('Email transporter not available, skipping custom notification');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'Form App'}" <${process.env.FROM_EMAIL}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject
      };

      if (isHtml) {
        mailOptions.html = content;
      } else {
        mailOptions.text = content;
      }

      await this.transporter.sendMail(mailOptions);
      console.log(`Custom notification sent to: ${mailOptions.to}`);
      return true;
    } catch (error) {
      console.error('Failed to send custom notification:', error);
      return false;
    }
  }

  async testEmailConfiguration() {
    if (!this.transporter) {
      return { success: false, error: 'Email transporter not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService; 