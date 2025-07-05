'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            localStorage.removeItem('token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setUser(user);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const register = async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            const response = await api.post('/auth/register', { email, password, firstName, lastName });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setUser(user);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateProfile = async (data: Partial<User>) => {
        try {
            const response = await api.put('/auth/profile', data);
            setUser(response.data.user);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Profile update failed');
        }
    };

    const value = {
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 