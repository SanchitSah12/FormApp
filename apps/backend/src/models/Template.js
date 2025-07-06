const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
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
    ]
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String
  },
  description: {
    type: String
  },
  required: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  section: {
    type: String
  },
  
  // Properties object for field-specific settings
  properties: {
    width: {
      type: String,
      enum: ['full', 'half', 'third', 'quarter']
    },
    options: [{
      id: String,
      label: String,
      value: String
    }],
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    step: Number,
    pattern: String,
    multiple: Boolean,
    accept: String,
    maxFileSize: Number,
    maxFiles: Number,
    level: Number,
    content: String,
    amount: Number,
    currency: String,
    showLabels: Boolean,
    allowHalf: Boolean,
    maxRating: Number
  },
  
  // Legacy options support
  options: [{
    value: String,
    label: String,
    id: String
  }],
  
  // Validation rules
  validation: [{
    id: String,
    type: String,
    value: mongoose.Schema.Types.Mixed,
    message: String
  }],
  
  // Conditional logic
  conditionalLogic: [{
    id: String,
    conditions: [{
      fieldId: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed
    }],
    action: String,
    operator: {
      type: String,
      enum: ['and', 'or'],
      default: 'and'
    }
  }],
  
  // Collaboration data
  collaborationData: {
    lockedBy: String,
    comments: [mongoose.Schema.Types.Mixed],
    lastModified: Date,
    lastModifiedBy: String
  },
  
  // Legacy validation support
  helpText: {
    type: String
  },
  helpFiles: [{
    name: String,
    url: String,
    size: Number
  }]
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
  order: {
    type: Number,
    default: 0
  },
  fields: [fieldSchema],
  collapsible: {
    type: Boolean,
    default: false
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Conditional logic for sections
  conditionalLogic: [{
    id: String,
    conditions: [{
      fieldId: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed
    }],
    action: String,
    operator: {
      type: String,
      enum: ['and', 'or'],
      default: 'and'
    }
  }],
  
  // Legacy support
  dependsOn: String,
  condition: String,
  value: mongoose.Schema.Types.Mixed
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
  
  // Section navigation settings
  sectionNavigation: {
    type: {
      type: String,
      enum: ['linear', 'conditional', 'free']
    },
    allowBackNavigation: Boolean,
    showProgressBar: Boolean,
    showSectionList: Boolean,
    autoAdvance: Boolean
  },
  
  // Form settings
  settings: {
    allowDrafts: Boolean,
    requireLogin: Boolean,
    allowAnonymous: Boolean,
    redirectUrl: String,
    confirmationMessage: String,
    theme: String,
    primaryColor: String,
    backgroundColor: String,
    fontFamily: String,
    showProgressBar: Boolean,
    allowSaveAndContinue: Boolean,
    autoSave: Boolean,
    autoSaveInterval: Number,
    enableCollaboration: Boolean,
    enableOfflineMode: Boolean,
    enablePayments: Boolean,
    enableSignatures: Boolean,
    enableGPS: Boolean,
    enableFileUploads: Boolean,
    enableCaptcha: Boolean
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
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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