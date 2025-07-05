const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for public submissions
  },
  responses: {
    type: mongoose.Schema.Types.Mixed, // Flexible JSON structure
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
    default: 'draft'
  },
  submittedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentSection: {
    type: String // section id where user left off
  },
  uploadedFiles: [{
    fieldId: String,
    originalName: String,
    filename: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Fields for public submissions
  submitterInfo: {
    name: String,
    email: String,
    phone: String,
    company: String,
    notes: String
  },
  sessionId: {
    type: String, // For tracking anonymous user sessions
    sparse: true
  },
  isPublicSubmission: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
responseSchema.index({ templateId: 1, userId: 1 });
responseSchema.index({ status: 1 });
responseSchema.index({ submittedAt: 1 });

// Method to calculate completion percentage
responseSchema.methods.calculateCompletion = function(template) {
  if (!template || !template.sections) return 0;
  
  let totalFields = 0;
  let completedFields = 0;
  
  template.sections.forEach(section => {
    section.fields.forEach(field => {
      totalFields++;
      if (this.responses[field.id] !== undefined && this.responses[field.id] !== null && this.responses[field.id] !== '') {
        completedFields++;
      }
    });
  });
  
  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
};

module.exports = mongoose.model('Response', responseSchema); 