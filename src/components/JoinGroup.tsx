'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Search, CheckCircle2, Clock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JoinGroupProps {
    userId: string;
    onJoinRequested?: () => void;
}

export default function JoinGroup({ userId, onJoinRequested }: JoinGroupProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        // 1. Find group by code
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('id, name')
            .eq('code', code.toUpperCase())
            .single();

        if (groupError || !group) {
            setStatus('error');
            setMessage('Invalid join code. Please check with your squad leader.');
            setLoading(false);
            return;
        }

        // 2. Create join request
        const { error: joinError } = await supabase
            .from('group_members')
            .insert([
                { group_id: group.id, user_id: userId, status: 'pending' }
            ]);

        if (joinError) {
            if (joinError.code === '23505') {
                setMessage(`You've already requested to join ${group.name}.`);
            } else {
                setMessage('Something went wrong. Try again later.');
            }
            setStatus('error');
        } else {
            setStatus('success');
            setMessage(`Success! Your request to join ${group.name} is pending approval.`);
            if (onJoinRequested) onJoinRequested();
        }

        setLoading(false);
    };

    return (
        <div className="premium-card rounded-[3.5rem] p-12 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5E00]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-[#FF5E00]/10 transition-colors duration-1000" />

            <div className="h-20 w-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-zinc-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <UserPlus className="h-10 w-10 text-[#FF5E00]" />
            </div>

            <h2 className="text-4xl font-black italic tracking-tighter text-zinc-900 uppercase mb-3 font-heading leading-none">
                JOIN YOUR <span className="text-[#FF5E00]">SQUAD</span>
            </h2>
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12">DEPLOYMENT AUTHENTICATION REQUIRED</p>

            <form onSubmit={handleJoin} className="space-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Access Token</label>
                    <div className="relative group/input">
                        <input
                            type="text"
                            placeholder="ALPHA-01"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className="w-full text-center text-3xl font-black uppercase tracking-[0.2em] py-6 bg-zinc-50 border border-zinc-100 rounded-[2rem] focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all text-zinc-900 placeholder:text-zinc-200 font-heading"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !code || status === 'success'}
                    className={cn(
                        "primary-glow w-full font-black text-2xl py-7 rounded-[2rem] transition-all flex items-center justify-center gap-4 italic uppercase tracking-tight font-heading leading-none group/action disabled:opacity-50 disabled:grayscale",
                        status === 'success'
                            ? "bg-emerald-500 text-white pointer-events-none"
                            : "bg-[#FF5E00] text-white"
                    )}
                >
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> :
                        status === 'success' ? <>SYNC COMPLETE <CheckCircle2 className="h-7 w-7" /></> :
                            <>INITIATE DEPLOY <ArrowRight className="h-7 w-7 group-hover/action:translate-x-2 transition-transform" /></>}
                </button>
            </form>

            {status !== 'idle' && status !== 'success' && (
                <div className="mt-8 p-6 rounded-[1.5rem] flex items-start gap-4 bg-red-50 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-4 duration-500">
                    <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-left leading-relaxed">{message}</p>
                </div>
            )}

            {status === 'success' && (
                <div className="mt-8 p-6 rounded-[1.5rem] flex items-start gap-4 bg-emerald-50 text-emerald-600 border border-emerald-100 animate-in fade-in slide-in-from-top-4 duration-500">
                    <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-left leading-relaxed">{message}</p>
                </div>
            )}

            <div className="mt-12 text-center">
                <p className="text-zinc-300 text-[9px] font-black uppercase tracking-[0.4em] leading-relaxed">
                    Secure Protocol Active <br /> Unit Identification Required
                </p>
            </div>
        </div>
    );
}
