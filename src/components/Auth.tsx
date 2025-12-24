'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="glass rounded-3xl p-8 border border-white/10 text-center animate-in zoom-in-95 duration-500">
                <div className="h-20 w-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6 text-success">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Welcome to the Squad</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs leading-relaxed">
                    Please check your email to verify your account.<br />Then you can dive into the challenge!
                </p>
                <button
                    onClick={() => { setSuccess(false); setIsLogin(true); }}
                    className="mt-8 text-primary font-black uppercase tracking-widest text-[10px] hover:underline"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-3xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                    {isLogin ? 'RESUME MISSION' : 'JOIN THE CHALLENGE'}
                </h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3">
                    {isLogin ? 'Enter your credentials to continue' : 'Create your operative profile'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="email"
                            placeholder="operator@fit-together.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase">Password</label>
                        {isLogin && (
                            <button type="button" className="text-[10px] font-black text-primary uppercase hover:underline">Forgot?</button>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all tracking-widest"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
                    </div>
                )}

                <button
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group overflow-hidden relative"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            <span className="italic uppercase text-lg tracking-tighter">
                                {isLogin ? 'INITIATE LOGIN' : 'START JOURNEY'}
                            </span>
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                    {isLogin ? "Don't have an account?" : "Already an operative?"}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="ml-2 text-white hover:text-primary transition-colors underline decoration-white/20 underline-offset-4"
                    >
                        {isLogin ? 'SIGN UP NOW' : 'LOG IN HERE'}
                    </button>
                </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-4">
                <div className="h-1 w-1 rounded-full bg-zinc-800" />
                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em]">Encrypted Session</span>
                <div className="h-1 w-1 rounded-full bg-zinc-800" />
            </div>
        </div>
    );
}
