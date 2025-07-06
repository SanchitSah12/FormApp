const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'email', 'number', 'select', 'multiselect', 'file', 'textarea', 'checkbox', 'radio', 'date', 'phone', 'signature', 'payment', 'location', 'media', 'qr-scan', 'drawing', 'repeatable-group']
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
    enum: ['construction', 'payroll', 'general', 'Business Setup']
  },
  sections: [sectionSchema],
  fields: [fieldSchema], // Support for flat field structure
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
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [{
    _id: String,
    fieldId: String,
    parentId: String,
    text: String,
    author: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      firstName: String,
      lastName: String,
      email: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  }],
  approvalWorkflow: {
    enabled: {
      type: Boolean,
      default: false
    },
    stages: [{
      name: String,
      description: String,
      approvers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      requiredApprovals: {
        type: Number,
        default: 1
      },
      order: Number
    }]
  },
  offlineSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    gpsRequired: {
      type: Boolean,
      default: false
    },
    mediaCapture: {
      type: Boolean,
      default: false
    },
    qrScanning: {
      type: Boolean,
      default: false
    }
  },
  localization: {
    enabled: {
      type: Boolean,
      default: false
    },
    defaultLanguage: {
      type: String,
      default: 'en'
    },
    supportedLanguages: [{
      code: String,
      name: String
    }],
    translations: mongoose.Schema.Types.Mixed
  },
  accessibility: {
    enabled: {
      type: Boolean,
      default: false
    },
    highContrast: {
      type: Boolean,
      default: false
    },
    screenReader: {
      type: Boolean,
      default: false
    },
    keyboardNavigation: {
      type: Boolean,
      default: false
    }
  },
  paymentSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    stripeSettings: {
      publishableKey: String,
      priceId: String,
      amount: Number,
      currency: {
        type: String,
        default: 'usd'
      }
    },
    paypalSettings: {
      clientId: String,
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    }
  },
  signatureSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    fields: [String] // Field IDs that require signatures
  }
}, {
  timestamps: true
});

// Index for better performance
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Template', templateSchema); 