const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailNotifications: {
    formSubmissions: {
      type: Boolean,
      default: true
    },
    formResponses: {
      type: Boolean,
      default: true
    },
    systemUpdates: {
      type: Boolean,
      default: true
    },
    weeklyReports: {
      type: Boolean,
      default: false
    }
  },
  // Template-specific notification preferences
  templateNotifications: [{
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template'
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  // Notification frequency
  frequency: {
    type: String,
    enum: ['immediate', 'hourly', 'daily', 'weekly'],
    default: 'immediate'
  },
  // Quiet hours (24-hour format)
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String, // Format: "HH:MM"
      default: "22:00"
    },
    endTime: {
      type: String, // Format: "HH:MM"
      default: "08:00"
    },
    timezone: {
      type: String,
      default: "UTC"
    }
  }
}, {
  timestamps: true
});

const notificationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for public submissions and system notifications
  },
  type: {
    type: String,
    enum: ['form_submission', 'form_response', 'system_update', 'weekly_report', 'custom'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // Can reference Response, Template, or other models
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Response', 'Template', 'User']
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'read'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  deliveryMethod: {
    type: String,
    enum: ['email', 'in_app', 'push'],
    default: 'email'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Additional data like email details, etc.
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationPreferenceSchema.index({ userId: 1 });
notificationHistorySchema.index({ userId: 1, createdAt: -1 });
notificationHistorySchema.index({ status: 1, sentAt: 1 });
notificationHistorySchema.index({ type: 1, createdAt: -1 });

const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);
const NotificationHistory = mongoose.model('NotificationHistory', notificationHistorySchema);

module.exports = {
  NotificationPreference,
  NotificationHistory
}; 