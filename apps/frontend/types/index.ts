export interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    role: 'admin' | 'user';
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

export interface FieldOption {
    value: string;
    label: string;
}

export interface FieldValidation {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
}

export interface HelpFile {
    name: string;
    url: string;
    size?: number;
}

export interface ConditionalLogic {
    dependsOn?: string;
    condition?: string;
    value?: any;
}

export interface Field {
    id: string;
    type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'file' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'phone';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: FieldOption[];
    validation?: FieldValidation;
    helpText?: string;
    helpFiles?: HelpFile[];
    conditionalLogic?: ConditionalLogic;
    order?: number;
}

export interface Section {
    id: string;
    title: string;
    description?: string;
    fields: Field[];
    order?: number;
    conditionalLogic?: ConditionalLogic;
}

export interface Template {
    _id: string;
    name: string;
    description?: string;
    category: 'construction' | 'payroll' | 'general' | 'Business Setup';
    sections?: Section[];
    fields?: Field[];
    isActive: boolean;
    version?: number;
    createdBy: string | User;
    updatedBy?: string | User;
    createdAt: Date;
    updatedAt: Date;
    sharingConfig?: {
        isPublic: boolean;
        shareToken?: string;
        allowAnonymous: boolean;
        expiresAt?: Date;
        createdBy?: string | User;
        createdAt?: Date;
    };
}

export interface UploadedFile {
    fieldId: string;
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    uploadedAt: Date;
}

export interface Response {
    _id: string;
    templateId: string | Template;
    userId: string | User | null;
    responses: Record<string, any>;
    status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: string | User;
    reviewNotes?: string;
    completionPercentage: number;
    currentSection?: string;
    uploadedFiles: UploadedFile[];
    createdAt: Date;
    updatedAt: Date;
    submitterInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
        notes?: string;
    };
    sessionId?: string;
    isPublicSubmission?: boolean;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface ApiResponse<T> {
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationInfo;
}

export interface Statistics {
    totalResponses: number;
    averageCompletion: number;
    statusBreakdown: Array<{
        _id: string;
        count: number;
    }>;
    recentResponses?: Response[];
}

export interface FileUploadResponse {
    message: string;
    file?: {
        originalName: string;
        filename: string;
        path: string;
        size: number;
        mimetype: string;
        url: string;
        uploadedBy: string;
        uploadedAt: Date;
    };
    files?: Array<{
        originalName: string;
        filename: string;
        path: string;
        size: number;
        mimetype: string;
        url: string;
        uploadedBy: string;
        uploadedAt: Date;
    }>;
}

export interface ExportParams {
    templateId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export interface FormContextType {
    template: Template | null;
    responses: Record<string, any>;
    currentSection: string;
    setCurrentSection: (section: string) => void;
    updateResponse: (fieldId: string, value: any) => void;
    saveProgress: () => Promise<void>;
    submitForm: () => Promise<void>;
    isLoading: boolean;
    isSaving: boolean;
    completionPercentage: number;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        companyName?: string;
        role?: string;
    }) => Promise<void>;
    logout: () => void;
    updateProfile: (userData: {
        firstName?: string;
        lastName?: string;
        companyName?: string;
    }) => Promise<void>;
    isLoading: boolean;
    isAuthenticated: boolean;
} 