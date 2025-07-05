'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { AdminDashboard } from '@/components/AdminDashboard';
import { UserDashboard } from '@/components/UserDashboard';

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                    {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
                </main>
            </div>
        </ProtectedRoute>
    );
} 