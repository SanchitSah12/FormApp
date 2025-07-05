'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Template, Response } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { DynamicForm } from '@/components/DynamicForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface FormPageProps {
    params: {
        id: string;
    };
}

export default function FormPage({ params }: FormPageProps) {
    const [template, setTemplate] = useState<Template | null>(null);
    const [existingResponse, setExistingResponse] = useState<Response | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();

    const searchParams = useSearchParams();
    const responseId = searchParams.get('responseId');

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        fetchData();
    }, [params.id, user]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch template
            const templateResponse = await api.get(`/templates/${params.id}`);
            setTemplate(templateResponse.data.template);

            // Fetch existing response if responseId is provided
            if (responseId) {
                try {
                    const responseResponse = await api.get(`/responses/${responseId}`);
                    setExistingResponse(responseResponse.data.response);
                } catch (error) {
                    console.error('Failed to fetch existing response:', error);
                    // Continue without existing response
                }
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to load form');
            toast.error('Failed to load form');
            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = (responses: Record<string, any>) => {
        toast.success('Progress saved successfully');
    };

    const handleSubmit = (responses: Record<string, any>) => {
        toast.success('Form submitted successfully');
        router.push('/dashboard');
    };

    if (isLoading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <main className="container mx-auto px-4 py-8">
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <main className="container mx-auto px-4 py-8">
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    if (!template) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <main className="container mx-auto px-4 py-8">
                        <Alert>
                            <AlertDescription>Form template not found.</AlertDescription>
                        </Alert>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Form Header */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{template.name}</CardTitle>
                                {template.description && (
                                    <CardDescription>{template.description}</CardDescription>
                                )}
                            </CardHeader>
                        </Card>

                        {/* Dynamic Form */}
                        <DynamicForm
                            template={template}
                            existingResponse={existingResponse || undefined}
                            onSave={handleSave}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
} 