import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navigation />

            {/* Hero Section */}
            <main className="flex-1">
                <section className="py-12 md:py-24 lg:py-32 xl:py-48">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                                    Streamline Your Construction Payroll Onboarding
                                </h1>
                                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                                    Efficiently collect and manage payroll setup information, ERP configurations,
                                    and company details with our dynamic form system.
                                </p>
                            </div>
                            <div className="space-x-4">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8"
                                >
                                    Start Onboarding
                                </Link>
                                <Link
                                    href="/templates"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8"
                                >
                                    View Templates
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
                    <div className="container mx-auto px-4">
                        <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <svg
                                        className="h-6 w-6 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold">Dynamic Forms</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Template-driven forms that adapt based on user selections without requiring redeployment.
                                </p>
                            </div>
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <svg
                                        className="h-6 w-6 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold">File Management</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Secure file uploads with help documentation and downloadable resources.
                                </p>
                            </div>
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <svg
                                        className="h-6 w-6 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold">Export & Analytics</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Export responses to CSV/Excel and track completion analytics.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <p className="text-sm text-muted-foreground">
                            © 2024 Construction Payroll Onboarding. All rights reserved.
                        </p>
                        <div className="flex space-x-4">
                            <Link
                                href="/privacy"
                                className="text-sm text-muted-foreground hover:text-primary"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="/terms"
                                className="text-sm text-muted-foreground hover:text-primary"
                            >
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
} 