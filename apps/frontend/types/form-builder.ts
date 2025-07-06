export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    description?: string;
    required: boolean;
    order: number;
    section?: string;
    validation?: ValidationRule[];
    conditionalLogic?: ConditionalLogic[];
    properties: FieldProperties;
    collaborationData?: {
        lockedBy?: string;
        comments?: FieldComment[];
        lastModified?: Date;
        lastModifiedBy?: string;
    };
}

export type FieldType =
    | 'text'
    | 'textarea'
    | 'email'
    | 'phone'
    | 'number'
    | 'select'
    | 'multiselect'
    | 'radio'
    | 'checkbox'
    | 'checkboxGroup'
    | 'date'
    | 'time'
    | 'datetime'
    | 'file'
    | 'image'
    | 'signature'
    | 'rating'
    | 'slider'
    | 'address'
    | 'currency'
    | 'url'
    | 'password'
    | 'hidden'
    | 'divider'
    | 'heading'
    | 'paragraph'
    | 'payment'
    | 'repeater';

export interface FieldProperties {
    // Common properties
    width?: 'full' | 'half' | 'third' | 'quarter';
    cssClasses?: string;

    // Text fields
    minLength?: number;
    maxLength?: number;
    pattern?: string;

    // Number fields
    min?: number;
    max?: number;
    step?: number;

    // Select/Radio/Checkbox
    options?: FieldOption[];
    allowOther?: boolean;

    // File fields
    accept?: string;
    maxFileSize?: number;
    maxFiles?: number;

    // Date/Time fields
    minDate?: string;
    maxDate?: string;
    format?: string;

    // Layout fields
    content?: string; // For heading/paragraph
    level?: number; // For heading

    // Advanced
    defaultValue?: any;
    readOnly?: boolean;
    calculations?: string;

    // Payment fields
    amount?: number;
    currency?: string;
    paymentMethods?: string[];

    // Repeater fields
    minRepeats?: number;
    maxRepeats?: number;
    repeatFields?: FormField[];
}

export interface FieldOption {
    id: string;
    label: string;
    value: string;
    selected?: boolean;
    color?: string;
    image?: string;
}

export interface ValidationRule {
    id: string;
    type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
    value?: any;
    message: string;
    condition?: string;
}

export interface ConditionalLogic {
    id: string;
    action: 'show' | 'hide' | 'require' | 'setValue' | 'jumpToSection';
    conditions: LogicCondition[];
    operator: 'and' | 'or';
    targetSectionId?: string; // For jumpToSection action
}

export interface LogicCondition {
    fieldId: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'notEmpty';
    value: any;
}

export interface FieldComment {
    id: string;
    fieldId: string;
    parentId?: string;
    text: string;
    author: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: Date;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
}

export interface FormSection {
    id: string;
    title: string;
    description?: string;
    order: number;
    fields: FormField[];
    collapsible?: boolean;
    collapsed?: boolean;
    conditionalLogic?: SectionConditionalLogic[];
    isDefault?: boolean; // Marks the default section to show first
}

export interface SectionConditionalLogic {
    id: string;
    action: 'showSection' | 'hideSection' | 'jumpToSection';
    conditions: LogicCondition[];
    operator: 'and' | 'or';
    targetSectionId?: string; // For jumpToSection action
    priority?: number; // Higher priority rules are evaluated first
}

export interface FormTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    sections: FormSection[];
    settings: FormSettings;
    version: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    collaborators?: string[];
    sectionNavigation?: SectionNavigationSettings;
}

export interface SectionNavigationSettings {
    type: 'linear' | 'conditional' | 'freeform';
    allowBackNavigation: boolean;
    showProgressBar: boolean;
    showSectionList: boolean;
    autoAdvance: boolean; // Automatically advance to next section when complete
    conditionalRules?: GlobalConditionalRule[];
}

export interface GlobalConditionalRule {
    id: string;
    name: string;
    description?: string;
    conditions: LogicCondition[];
    operator: 'and' | 'or';
    actions: ConditionalAction[];
    priority: number;
}

export interface ConditionalAction {
    type: 'jumpToSection' | 'showSection' | 'hideSection' | 'skipSection' | 'endForm';
    targetSectionId?: string;
    message?: string; // Optional message to show user
}

export interface FormSettings {
    // General
    allowDrafts: boolean;
    requireLogin: boolean;
    allowAnonymous: boolean;

    // Submission
    redirectUrl?: string;
    confirmationMessage?: string;
    emailNotifications?: EmailNotification[];

    // Appearance
    theme: 'default' | 'minimal' | 'modern' | 'classic';
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;

    // Behavior
    showProgressBar: boolean;
    allowSaveAndContinue: boolean;
    autoSave: boolean;
    autoSaveInterval: number;

    // Advanced
    enableCollaboration: boolean;
    enableOfflineMode: boolean;
    enablePayments: boolean;
    enableSignatures: boolean;
    enableGPS: boolean;
    enableFileUploads: boolean;

    // Security
    enableCaptcha: boolean;
    rateLimiting?: {
        enabled: boolean;
        maxSubmissions: number;
        timeWindow: number;
    };
}

export interface EmailNotification {
    id: string;
    trigger: 'submission' | 'approval' | 'rejection';
    recipients: string[];
    subject: string;
    template: string;
    includeAttachments: boolean;
}

export interface DragItem {
    id: string;
    type: FieldType;
    label: string;
    icon: string;
    category: 'basic' | 'advanced' | 'layout' | 'special';
    description: string;
}

export interface DropResult {
    draggedId: string;
    targetId?: string;
    position: 'before' | 'after' | 'inside';
    sectionId?: string;
}

export interface FormBuilderState {
    template: FormTemplate;
    selectedFieldId?: string;
    selectedSectionId?: string;
    draggedItem?: DragItem;
    previewMode: boolean;
    collaborationEnabled: boolean;
    isDirty: boolean;
    lastSaved?: Date;
}

export interface FieldValidationError {
    fieldId: string;
    message: string;
    type: 'error' | 'warning';
}

export interface FormValidationResult {
    isValid: boolean;
    errors: FieldValidationError[];
    warnings: FieldValidationError[];
} 