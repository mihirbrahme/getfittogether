'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Plus, Scale, Activity, Droplets, X, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import DateDisplay from '@/components/DateDisplay';
import { logBiometricUpdate } from '@/lib/auditLog';

interface BiometricEntry {
    id: string;
    weight_kg: number | null;
    height_cm: number | null;
    body_fat_percentage: number | null;
    muscle_mass_percentage: number | null;
    bmi: number | null;
    measured_at: string;
}

export default function ProgressPage() {
    const [biometrics, setBiometrics] = useState<BiometricEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [muscleMass, setMuscleMass] = useState('');

    useEffect(() => {
        fetchBiometrics();
    }, []);

    const fetchBiometrics = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get height from profile (it rarely changes)
        const { data: profile } = await supabase
            .from('profiles')
            .select('height')
            .eq('id', user.id)
            .single();

        // Get all biometric logs
        const { data, error } = await supabase
            .from('biometric_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('measured_at', { ascending: false });

        if (error) {
            console.error('Error fetching biometrics:', error);
            setError('Failed to load biometrics');
        } else {
            setBiometrics(data || []);
        }

        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('Not authenticated');
            setSubmitting(false);
            return;
        }

        // Get height from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('height')
            .eq('id', user.id)
            .single();

        const newEntry = {
            user_id: user.id,
            weight_kg: weight ? parseFloat(weight) : null,
            height_cm: profile?.height || null,
            body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
            muscle_mass_percentage: muscleMass ? parseFloat(muscleMass) : null,
        };

        const { data, error: insertError } = await supabase
            .from('biometric_logs')
            .insert([newEntry])
            .select()
            .single();

        if (insertError) {
            setError('Failed to save biometrics');
            console.error(insertError);
        } else {
            // Log audit event
            await logBiometricUpdate(user.id, data.id, {
                weight_kg: newEntry.weight_kg,
                body_fat_percentage: newEntry.body_fat_percentage,
                muscle_mass_percentage: newEntry.muscle_mass_percentage,
            });

            // Reset form and refresh data
            setWeight('');
            setBodyFat('');
            setMuscleMass('');
            setShowForm(false);
            fetchBiometrics();
        }

        setSubmitting(false);
    };

    const latestEntry = biometrics[0];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-black uppercase text-zinc-400 tracking-widest">Loading Progress...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with Date */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">
                        Your <span className="text-[#FF5E00]">Progress</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        Track your biometric journey
                    </p>
                </div>
                <DateDisplay />
            </div>

            {/* Current Metrics Card */}
            {latestEntry && (
                <div className="bg-gradient-to-br from-[#FF5E00] to-orange-600 rounded-[3rem] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="h-8 w-8" />
                            <h2 className="text-2xl font-black italic uppercase">Current Status</h2>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <Scale className="h-6 w-6 mb-3" />
                                <p className="text-sm font-medium opacity-80 mb-1">Weight</p>
                                <p className="text-3xl font-black">{latestEntry.weight_kg || '--'}</p>
                                <p className="text-xs opacity-60 mt-1">kg</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <Activity className="h-6 w-6 mb-3" />
                                <p className="text-sm font-medium opacity-80 mb-1">BMI</p>
                                <p className="text-3xl font-black">{latestEntry.bmi?.toFixed(1) || '--'}</p>
                                <p className="text-xs opacity-60 mt-1">index</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <Droplets className="h-6 w-6 mb-3" />
                                <p className="text-sm font-medium opacity-80 mb-1">Body Fat</p>
                                <p className="text-3xl font-black">{latestEntry.body_fat_percentage || '--'}</p>
                                <p className="text-xs opacity-60 mt-1">%</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <TrendingUp className="h-6 w-6 mb-3" />
                                <p className="text-sm font-medium opacity-80 mb-1">Muscle Mass</p>
                                <p className="text-3xl font-black">{latestEntry.muscle_mass_percentage || '--'}</p>
                                <p className="text-xs opacity-60 mt-1">%</p>
                            </div>
                        </div>

                        <p className="text-sm opacity-70 mt-6">
                            Last updated: {format(new Date(latestEntry.measured_at), 'MMMM d, yyyy')}
                        </p>
                    </div>
                </div>
            )}

            {/* Add New Measurement Button */}
            <div className="flex justify-center">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-8 rounded-2xl uppercase flex items-center gap-3 transition-all hover:scale-105"
                >
                    {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {showForm ? 'Cancel' : 'Add New Measurement'}
                </button>
            </div>

            {/* Add New Measurement Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 border border-zinc-100 shadow-sm">
                    <h3 className="text-2xl font-black italic uppercase text-zinc-900 mb-6">New Measurement</h3>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-black uppercase text-zinc-600 mb-2">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 font-medium focus:outline-none focus:border-[#FF5E00]"
                                placeholder="70.5"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-zinc-600 mb-2">
                                Body Fat (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={bodyFat}
                                onChange={(e) => setBodyFat(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 font-medium focus:outline-none focus:border-[#FF5E00]"
                                placeholder="18.5"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-zinc-600 mb-2">
                                Muscle Mass (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={muscleMass}
                                onChange={(e) => setMuscleMass(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 font-medium focus:outline-none focus:border-[#FF5E00]"
                                placeholder="45.0"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || (!weight && !bodyFat && !muscleMass)}
                        className="w-full bg-[#FF5E00] hover:bg-orange-600 text-white font-black py-4 rounded-2xl uppercase flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Measurement'
                        )}
                    </button>
                </form>
            )}

            {/* History */}
            <div className="bg-white rounded-[3rem] p-10 border border-zinc-100 shadow-sm">
                <h3 className="text-2xl font-black italic uppercase text-zinc-900 mb-6">Measurement History</h3>

                {biometrics.length === 0 ? (
                    <div className="text-center py-12">
                        <Activity className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                        <p className="text-zinc-400 font-medium">No measurements yet. Add your first entry above!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {biometrics.map((entry, index) => {
                            const prevEntry = biometrics[index + 1];
                            const weightChange = prevEntry ? entry.weight_kg! - prevEntry.weight_kg! : 0;

                            return (
                                <div key={entry.id} className="flex items-center justify-between p-6 rounded-2xl border border-zinc-100 hover:border-[#FF5E00] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-[#FF5E00]/10 flex items-center justify-center">
                                            <TrendingUp className="h-6 w-6 text-[#FF5E00]" />
                                        </div>
                                        <div>
                                            <p className="font-black text-zinc-900">
                                                {format(new Date(entry.measured_at), 'MMM d, yyyy')}
                                            </p>
                                            <p className="text-sm text-zinc-400 font-medium">
                                                {format(new Date(entry.measured_at), 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Weight</p>
                                            <p className="font-black text-zinc-900">{entry.weight_kg || '--'} kg</p>
                                            {weightChange !== 0 && prevEntry && (
                                                <p className={`text-xs font-bold ${weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-zinc-400 uppercase font-bold mb-1">BMI</p>
                                            <p className="font-black text-zinc-900">{entry.bmi?.toFixed(1) || '--'}</p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Body Fat</p>
                                            <p className="font-black text-zinc-900">{entry.body_fat_percentage || '--'}%</p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Muscle</p>
                                            <p className="font-black text-zinc-900">{entry.muscle_mass_percentage || '--'}%</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
