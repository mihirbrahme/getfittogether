'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, Loader2, User, Ruler, Weight, Target, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [height, setHeight] = useState(''); // in cms
    const [weight, setWeight] = useState(''); // in kgs
    const [bodyFat, setBodyFat] = useState('');
    const [muscleMass, setMuscleMass] = useState('');
    const [selectedSquadId, setSelectedSquadId] = useState('');

    // Calculate BMI
    const calculateBMI = (heightCm: number, weightKg: number): number => {
        if (!heightCm || !weightKg) return 0;
        return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 100) / 100;
    };

    const bmi = calculateBMI(parseFloat(height) || 0, parseFloat(weight) || 0);

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


    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                // Login
                const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
                if (loginError) throw loginError;

                if (authData.user) {
                    // Check user's role and status
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role, status')
                        .eq('id', authData.user.id)
                        .single();

                    if (profileError) throw profileError;

                    // Redirect based on role and status
                    if (profile.status === 'pending') {
                        router.push('/pending-approval');
                    } else if (profile.role === 'admin') {
                        router.push('/admin');
                    } else {
                        router.push('/dashboard');
                    }
                    return;
                }
            } else {
                // Registration Logic
                if (!selectedSquadId) throw new Error('Please select a Squad.');

                // 1. Sign Up
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: `${firstName} ${lastName}`,
                        }
                    }
                });

                if (signUpError) throw signUpError;
                if (!authData.user) throw new Error('Signup failed.');

                const userId = authData.user.id;

                // 2. Create/Update Profile (UPSERT) - WITHOUT biometric columns
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        first_name: firstName,
                        last_name: lastName,
                        full_name: `${firstName} ${lastName}`,
                        display_name: firstName,
                        height: parseFloat(height), // Keep height in profiles (static measurement)
                        role: 'participant',
                        status: 'pending',
                        total_points: 0
                    });

                if (profileError) console.error('Profile Update Error:', profileError);

                // 3. Insert initial biometric data into biometric_logs
                const { error: biometricError } = await supabase
                    .from('biometric_logs')
                    .insert({
                        user_id: userId,
                        weight_kg: parseFloat(weight) || null,
                        height_cm: parseFloat(height) || null,
                        body_fat_percentage: parseFloat(bodyFat) || null,
                        muscle_mass_percentage: parseFloat(muscleMass) || null
                        // BMI will be auto-calculated by trigger if exists
                    });

                if (biometricError) console.error('Biometric Log Error:', biometricError);

                // 4. Squad Assignment
                const { error: joinError } = await supabase
                    .from('group_members')
                    .insert({
                        group_id: selectedSquadId,
                        user_id: userId,
                        status: 'pending'
                    });
                if (joinError) console.error('Squad Join Error:', joinError);

                // 4. Goals will be assigned by admin later
                // No user_goals insertion here

                // Redirect to pending approval page
                router.push('/pending-approval');
            }
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
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">First Name</label>
                            <input
                                placeholder="JOHN"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold uppercase text-xs focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Last Name</label>
                            <input
                                placeholder="DOE"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
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
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Height (cm)</label>
                                <input
                                    type="number"
                                    placeholder="175"
                                    required
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold text-sm text-center focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    placeholder="70"
                                    required
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold text-sm text-center focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                                />
                            </div>
                        </div>

                        {bmi > 0 && (
                            <div className="text-center p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                                <p className="text-xs text-blue-600 font-bold">
                                    Calculated BMI: <span className="text-lg font-black">{bmi}</span>
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Body Fat %</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="18.5"
                                    value={bodyFat}
                                    onChange={(e) => setBodyFat(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold text-sm text-center focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Muscle Mass %</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="42"
                                    value={muscleMass}
                                    onChange={(e) => setMuscleMass(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-bold text-sm text-center focus:outline-none focus:border-[#FF5E00]/30 transition-all placeholder:text-zinc-200"
                                />
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
                                    <option value="" disabled className="text-zinc-300">Choose Squad</option>
                                    {squads.map(squad => (
                                        <option key={squad.id} value={squad.id} className="text-zinc-900 py-4 font-black">
                                            {squad.name.toUpperCase()} (CODE: {squad.code})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#FF5E00] pointer-events-none" />
                            </div>
                            <p className="text-[10px] text-zinc-400 text-center px-2 font-medium">
                                Your personal goals will be assigned by admin
                            </p>
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
