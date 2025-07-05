const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'email', 'number', 'select', 'multiselect', 'file', 'textarea', 'checkbox', 'radio', 'date', 'phone']
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    value: String,
    label: String
  }],
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    message: String
  },
  helpText: {
    type: String
  },
  helpFiles: [{
    name: String,
    url: String,
    size: Number
  }],
  conditionalLogic: {
    dependsOn: String, // field id
    condition: String, // equals, not_equals, contains, etc.
    value: mongoose.Schema.Types.Mixed
  },
  order: {
    type: Number,
    default: 0
  }
});

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  fields: [fieldSchema],
  order: {
    type: Number,
    default: 0
  },
  conditionalLogic: {
    dependsOn: String, // field id from previous sections
    condition: String,
    value: mongoose.Schema.Types.Mixed
  }
});

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    required: true,
    enum: ['construction', 'payroll', 'general']
  },
  sections: [sectionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sharingConfig: {
    isPublic: {
      type: Boolean,
      default: false
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true
    },
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Index for better performance
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Template', templateSchema); 