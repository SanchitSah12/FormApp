'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Template, Response } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Material-UI Icons
import {
    Description,
    Schedule,
    CheckCircle,
    Warning
} from '@mui/icons-material';

export const UserDashboard = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [responses, setResponses] = useState<Response[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const templatesResponse = await api.get('/templates?isActive=true');
            const responsesResponse = await api.get('/responses/my-responses');

            setTemplates(templatesResponse.data.templates);
            setResponses(responsesResponse.data.responses);
        } catch (error) {
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'submitted':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'draft':
                return <Schedule className="h-4 w-4 text-yellow-500" />;
            case 'reviewed':
                return <Warning className="h-4 w-4 text-blue-500" />;
            default:
                return <Description className="h-4 w-4 text-gray-500" />;
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Forms</CardTitle>
                        <Description className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{templates.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Active templates
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Schedule className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {responses.filter(r => r.status === 'draft').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Draft responses
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {responses.filter(r => r.status === 'submitted').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Submitted forms
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                        <Warning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{responses.length}</div>
                        <p className="text-xs text-muted-foreground">
                            All time
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="forms" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="forms">Available Forms</TabsTrigger>
                    <TabsTrigger value="responses">My Responses</TabsTrigger>
                </TabsList>

                <TabsContent value="forms" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Forms</CardTitle>
                            <CardDescription>
                                Start filling out these forms to complete your onboarding process.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {templates.map((template) => (
                                    <Card key={template._id} className="relative">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                                <Badge variant="outline">
                                                    {template.category}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                {template.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">
                                                    Version {template.version}
                                                </span>
                                                <Button asChild>
                                                    <Link href={`/forms/${template._id}`}>
                                                        Start Form
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {templates.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No forms available at the moment.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="responses" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Responses</CardTitle>
                            <CardDescription>
                                Track your form submissions and continue incomplete forms.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {responses.map((response) => (
                                    <Card key={response._id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(response.status)}
                                                        <h3 className="font-medium">
                                                            {typeof response.templateId === 'object'
                                                                ? response.templateId.name
                                                                : 'Unknown Template'}
                                                        </h3>
                                                        <Badge variant={
                                                            response.status === 'submitted' ? 'default' :
                                                                response.status === 'draft' ? 'secondary' : 'outline'
                                                        }>
                                                            {response.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Last updated: {new Date(response.updatedAt).toLocaleDateString()}
                                                    </p>
                                                    {response.status === 'draft' && response.completionPercentage && (
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-sm">
                                                                <span>Progress</span>
                                                                <span>{response.completionPercentage}%</span>
                                                            </div>
                                                            <Progress value={response.completionPercentage} className="h-2" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    {response.status === 'draft' && (
                                                        <Button size="sm" asChild>
                                                            <Link href={`/forms/${typeof response.templateId === 'object' ? response.templateId._id : response.templateId}?responseId=${response._id}`}>
                                                                Continue
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/responses/${response._id}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {responses.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No responses yet. Start filling out a form to see your progress here.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};