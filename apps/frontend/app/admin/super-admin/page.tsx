'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Users, FileText, BarChart3, Settings, Shield, UserCheck, UserX, Eye, Download } from 'lucide-react';

interface Admin {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface SystemStats {
  totalUsers: number;
  totalAdmins: number;
  totalTemplates: number;
  totalResponses: number;
  activeUsers: number;
  storageUsed: number;
  apiCalls: number;
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateAdminDialog, setShowCreateAdminDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Create admin form state
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });

  useEffect(() => {
    if (user?.role !== 'superadmin') {
      return;
    }
    fetchData();
  }, [user, currentPage, searchTerm, roleFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [adminsResponse, usersResponse, statsResponse] = await Promise.all([
        api.get('/auth/admins'),
        api.get('/auth/users', {
          params: {
            page: currentPage,
            limit: 10,
            search: searchTerm,
            role: roleFilter === 'all' ? undefined : roleFilter
          }
        }),
        api.get('/analytics/dashboard') // Assuming we have system stats here
      ]);

      setAdmins(adminsResponse.data.admins);
      setUsers(usersResponse.data.users);
      setTotalPages(usersResponse.data.totalPages);
      
      // Mock system stats for now
      setSystemStats({
        totalUsers: usersResponse.data.total,
        totalAdmins: adminsResponse.data.admins.length,
        totalTemplates: statsResponse.data.summary?.activeTemplates || 0,
        totalResponses: statsResponse.data.summary?.totalResponses || 0,
        activeUsers: statsResponse.data.summary?.totalUsers || 0,
        storageUsed: 1024 * 1024 * 512, // 512MB mock
        apiCalls: 15000 // Mock
      });
    } catch (error) {
      console.error('Failed to fetch super admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/create-admin', newAdmin);
      toast.success('Admin created successfully');
      setShowCreateAdminDialog(false);
      setNewAdmin({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        companyName: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create admin');
    }
  };

  const handleToggleAdminStatus = async (adminId: string, isActive: boolean) => {
    try {
      await api.put(`/auth/admins/${adminId}/status`, { isActive: !isActive });
      toast.success(`Admin ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update admin status');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) {
      return;
    }
    
    try {
      await api.delete(`/auth/admins/${adminId}`);
      toast.success('Admin deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete admin');
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (user?.role !== 'superadmin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Alert variant="destructive">
              <AlertDescription>
                Access denied. Super admin privileges required.
              </AlertDescription>
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
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
                <p className="text-gray-600">Manage system administrators and monitor platform health</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateAdminDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Admin
                </Button>
              </div>
            </div>

            {/* System Stats */}
            {systemStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(systemStats.totalUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      {systemStats.activeUsers} active
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(systemStats.totalAdmins)}</div>
                    <p className="text-xs text-muted-foreground">
                      System administrators
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Templates</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(systemStats.totalTemplates)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(systemStats.totalResponses)} responses
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatBytes(systemStats.storageUsed)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(systemStats.apiCalls)} API calls
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="admins" className="space-y-4">
              <TabsList>
                <TabsTrigger value="admins">Administrators</TabsTrigger>
                <TabsTrigger value="users">All Users</TabsTrigger>
                <TabsTrigger value="system">System Settings</TabsTrigger>
              </TabsList>

              {/* Administrators Tab */}
              <TabsContent value="admins" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Administrators</CardTitle>
                    <CardDescription>
                      Manage users with administrative privileges
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {admins.map((admin) => (
                            <TableRow key={admin._id}>
                              <TableCell>
                                {admin.firstName} {admin.lastName}
                              </TableCell>
                              <TableCell>{admin.email}</TableCell>
                              <TableCell>{admin.companyName || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                                  {admin.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {admin.lastLogin 
                                  ? new Date(admin.lastLogin).toLocaleDateString()
                                  : 'Never'
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleAdminStatus(admin._id, admin.isActive)}
                                  >
                                    {admin.isActive ? (
                                      <UserX className="w-4 h-4" />
                                    ) : (
                                      <UserCheck className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAdmin(admin._id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* All Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                      View and manage all platform users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Search and Filter */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="user">Users</SelectItem>
                          <SelectItem value="admin">Admins</SelectItem>
                          <SelectItem value="superadmin">Super Admins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user._id}>
                                <TableCell>
                                  {user.firstName} {user.lastName}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    user.role === 'superadmin' ? 'destructive' :
                                    user.role === 'admin' ? 'default' : 'secondary'
                                  }>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewUser(user)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(currentPage - 1)}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(currentPage + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Settings Tab */}
              <TabsContent value="system" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Health</CardTitle>
                      <CardDescription>Monitor system performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>API Response Time</span>
                        <span className="text-green-600">125ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Database Status</span>
                        <span className="text-green-600">Healthy</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage Health</span>
                        <span className="text-green-600">Optimal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Backup Status</span>
                        <span className="text-green-600">Up to date</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Actions</CardTitle>
                      <CardDescription>Administrative operations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Export System Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        System Configuration
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Performance Reports
                      </Button>
                      <Button variant="destructive" className="w-full justify-start">
                        <Shield className="w-4 h-4 mr-2" />
                        Maintenance Mode
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={showCreateAdminDialog} onOpenChange={setShowCreateAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Administrator</DialogTitle>
            <DialogDescription>
              Add a new user with administrative privileges
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newAdmin.firstName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                value={newAdmin.companyName}
                onChange={(e) => setNewAdmin({ ...newAdmin, companyName: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateAdminDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Admin</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Badge variant={
                    selectedUser.role === 'superadmin' ? 'destructive' :
                    selectedUser.role === 'admin' ? 'default' : 'secondary'
                  }>
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedUser.isActive ? 'default' : 'secondary'}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm">
                    {selectedUser.lastLogin 
                      ? new Date(selectedUser.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}