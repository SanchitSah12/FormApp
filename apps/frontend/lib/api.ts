import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: async (credentials: { email: string; password: string; }) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        companyName?: string;
        role?: string;
    }) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },
    updateProfile: async (userData: {
        firstName?: string;
        lastName?: string;
        companyName?: string;
    }) => {
        const response = await api.put('/auth/profile', userData);
        return response.data;
    },
    getUsers: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
    }) => {
        const response = await api.get('/auth/users', { params });
        return response.data;
    },
    updateUserStatus: async (userId: string, isActive: boolean) => {
        const response = await api.put(`/auth/users/${userId}/status`, { isActive });
        return response.data;
    },
};

// Template API
export const templateApi = {
    getTemplates: async (params?: { category?: string; isActive?: boolean; }) => {
        const response = await api.get('/templates', { params });
        return response.data;
    },
    getTemplate: async (id: string) => {
        const response = await api.get(`/templates/${id}`);
        return response.data;
    },
    createTemplate: async (templateData: any) => {
        const response = await api.post('/templates', templateData);
        return response.data;
    },
    updateTemplate: async (id: string, templateData: any) => {
        const response = await api.put(`/templates/${id}`, templateData);
        return response.data;
    },
    deleteTemplate: async (id: string) => {
        const response = await api.delete(`/templates/${id}`);
        return response.data;
    },
    toggleTemplateStatus: async (id: string) => {
        const response = await api.patch(`/templates/${id}/toggle-active`);
        return response.data;
    },
    cloneTemplate: async (id: string) => {
        const response = await api.post(`/templates/${id}/clone`);
        return response.data;
    },
    getTemplateStats: async (id: string) => {
        const response = await api.get(`/templates/${id}/stats`);
        return response.data;
    },
    getTemplateStatistics: async () => {
        const response = await api.get('/templates/statistics');
        return response.data;
    },
    // Public sharing
    generateShareLink: async (id: string, config: {
        allowAnonymous?: boolean;
        expiresAt?: string;
    }) => {
        const response = await api.post(`/templates/${id}/share`, config);
        return response.data;
    },
    disableSharing: async (id: string) => {
        const response = await api.delete(`/templates/${id}/share`);
        return response.data;
    },
    getPublicTemplate: async (shareToken: string) => {
        const response = await api.get(`/templates/public/${shareToken}`);
        return response.data;
    },
};

// Response API
export const responseApi = {
    getMyResponses: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        templateId?: string;
    }) => {
        const response = await api.get('/responses/my-responses', { params });
        return response.data;
    },
    getResponse: async (id: string) => {
        const response = await api.get(`/responses/${id}`);
        return response.data;
    },
    saveResponse: async (responseData: {
        templateId: string;
        responses: any;
        currentSection?: string;
    }) => {
        const response = await api.post('/responses', responseData);
        return response.data;
    },
    submitResponse: async (id: string) => {
        const response = await api.post(`/responses/${id}/submit`);
        return response.data;
    },
    updateResponse: async (id: string, responseData: {
        responses?: any;
        currentSection?: string;
        status?: string;
    }) => {
        const response = await api.put(`/responses/${id}`, responseData);
        return response.data;
    },
    getAllResponses: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        templateId?: string;
        userId?: string;
        search?: string;
    }) => {
        const response = await api.get('/responses', { params });
        return response.data;
    },
    updateResponseStatus: async (id: string, status: string, reviewNotes?: string) => {
        const response = await api.patch(`/responses/${id}/status`, { status, reviewNotes });
        return response.data;
    },
    deleteResponse: async (id: string) => {
        const response = await api.delete(`/responses/${id}`);
        return response.data;
    },
    getResponseStats: async (templateId?: string) => {
        const response = await api.get('/responses/stats/overview', {
            params: { templateId }
        });
        return response.data;
    },
    // Public form submissions
    submitPublicForm: async (shareToken: string, formData: {
        responses: any;
        submitterInfo?: {
            name?: string;
            email?: string;
            phone?: string;
            company?: string;
            notes?: string;
        };
    }) => {
        const response = await api.post(`/responses/public/${shareToken}`, formData);
        return response.data;
    },
    savePublicProgress: async (shareToken: string, formData: {
        responses: any;
        submitterInfo?: any;
        sessionId?: string;
    }) => {
        const response = await api.post(`/responses/public/${shareToken}/save`, formData);
        return response.data;
    },
    getPublicProgress: async (shareToken: string, sessionId: string) => {
        const response = await api.get(`/responses/public/${shareToken}/${sessionId}`);
        return response.data;
    },
};

// Export API
export const exportApi = {
    exportCsv: async (params?: {
        templateId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get('/exports/csv', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },
    exportExcel: async (params?: {
        templateId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get('/exports/excel', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },
    exportTemplateJson: async (id: string) => {
        const response = await api.get(`/exports/template/${id}/json`, {
            responseType: 'blob'
        });
        return response.data;
    },
    exportStats: async (params?: {
        templateId?: string;
        format?: 'json' | 'csv';
    }) => {
        const response = await api.get('/exports/stats', {
            params,
            responseType: params?.format === 'csv' ? 'blob' : 'json'
        });
        return response.data;
    },
    // Template-specific exports
    exportTemplateCsv: async (templateId: string, params?: {
        status?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get(`/exports/template/${templateId}/csv`, {
            params,
            responseType: 'blob'
        });
        return response.data;
    },
    exportTemplateExcel: async (templateId: string, params?: {
        status?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get(`/exports/template/${templateId}/excel`, {
            params,
            responseType: 'blob'
        });
        return response.data;
    },
    getTemplateResponses: async (templateId: string, params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }) => {
        const response = await api.get(`/exports/template/${templateId}/responses`, { params });
        return response.data;
    },
};

// Upload API
export const uploadApi = {
    uploadSingle: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/uploads/single', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    uploadMultiple: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });
        const response = await api.post('/uploads/multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    uploadHelpFiles: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('helpFiles', file);
        });
        const response = await api.post('/uploads/help', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    deleteFile: async (filename: string) => {
        const response = await api.delete(`/uploads/${filename}`);
        return response.data;
    },
    getFileInfo: async (filename: string) => {
        const response = await api.get(`/uploads/info/${filename}`);
        return response.data;
    },
}; 