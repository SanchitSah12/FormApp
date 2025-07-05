'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Template, Response } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User, Calendar, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface ResponsePageProps {
    params: {
        id: string;
    };
}

export default function ResponsePage({ params }: ResponsePageProps) {
    const [response, setResponse] = useState<Response | null>(null);
    const [template, setTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();

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

            // Fetch response
            const responseResponse = await api.get(`/responses/${params.id}`);
            const responseData = responseResponse.data.response;
            setResponse(responseData);

            // Fetch template
            const templateId = typeof responseData.templateId === 'object'
                ? responseData.templateId._id
                : responseData.templateId;

            const templateResponse = await api.get(`/templates/${templateId}`);
            setTemplate(templateResponse.data.template);

        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to load response');
            toast.error('Failed to load response');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'submitted':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'reviewed':
                return <Clock className="h-4 w-4 text-blue-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'submitted':
                return 'default';
            case 'approved':
                return 'default';
            case 'rejected':
                return 'destructive';
            case 'reviewed':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const renderFieldValue = (field: any, value: any) => {
        if (value === null || value === undefined || value === '') {
            return <span className="text-muted-foreground italic">No response</span>;
        }

        switch (field.type) {
            case 'checkbox':
                return Array.isArray(value) ? value.join(', ') : value;
            case 'radio':
            case 'select':
                return value;
            case 'textarea':
                return (
                    <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md border">
                        {value}
                    </div>
                );
            case 'file':
                return Array.isArray(value) ? (
                    <div className="space-y-2">
                        {value.map((file: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>{file.originalName || file.filename || 'Uploaded file'}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{value.originalName || value.filename || 'Uploaded file'}</span>
                    </div>
                );
            default:
                return value;
        }
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

    if (error || !response) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <main className="container mx-auto px-4 py-8">
                        <Alert variant="destructive">
                            <AlertDescription>{error || 'Response not found'}</AlertDescription>
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
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <Button variant="outline" asChild>
                                <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                        </div>

                        {/* Response Overview */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center space-x-2">
                                            <span>
                                                {typeof response.templateId === 'object'
                                                    ? response.templateId.name
                                                    : template?.name || 'Form Response'}
                                            </span>
                                            <Badge variant={getStatusColor(response.status)}>
                                                {getStatusIcon(response.status)}
                                                <span className="ml-1">{response.status}</span>
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            {typeof response.templateId === 'object'
                                                ? response.templateId.description
                                                : template?.description}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right text-sm text-muted-foreground">
                                        <div className="flex items-center space-x-2">
                                            <Progress value={response.completionPercentage} className="w-24" />
                                            <span>{response.completionPercentage}% complete</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">Submitted by</div>
                                            <div className="text-sm text-muted-foreground">
                                                {typeof response.userId === 'object'
                                                    ? `${response.userId.firstName} ${response.userId.lastName}`
                                                    : 'Unknown User'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">Created</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(response.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">Last Updated</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(response.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {response.submittedAt && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="text-sm">
                                            <span className="font-medium">Submitted on:</span>{' '}
                                            {new Date(response.submittedAt).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                                {response.reviewNotes && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="text-sm">
                                            <span className="font-medium">Review Notes:</span>
                                            <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                                                {response.reviewNotes}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Response Data */}
                        {template && (
                            <div className="space-y-6">
                                {template.sections.map((section, sectionIndex) => (
                                    <Card key={section.id}>
                                        <CardHeader>
                                            <CardTitle>{section.title}</CardTitle>
                                            {section.description && (
                                                <CardDescription>{section.description}</CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {section.fields.map((field, fieldIndex) => (
                                                <div key={field.id} className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium">{field.label}</span>
                                                        {field.required && (
                                                            <span className="text-red-500 text-sm">*</span>
                                                        )}
                                                    </div>
                                                    {field.helpText && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {field.helpText}
                                                        </p>
                                                    )}
                                                    <div className="pl-4 border-l-2 border-gray-200">
                                                        {renderFieldValue(field, response.responses[field.id])}
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons for Admins */}
                        {user?.role === 'admin' && response.status === 'submitted' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Admin Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    await api.patch(`/responses/${response._id}/status`, {
                                                        status: 'approved'
                                                    });
                                                    toast.success('Response approved');
                                                    router.push('/admin');
                                                } catch (error) {
                                                    toast.error('Failed to approve response');
                                                }
                                            }}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={async () => {
                                                try {
                                                    await api.patch(`/responses/${response._id}/status`, {
                                                        status: 'rejected'
                                                    });
                                                    toast.success('Response rejected');
                                                    router.push('/admin');
                                                } catch (error) {
                                                    toast.error('Failed to reject response');
                                                }
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
} 