'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export const Navigation = () => {
    const { user, logout } = useAuth();

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    const getFullName = (firstName: string, lastName: string) => {
        return `${firstName} ${lastName}`;
    };

    return (
        <header className="border-b">
            <div className="container mx-auto px-4 py-4">
                <nav className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Link href="/" className="text-2xl font-bold text-primary">
                            Construction Payroll Onboarding
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <div className="flex items-center space-x-4">
                                    {user.role === 'admin' && (
                                        <Link href="/admin" className="text-sm font-medium hover:text-primary">
                                            Admin Panel
                                        </Link>
                                    )}
                                    <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                                        Dashboard
                                    </Link>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <div className="flex items-center justify-start gap-2 p-2">
                                            <div className="flex flex-col space-y-1 leading-none">
                                                <p className="font-medium">{getFullName(user.firstName, user.lastName)}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                                <Badge variant="outline" className="w-fit">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile">Profile</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard">Dashboard</Link>
                                        </DropdownMenuItem>
                                        {user.role === 'admin' && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin">Admin Panel</Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout}>
                                            Log out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <div className="flex space-x-4">
                                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
                                    Sign In
                                </Link>
                                <Button asChild>
                                    <Link href="/register">Get Started</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}; 