'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { notificationApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Bell,
    Settings,
    Mail,
    Clock,
    TestTube,
    Send,
    History,
    Users,
    CheckCircle,
    AlertCircle,
    XCircle,
    Eye
} from 'lucide-react';

interface NotificationPreferences {
    _id: string;
    userId: string;
    emailNotifications: {
        formSubmissions: boolean;
        formResponses: boolean;
        systemUpdates: boolean;
        weeklyReports: boolean;
    };
    frequency: string;
    quietHours: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        timezone: string;
    };
    templateNotifications: Array<{
        templateId: string;
        enabled: boolean;
    }>;
}

interface NotificationHistory {
    _id: string;
    type: string;
    title: string;
    message: string;
    status: string;
    sentAt: string;
    readAt?: string;
    createdAt: string;
}

interface NotificationStats {
    totalNotifications: number;
    unreadNotifications: number;
    byType: Array<{
        _id: string;
        count: number;
        unread: number;
    }>;
}

export const NotificationSettings: React.FC = () => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [history, setHistory] = useState<NotificationHistory[]>([]);
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadcastData, setBroadcastData] = useState({
        subject: '',
        message: '',
        isHtml: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [prefsResponse, historyResponse, statsResponse] = await Promise.all([
                notificationApi.getPreferences(),
                notificationApi.getHistory({ limit: 10 }),
                notificationApi.getStats()
            ]);

            setPreferences(prefsResponse.preferences);
            setHistory(historyResponse.notifications);
            setStats(statsResponse);
        } catch (error) {
            console.error('Failed to fetch notification data:', error);
            toast.error('Failed to load notification settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        if (!preferences) return;

        try {
            setIsSaving(true);
            await notificationApi.updatePreferences({
                emailNotifications: preferences.emailNotifications,
                frequency: preferences.frequency,
                quietHours: preferences.quietHours,
                templateNotifications: preferences.templateNotifications
            });

            toast.success('Notification preferences updated successfully');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            toast.error('Failed to save notification preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestEmail = async () => {
        try {
            setIsTesting(true);
            await notificationApi.testEmail();
            toast.success('Test email sent successfully! Check your inbox.');
        } catch (error) {
            console.error('Failed to send test email:', error);
            toast.error('Failed to send test email. Please check your email configuration.');
        } finally {
            setIsTesting(false);
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastData.subject || !broadcastData.message) {
            toast.error('Subject and message are required');
            return;
        }

        try {
            const response = await notificationApi.broadcast(broadcastData);
            toast.success(`Broadcast sent to ${response.recipients} admins`);
            setShowBroadcast(false);
            setBroadcastData({ subject: '', message: '', isHtml: false });
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to send broadcast:', error);
            toast.error('Failed to send broadcast notification');
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationApi.markAsRead(notificationId);
            toast.success('Notification marked as read');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to mark as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'read':
                return <Eye className="w-4 h-4 text-blue-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'form_submission':
                return 'bg-blue-100 text-blue-800';
            case 'form_response':
                return 'bg-green-100 text-green-800';
            case 'system_update':
                return 'bg-purple-100 text-purple-800';
            case 'weekly_report':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Notification Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your notification preferences and view notification history
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleTestEmail}
                        disabled={isTesting}
                    >
                        <TestTube className="w-4 h-4 mr-2" />
                        {isTesting ? 'Sending...' : 'Test Email'}
                    </Button>
                    {user?.role === 'superadmin' && (
                        <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Send className="w-4 h-4 mr-2" />
                                    Broadcast
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Send Broadcast Notification</DialogTitle>
                                    <DialogDescription>
                                        Send a notification to all active administrators
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            value={broadcastData.subject}
                                            onChange={(e) => setBroadcastData(prev => ({ ...prev, subject: e.target.value }))}
                                            placeholder="Enter notification subject"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            value={broadcastData.message}
                                            onChange={(e) => setBroadcastData(prev => ({ ...prev, message: e.target.value }))}
                                            placeholder="Enter notification message"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="html"
                                            checked={broadcastData.isHtml}
                                            onCheckedChange={(checked) => setBroadcastData(prev => ({ ...prev, isHtml: checked }))}
                                        />
                                        <Label htmlFor="html">HTML Format</Label>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setShowBroadcast(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleBroadcast}>
                                            Send Broadcast
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <Tabs defaultValue="preferences" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="preferences">
                        <Settings className="w-4 h-4 mr-2" />
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="w-4 h-4 mr-2" />
                        History
                        {stats && stats.unreadNotifications > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {stats.unreadNotifications}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="stats">
                        <Bell className="w-4 h-4 mr-2" />
                        Statistics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="preferences" className="space-y-4">
                    {preferences && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Mail className="w-5 h-5 mr-2" />
                                        Email Notifications
                                    </CardTitle>
                                    <CardDescription>
                                        Choose which events should trigger email notifications
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Form Submissions</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified when users submit forms
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.emailNotifications.formSubmissions}
                                            onCheckedChange={(checked) =>
                                                setPreferences(prev => prev ? {
                                                    ...prev,
                                                    emailNotifications: { ...prev.emailNotifications, formSubmissions: checked }
                                                } : null)
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Form Responses</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified about response status changes
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.emailNotifications.formResponses}
                                            onCheckedChange={(checked) =>
                                                setPreferences(prev => prev ? {
                                                    ...prev,
                                                    emailNotifications: { ...prev.emailNotifications, formResponses: checked }
                                                } : null)
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>System Updates</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified about system announcements
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.emailNotifications.systemUpdates}
                                            onCheckedChange={(checked) =>
                                                setPreferences(prev => prev ? {
                                                    ...prev,
                                                    emailNotifications: { ...prev.emailNotifications, systemUpdates: checked }
                                                } : null)
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Weekly Reports</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get weekly summary reports
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.emailNotifications.weeklyReports}
                                            onCheckedChange={(checked) =>
                                                setPreferences(prev => prev ? {
                                                    ...prev,
                                                    emailNotifications: { ...prev.emailNotifications, weeklyReports: checked }
                                                } : null)
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Clock className="w-5 h-5 mr-2" />
                                        Notification Timing
                                    </CardTitle>
                                    <CardDescription>
                                        Configure when and how often you receive notifications
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Notification Frequency</Label>
                                        <Select
                                            value={preferences.frequency}
                                            onValueChange={(value) =>
                                                setPreferences(prev => prev ? { ...prev, frequency: value } : null)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="immediate">Immediate</SelectItem>
                                                <SelectItem value="hourly">Hourly Digest</SelectItem>
                                                <SelectItem value="daily">Daily Digest</SelectItem>
                                                <SelectItem value="weekly">Weekly Digest</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Quiet Hours</Label>
                                            <Switch
                                                checked={preferences.quietHours.enabled}
                                                onCheckedChange={(checked) =>
                                                    setPreferences(prev => prev ? {
                                                        ...prev,
                                                        quietHours: { ...prev.quietHours, enabled: checked }
                                                    } : null)
                                                }
                                            />
                                        </div>
                                        {preferences.quietHours.enabled && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Start Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={preferences.quietHours.startTime}
                                                        onChange={(e) =>
                                                            setPreferences(prev => prev ? {
                                                                ...prev,
                                                                quietHours: { ...prev.quietHours, startTime: e.target.value }
                                                            } : null)
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>End Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={preferences.quietHours.endTime}
                                                        onChange={(e) =>
                                                            setPreferences(prev => prev ? {
                                                                ...prev,
                                                                quietHours: { ...prev.quietHours, endTime: e.target.value }
                                                            } : null)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleSavePreferences} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Preferences'}
                                </Button>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification History</CardTitle>
                            <CardDescription>
                                View your recent notifications and their status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((notification) => (
                                        <TableRow key={notification._id}>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    {getStatusIcon(notification.status)}
                                                    <span className="ml-2 capitalize">{notification.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getTypeColor(notification.type)}>
                                                    {notification.type.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{notification.title}</TableCell>
                                            <TableCell>
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {notification.status !== 'read' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMarkAsRead(notification._id)}
                                                    >
                                                        Mark as Read
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Total Notifications</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats.totalNotifications}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Unread Notifications</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-orange-600">
                                        {stats.unreadNotifications}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>By Type</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {stats.byType.map((type) => (
                                            <div key={type._id} className="flex justify-between">
                                                <span className="capitalize">{type._id.replace('_', ' ')}</span>
                                                <span>{type.count} ({type.unread} unread)</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}; 