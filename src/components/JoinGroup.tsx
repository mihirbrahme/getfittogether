'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl max-w-md mx-auto">
            <div className="text-center mb-8">
                <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                    <UserPlus className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Join a Squad</h2>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-2">Enter your unique invitation code</p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="CODE-123"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[0.3em] text-primary focus:outline-none focus:border-primary uppercase placeholder:text-zinc-800"
                    />
                </div>

                <button
                    disabled={loading || status === 'success'}
                    className={cn(
                        "w-full py-4 rounded-2xl font-black italic text-lg transition-all shadow-xl",
                        status === 'success'
                            ? "bg-success text-black pointer-events-none"
                            : "bg-white text-black hover:bg-white/90 active:scale-95"
                    )}
                >
                    {loading ? 'REQUESTING...' : status === 'success' ? 'REQUEST SENT' : 'SEND JOIN REQUEST'}
                </button>
            </form>

            {status !== 'idle' && (
                <div className={cn(
                    "mt-6 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
                    status === 'success' ? "bg-success/10 border border-success/20 text-success" : "bg-red-500/10 border border-red-500/20 text-red-500"
                )}>
                    {status === 'success' ? <Clock className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                    <p className="text-xs font-bold uppercase tracking-wider">{message}</p>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/5 text-center px-4">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed">
                    Your squad leader will receive your request immediately. You'll see your workouts once approved.
                </p>
            </div>
        </div>
    );
}
