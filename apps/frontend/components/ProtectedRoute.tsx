'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAdmin?: boolean;
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAdmin = false,
    redirectTo = '/login',
}) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push(redirectTo);
                return;
            }

            if (requireAdmin && user.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
        }
    }, [user, isLoading, requireAdmin, router, redirectTo]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (requireAdmin && user.role !== 'admin') {
        return null;
    }

    return <>{children}</>;
}; 