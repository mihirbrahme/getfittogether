'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, Loader2, User, Ruler, Weight, Target, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const availableGoals = [
    { id: 'sugar', label: 'No Added Sugar', points: 5 },
    { id: 'reading', label: 'Reading', points: 5 },
    { id: 'meditation', label: 'Meditation', points: 5 },
    { id: 'cold-plunge', label: 'Cold Exposure', points: 5 },
    { id: 'journal', label: 'Journaling', points: 5 },
    { id: 'no-caffeine-after-2', label: 'Caffeine Cutoff', points: 5 },
];

interface Squad {
    id: string;
    name: string;
    code: string;
}

interface AuthProps {
    defaultMode?: 'login' | 'register';
}

export default function Auth({ defaultMode = 'login' }: AuthProps) {
    const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [squads, setSquads] = useState<Squad[]>([]);
    const router = useRouter();

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [selectedSquadId, setSelectedSquadId] = useState('');

    useEffect(() => {
        const fetchSquads = async () => {
            const { data, error } = await supabase.from('groups').select('id, name, code');
            if (error) {
                console.error('Error fetching squads:', error);
            } else {
                setSquads(data || []);
            }
        };
        fetchSquads();
    }, []);

    const toggleGoal = (id: string) => {
        setSelectedGoals(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) :
                prev.length < 2 ? [...prev, id] : [prev[1], id]
        );
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                // Registration Logic
                if (selectedGoals.length !== 2) throw new Error('Please select exactly 2 goals.');
                if (!selectedSquadId) throw new Error('Please select a Squad.');

                // 1. Sign Up
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            display_name: displayName,
                        }
                    }
                });

                if (signUpError) throw signUpError;
                if (!authData.user) throw new Error('Signup failed.');

                const userId = authData.user.id;

                // 2. Update Profile with Biometrics (Trigger handles base profile)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        height,
                        weight,
                        status: 'approved'
                    })
                    .eq('id', userId);

                if (profileError) console.error('Profile Update Error:', profileError);

                // 3. Set Goals
                const goalEntries = selectedGoals.map(g => ({
                    user_id: userId,
                    goal_name: availableGoals.find(ag => ag.id === g)?.label || g,
                    points: 5,
                    active: true
                }));

                const { error: goalError } = await supabase
                    .from('user_goals')
                    .insert(goalEntries);

                if (goalError) console.error('Goal Error:', goalError);

                // 4. Team Assignment
                const { error: joinError } = await supabase
                    .from('group_members')
                    .insert({
                        group_id: selectedSquadId,
                        user_id: userId,
                        status: 'approved'
                    });
                if (joinError) console.error('Team Join Error:', joinError);
                if (joinError) console.error('Team Join Error:', joinError);
            }

            // Redirect to dashboard on success
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials' ? 'Invalid email or password.' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="premium-card rounded-[3rem] p-10 max-w-lg w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out relative overflow-hidden group border border-zinc-100 shadow-2xl shadow-[#FF5E00]/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5E00]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#FF5E00]/10 transition-colors" />

            <div className="text-center mb-10 relative z-10">
                <div className="h-2 w-16 bg-[#FF5E00] rounded-full mx-auto mb-6" />
                <h2 className="text-4xl font-black text-zinc-900 italic tracking-tighter uppercase leading-none font-heading mb-6">
                    {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE SQUAD'}
                </h2>
                <div className="inline-flex p-1.5 bg-zinc-50 border border-zinc-100 rounded-2xl">
                    <button
                        onClick={() => setMode('login')}
                        className={cn(
                            "px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                            mode === 'login'
                                ? "bg-white text-[#FF5E00] shadow-sm shadow-[#FF5E00]/10 border border-zinc-100"
                                : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >Login</button>
                    <button
                        onClick={() => setMode('register')}
                        className={cn(
                            "px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                            mode === 'register'
                                ? "bg-white text-[#FF5E00] shadow-sm shadow-[#FF5E00]/10 border border-zinc-100"
                                : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >Register</button>
                </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-5 relative z-10">
                {mode === 'register' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Full Name</label>
                            <input
                                placeholder="J. DOE"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold uppercase text-xs focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Display Name</label>
                            <input
                                placeholder="JOHNNY"
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold uppercase text-xs focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Email Address</label>
                    <div className="relative group/input">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within/input:text-[#FF5E00] transition-colors" />
                        <input
                            type="email"
                            placeholder="EMAIL@EXAMPLE.COM"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 text-zinc-900 font-bold uppercase text-xs focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Password</label>
                    <div className="relative group/input">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within/input:text-[#FF5E00] transition-colors" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 text-zinc-900 font-bold text-xs focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                        />
                    </div>
                </div>

                {mode === 'register' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Height</label>
                                <input
                                    placeholder="CM / FT"
                                    required
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold uppercase text-xs text-center focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Weight</label>
                                <input
                                    placeholder="KG / LBS"
                                    required
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold uppercase text-xs text-center focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 block text-center">Select 2 Personal Goals</label>
                            <div className="grid grid-cols-2 gap-2">
                                {availableGoals.map(goal => (
                                    <button
                                        key={goal.id}
                                        type="button"
                                        onClick={() => toggleGoal(goal.id)}
                                        className={cn(
                                            "px-4 py-3 rounded-2xl text-[10px] font-black transition-all border",
                                            selectedGoals.includes(goal.id)
                                                ? "bg-[#FF5E00] text-white border-[#FF5E00] shadow-lg shadow-[#FF5E00]/20"
                                                : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200"
                                        )}
                                    >
                                        {goal.label.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#FF5E00] uppercase tracking-widest px-1 block text-center">Select Your Squad</label>
                            <div className="relative">
                                <select
                                    required
                                    value={selectedSquadId}
                                    onChange={(e) => setSelectedSquadId(e.target.value)}
                                    className="w-full bg-orange-50/50 border border-orange-100 rounded-2xl px-6 py-4 text-zinc-900 font-black uppercase text-sm appearance-none focus:outline-none focus:border-[#FF5E00]/50 transition-all"
                                >
                                    <option value="" disabled className="text-zinc-300">Choose Team</option>
                                    {squads.map(squad => (
                                        <option key={squad.id} value={squad.id} className="text-zinc-900 py-4 font-black">
                                            {squad.name.toUpperCase()} (CODE: {squad.code})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#FF5E00] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-in shake duration-300">
                        <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider text-center">
                            {error}
                        </p>
                    </div>
                )}

                <button
                    disabled={loading}
                    className="primary-glow w-full bg-[#FF5E00] text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group disabled:opacity-50 mt-4"
                >
                    {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <>
                            <span className="italic uppercase text-xl font-heading tracking-tight">
                                {mode === 'login' ? 'LOGIN' : 'JOIN THE MISSION'}
                            </span>
                            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
