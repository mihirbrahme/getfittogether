'use client';

import { useState } from 'react';
import { ArrowRight, Check, Activity, Ruler, Weight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface OnboardingData {
    age: string;
    height: string;
    weight: string;
    fitness_level: 'beginner' | 'intermediate' | 'advanced';
    injuries: string;
}

interface OnboardingWizardProps {
    userId: string;
    onComplete: () => void;
}

export default function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        age: '',
        height: '',
        weight: '',
        fitness_level: 'beginner',
        injuries: ''
    });

    const updateData = (key: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleSubmit();
    };

    const handleSubmit = async () => {
        setLoading(true);

        // Update profile (without weight - that goes to biometric_logs)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                age: parseInt(data.age),
                height: data.height, // Keep height in profiles (static measurement)
                fitness_level: data.fitness_level,
                injuries: data.injuries,
                status: 'approved'
            })
            .eq('id', userId);

        if (profileError) console.error('Profile Update Error:', profileError);

        // Insert biometric data into biometric_logs
        if (data.weight) {
            const { error: biometricError } = await supabase
                .from('biometric_logs')
                .insert({
                    user_id: userId,
                    weight_kg: parseFloat(data.weight) || null,
                    height_cm: parseFloat(data.height) || null
                });

            if (biometricError) console.error('Biometric Log Error:', biometricError);
        }

        if (!profileError) {
            onComplete();
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 font-body">
            <div className="max-w-xl w-full">
                {/* Progress Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Section 0{step} / 03</span>
                        <span className="text-[10px] font-black text-[#FF5E00] uppercase tracking-[0.4em]">Registration {Math.round((step / 3) * 100)}%</span>
                    </div>
                    <div className="flex gap-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-700 ease-out",
                                    step >= i ? "bg-[#FF5E00] shadow-[0_0_10px_rgba(255,94,0,0.3)]" : "bg-zinc-100"
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5E00]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10" />

                    <div className="relative z-10">
                        {step === 1 && (
                            <div className="space-y-10 animate-in slide-in-from-right-8 duration-700 ease-out fill-mode-both">
                                <div className="text-center">
                                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                                        <User className="h-7 w-7 text-[#FF5E00]" />
                                    </div>
                                    <h1 className="text-4xl font-black text-zinc-900 italic uppercase tracking-tighter mb-3 font-heading leading-none">
                                        OFFICER <span className="text-[#FF5E00]">PROFILE</span>
                                    </h1>
                                    <p className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">Establish your service biometrics</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Current Age</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within/input:text-[#FF5E00] transition-colors">YRS</div>
                                            <input
                                                type="number"
                                                value={data.age}
                                                onChange={(e) => updateData('age', e.target.value)}
                                                className="w-full pl-20 pr-8 py-5 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] font-black text-xl text-zinc-900 focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all placeholder:text-zinc-200"
                                                placeholder="00"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 text-center block">Height</label>
                                            <div className="relative group/input text-center">
                                                <input
                                                    type="text"
                                                    value={data.height}
                                                    onChange={(e) => updateData('height', e.target.value)}
                                                    className="w-full px-8 py-5 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] font-black text-xl text-zinc-900 focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all text-center placeholder:text-zinc-200"
                                                    placeholder="CM / FT"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 text-center block">Weight</label>
                                            <div className="relative group/input text-center">
                                                <input
                                                    type="text"
                                                    value={data.weight}
                                                    onChange={(e) => updateData('weight', e.target.value)}
                                                    className="w-full px-8 py-5 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] font-black text-xl text-zinc-900 focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all text-center placeholder:text-zinc-200"
                                                    placeholder="KG / LBS"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-10 animate-in slide-in-from-right-8 duration-700 ease-out fill-mode-both">
                                <div className="text-center">
                                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                                        <Activity className="h-7 w-7 text-[#FF5E00]" />
                                    </div>
                                    <h1 className="text-4xl font-black text-zinc-900 italic uppercase tracking-tighter mb-3 font-heading leading-none">
                                        COMBAT <span className="text-[#FF5E00]">CLASS</span>
                                    </h1>
                                    <p className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">Select your current operational level</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { id: 'beginner', label: 'ROOKIE', desc: 'FOUNDATIONAL TRAINING' },
                                        { id: 'intermediate', label: 'SOLDIER', desc: 'CONSISTENT OPERATIONS' },
                                        { id: 'advanced', label: 'ELITE', desc: 'HIGH INTENSITY DEPLOYMENT' }
                                    ].map((level) => (
                                        <button
                                            key={level.id}
                                            onClick={() => updateData('fitness_level', level.id)}
                                            className={cn(
                                                "w-full text-left p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group/btn",
                                                data.fitness_level === level.id
                                                    ? "border-[#FF5E00] bg-[#FF5E00]/5 shadow-xl shadow-[#FF5E00]/5 scale-[1.01]"
                                                    : "border-zinc-100 bg-zinc-50/50 hover:border-zinc-200"
                                            )}
                                        >
                                            <div className="relative z-10 flex justify-between items-center">
                                                <div>
                                                    <span className={cn(
                                                        "block text-2xl font-black italic uppercase tracking-tighter font-heading leading-none mb-1",
                                                        data.fitness_level === level.id ? "text-[#FF5E00]" : "text-zinc-400 group-hover/btn:text-zinc-900"
                                                    )}>{level.label}</span>
                                                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{level.desc}</span>
                                                </div>
                                                {data.fitness_level === level.id && (
                                                    <div className="h-10 w-10 rounded-xl bg-[#FF5E00] flex items-center justify-center shadow-lg shadow-[#FF5E00]/30 animate-in zoom-in-0 duration-300">
                                                        <Check className="h-6 w-6 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-10 animate-in slide-in-from-right-8 duration-700 ease-out fill-mode-both">
                                <div className="text-center">
                                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                                        <Ruler className="h-7 w-7 text-[#FF5E00]" />
                                    </div>
                                    <h1 className="text-4xl font-black text-zinc-900 italic uppercase tracking-tighter mb-3 font-heading leading-none">
                                        VITAL <span className="text-[#FF5E00]">INTEL</span>
                                    </h1>
                                    <p className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">Log any physical limitations</p>
                                </div>

                                <div>
                                    <textarea
                                        value={data.injuries}
                                        onChange={(e) => updateData('injuries', e.target.value)}
                                        className="w-full h-44 p-8 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] font-black text-sm text-zinc-900 focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all resize-none placeholder:text-zinc-200 uppercase tracking-widest"
                                        placeholder="LIST KNOWN INJURIES OR PHYSICAL DEBTS..."
                                    />
                                    <p className="text-[9px] text-zinc-300 mt-4 font-black uppercase tracking-[0.3em] px-2">Leave blank if mission ready without restriction.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 relative z-10">
                        <button
                            onClick={handleNext}
                            disabled={step === 1 && (!data.age || !data.height || !data.weight)}
                            className="primary-glow w-full bg-[#FF5E00] text-white font-black text-2xl py-7 rounded-[2rem] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-4 italic uppercase tracking-tight font-heading leading-none group/action"
                        >
                            {loading ? (
                                <Activity className="h-8 w-8 animate-spin" />
                            ) : step === 3 ? (
                                <>
                                    FINALIZE DOSSIER
                                    <Check className="h-7 w-7" />
                                </>
                            ) : (
                                <>
                                    SECURE & CONTINUE
                                    <ArrowRight className="h-7 w-7 group-hover/action:translate-x-2 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center px-8">
                    <p className="text-zinc-300 text-[9px] font-black uppercase tracking-[0.4em] leading-relaxed">
                        Operative ID {userId.slice(0, 8).toUpperCase()} <br /> Secure Enrollment Protocol v1.4
                    </p>
                </div>
            </div>
        </div>
    );
}
