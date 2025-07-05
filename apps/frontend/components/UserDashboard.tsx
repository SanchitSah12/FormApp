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
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

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
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'reviewed':
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
            default:
                return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Forms</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{templates.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Ready to fill out
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {responses.filter(r => r.status === 'draft').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Forms started
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
                            Forms submitted
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Forms and Responses */}
            <Tabs defaultValue="available" className="w-full">
                <TabsList>
                    <TabsTrigger value="available">Available Forms</TabsTrigger>
                    <TabsTrigger value="responses">My Responses</TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Forms</CardTitle>
                            <CardDescription>Forms you can fill out</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {templates.map((template) => (
                                    <Card key={template._id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                            <CardDescription>{template.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center">
                                                <Badge variant="outline">{template.category}</Badge>
                                                <Button size="sm" asChild>
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
                                    No forms available at the moment
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="responses" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Responses</CardTitle>
                            <CardDescription>Your form submissions and progress</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {responses.map((response) => (
                                    <Card key={response._id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(response.status)}
                                                        <h3 className="font-semibold">
                                                            {typeof response.templateId === 'object'
                                                                ? response.templateId.name
                                                                : 'Form'}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="outline">
                                                            {response.status}
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {response.completionPercentage}% complete
                                                        </span>
                                                    </div>
                                                    <Progress value={response.completionPercentage} className="w-48" />
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
