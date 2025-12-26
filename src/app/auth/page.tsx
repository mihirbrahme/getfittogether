'use client';

import Auth from '@/components/Auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthContent() {
    const searchParams = useSearchParams();
    const defaultMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

    return <Auth defaultMode={defaultMode} />;
}

export default function AuthPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/40 via-zinc-50 to-white" />

            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 hover:text-[#FF5E00] transition-colors font-bold uppercase tracking-widest text-xs z-20 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>

            <div className="relative z-10 w-full max-w-lg">
                <Suspense fallback={<div className="text-center font-bold text-zinc-400">Loading mission control...</div>}>
                    <AuthContent />
                </Suspense>
            </div>
        </div>
    );
}
