'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Clock, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PendingApprovalPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth?mode=login');
                return;
            }

            setUserEmail(user.email || '');

            // Check profile status
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, status, role')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserName(profile.full_name || 'User');
                setStatus(profile.status);

                // If approved, redirect to dashboard
                if (profile.status === 'approved') {
                    router.push('/dashboard');
                }
            }

            setLoading(false);
        };

        checkStatus();

        // Poll every 10 seconds to check if approved
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-[#FF5E00] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Main Card */}
                <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-zinc-100">
                    {/* Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="h-24 w-24 rounded-full bg-orange-50 border-4 border-orange-100 flex items-center justify-center relative">
                            <Clock className="h-12 w-12 text-[#FF5E00] animate-pulse" />
                            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[#FF5E00] flex items-center justify-center">
                                <span className="text-white text-xs font-black">!</span>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl font-black italic uppercase text-center text-zinc-900 mb-4 tracking-tighter">
                        Awaiting <span className="text-[#FF5E00]">Clearance</span>
                    </h1>

                    <p className="text-center text-zinc-500 font-medium mb-8">
                        Thanks for signing up, <span className="font-black text-zinc-900">{userName}</span>!
                    </p>

                    {/* Status Box */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-8 mb-8 border border-orange-200">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <AlertCircle className="h-6 w-6 text-[#FF5E00]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black uppercase text-sm text-zinc-900 mb-2">CURRENT STATUS</h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-2 w-2 rounded-full bg-[#FF5E00] animate-pulse" />
                                    <span className="text-xs font-black uppercase text-[#FF5E00] tracking-widest">Pending Admin Approval</span>
                                </div>
                                <p className="text-sm text-zinc-600 leading-relaxed">
                                    Your account is being reviewed by our admin team. This typically takes <span className="font-bold">24-48 hours</span>.
                                    You'll receive an email notification once you're approved.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What Happens Next */}
                    <div className="space-y-4 mb-8">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest text-center">WHAT HAPPENS NEXT</h3>

                        <div className="space-y-3">
                            {[
                                { num: 1, text: 'Admin reviews your registration', done: true },
                                { num: 2, text: 'You\'re assigned to a squad', done: false },
                                { num: 3, text: 'You receive approval email', done: false },
                                { num: 4, text: 'Access full dashboard and start logging', done: false },
                            ].map((step) => (
                                <div key={step.num} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black border-2 ${step.done
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'bg-white border-zinc-200 text-zinc-400'
                                        }`}>
                                        {step.done ? <CheckCircle2 className="h-6 w-6" /> : step.num}
                                    </div>
                                    <span className={`text-sm font-bold ${step.done ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                        {step.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail className="h-5 w-5 text-zinc-400" />
                            <h4 className="font-black text-xs uppercase text-zinc-600">NEED HELP?</h4>
                        </div>
                        <p className="text-sm text-zinc-600">
                            If you haven't heard back within 48 hours, please contact your program administrator at:{' '}
                            <a href="mailto:admin@getfittogether.com" className="text-[#FF5E00] font-bold hover:underline">
                                admin@getfittogether.com
                            </a>
                        </p>
                    </div>

                    {/* Auto-refresh notice */}
                    <p className="text-center text-xs text-zinc-400 mt-6 font-medium">
                        This page automatically checks your status every 10 seconds
                    </p>

                    {/* Logout */}
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/auth?mode=login');
                        }}
                        className="w-full mt-6 text-center text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-zinc-400 mt-6">
                    Registered with: <span className="font-bold text-zinc-600">{userEmail}</span>
                </p>
            </div>
        </div>
    );
}
