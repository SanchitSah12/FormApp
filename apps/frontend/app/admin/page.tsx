'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminPage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    return (
        <ProtectedRoute requireAdmin>
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        </ProtectedRoute>
    );
} 