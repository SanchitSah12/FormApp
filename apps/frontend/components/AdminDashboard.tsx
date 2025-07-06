'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Template, Statistics } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, FileText, Users, BarChart3, Download } from 'lucide-react';

export const AdminDashboard = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [responseFilter, setResponseFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            fetchData();
        }
    }, [responseFilter]);

    const fetchData = async () => {
        try {
            const templatesResponse = await api.get('/templates');
            const statsResponse = await api.get('/templates/statistics');
            const responsesResponse = await api.get(`/responses?limit=10${responseFilter !== 'all' ? `&status=${responseFilter}` : ''}`);

            console.log('DEBUG: Templates response:', templatesResponse.data);
            console.log('DEBUG: Statistics response:', statsResponse.data);
            console.log('DEBUG: Responses response:', responsesResponse.data);

            setTemplates(templatesResponse.data.templates);
            setStatistics(statsResponse.data);
            setResponses(responsesResponse.data.responses);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTemplate = async (templateId: string, isActive: boolean) => {
        try {
            await api.patch(`/templates/${templateId}`, { isActive: !isActive });
            await fetchData();
            toast.success(`Template ${!isActive ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error("Failed to update template");
        }
    };

    const handleUpdateResponseStatus = async (responseId: string, status: string) => {
        try {
            await api.patch(`/responses/${responseId}/status`, { status });
            await fetchData();
            toast.success(`Response ${status} successfully`);
        } catch (error) {
            toast.error("Failed to update response status");
        }
    };

    const handleExport = async (format: 'csv' | 'excel') => {
        try {
            const response = await api.get(`/exports/${format}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `responses.${format === 'csv' ? 'csv' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(`Data exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error("Failed to export data");
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
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Button asChild>
                    <Link href="/admin/templates/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                    </Link>
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{templates.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {templates.filter(t => t.isActive).length} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.totalResponses || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {statistics?.averageCompletion || 0}% avg completion
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Export Data</CardTitle>
                        <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleExport('csv')}>
                                CSV
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleExport('excel')}>
                                Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Templates Management */}
            <Tabs defaultValue="templates" className="w-full">
                <TabsList>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="responses">Recent Responses</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Templates</CardTitle>
                            <CardDescription>Manage your form templates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Version</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map((template) => (
                                        <TableRow key={template._id}>
                                            <TableCell className="font-medium">{template.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{template.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={template.isActive ? "default" : "secondary"}>
                                                    {template.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{template.version}</TableCell>
                                            <TableCell>
                                                {new Date(template.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/admin/templates/${template._id}`}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/admin/templates/${template._id}/builder`}>
                                                            Form Builder
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/admin/templates/${template._id}/collaborate`}>
                                                            Collaborate
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/admin/templates/${template._id}/responses`}>
                                                            Responses
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleTemplate(template._id, template.isActive)}
                                                    >
                                                        {template.isActive ? 'Deactivate' : 'Activate'}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="responses" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Recent Responses</CardTitle>
                                    <CardDescription>Latest form submissions</CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Select value={responseFilter} onValueChange={setResponseFilter}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Responses</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="reviewed">Reviewed</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {responses.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Template</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Completion</TableHead>
                                            <TableHead>Submitted</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {responses.map((response) => (
                                            <TableRow key={response._id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {response.userId?.firstName} {response.userId?.lastName}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {response.userId?.email}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {response.templateId?.name}
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {response.templateId?.category}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            response.status === 'submitted' ? 'default' :
                                                                response.status === 'approved' ? 'default' :
                                                                    response.status === 'rejected' ? 'destructive' :
                                                                        'secondary'
                                                        }
                                                    >
                                                        {response.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${response.completionPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm">{response.completionPercentage}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {response.submittedAt
                                                        ? new Date(response.submittedAt).toLocaleDateString()
                                                        : 'Not submitted'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button size="sm" variant="outline" asChild>
                                                            <Link href={`/responses/${response._id}`}>
                                                                View
                                                            </Link>
                                                        </Button>
                                                        {response.status === 'submitted' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUpdateResponseStatus(response._id, 'approved')}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUpdateResponseStatus(response._id, 'rejected')}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No responses found
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}; 