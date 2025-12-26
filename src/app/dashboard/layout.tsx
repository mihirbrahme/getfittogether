'use client';

import DashboardNav from '@/components/DashboardNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-zinc-50">
            <DashboardNav />

            <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0">
                <div className="max-w-4xl mx-auto p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
