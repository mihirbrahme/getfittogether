'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Moon, Droplets, Check, X, Flame, Footprints, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UserGoal {
    id: string;
    goal_name: string;
}

export default function CheckInPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [goals, setGoals] = useState<UserGoal[]>([]);

    // Form State (Null = unanswered, true = yes, false = no)
    const [wodDone, setWodDone] = useState<boolean | null>(null);
    const [stepsDone, setStepsDone] = useState<boolean | null>(null);
    const [dietDone, setDietDone] = useState<boolean | null>(null);
    const [sleepDone, setSleepDone] = useState<boolean | null>(null);
    const [waterDone, setWaterDone] = useState<boolean | null>(null);

    // Custom Goals State
    const [goalStatus, setGoalStatus] = useState<Record<string, boolean | null>>({});

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/auth?mode=login');

            // 1. Fetch User Goals
            const { data: userGoals } = await supabase
                .from('user_goals')
                .select('id, goal_name')
                .eq('user_id', user.id)
                .eq('active', true);

            if (userGoals) {
                setGoals(userGoals);
                const initialStatus: Record<string, boolean | null> = {};
                userGoals.forEach(g => initialStatus[g.id] = null);
                setGoalStatus(initialStatus);
            }

            // 2. Check if already logged today
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: existingLog } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (existingLog) {
                setWodDone(existingLog.wod_done);
                setStepsDone(existingLog.steps_done);
                setDietDone(existingLog.clean_eating_done);
                setSleepDone(existingLog.sleep_done);
                setWaterDone(existingLog.water_done);
                // Simple parsing for custom logs could be added here if we want persistence of answers 
                // between sessions on the same day.
            }

            setLoading(false);
        };
        fetchData();
    }, [router]);

    const handleGoalToggle = (goalId: string, status: boolean) => {
        setGoalStatus(prev => ({
            ...prev,
            [goalId]: status
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = format(new Date(), 'yyyy-MM-dd');

        // Prepare Custom Logs JSON
        const customLogs = Object.entries(goalStatus).reduce((acc, [id, status]) => {
            const goalName = goals.find(g => g.id === id)?.goal_name;
            if (goalName) acc[goalName] = status;
            return acc;
        }, {} as Record<string, boolean | null>);

        // Points are now calculated by DB Trigger, we just send raw data
        const { error } = await supabase
            .from('daily_logs')
            .upsert({
                user_id: user.id,
                date: today,
                wod_done: wodDone,
                steps_done: stepsDone,
                clean_eating_done: dietDone,
                sleep_done: sleepDone,
                water_done: waterDone,
                custom_logs: customLogs
            }, { onConflict: 'user_id, date' });

        if (error) {
            console.error('Error logging:', error);
            alert('Failed to save log. Please try again.');
        } else {
            router.push('/dashboard');
        }
        setSubmitting(false);
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
        </div>
    );

    const isFormComplete =
        wodDone !== null &&
        stepsDone !== null &&
        dietDone !== null &&
        sleepDone !== null &&
        waterDone !== null &&
        Object.values(goalStatus).every(v => v !== null);

    const ToggleCard = ({
        icon: Icon,
        title,
        subtitle,
        value,
        onChange,
        points
    }: {
        icon: any,
        title: string,
        subtitle: string,
        value: boolean | null,
        onChange: (v: boolean) => void,
        points: number
    }) => (
        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-50 rounded-xl text-[#FF5E00]">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-bold text-zinc-900 uppercase">{title}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">+{points} PTS</span>
                        <p className="text-xs text-zinc-400 font-medium">{subtitle}</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onChange(false)} className={cn("h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-all", value === false ? "bg-zinc-900 border-zinc-900 text-white" : "bg-zinc-50 border-zinc-100 text-zinc-300")}>
                    <X className="h-6 w-6" />
                </button>
                <button onClick={() => onChange(true)} className={cn("h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-all", value === true ? "bg-[#FF5E00] border-[#FF5E00] text-white shadow-lg shadow-[#FF5E00]/30" : "bg-zinc-50 border-zinc-100 text-zinc-300")}>
                    <Check className="h-6 w-6" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black italic uppercase text-zinc-900">Daily Report</h1>
                <p className="text-zinc-500 font-medium text-sm">Truth is strength. Log your mission.</p>
            </div>

            <div className="space-y-4">
                <h3 className="text-center text-zinc-400 text-xs font-black uppercase tracking-widest">CORE HABITS</h3>

                <ToggleCard
                    icon={Flame}
                    title="WOD"
                    subtitle="Workout completed?"
                    value={wodDone}
                    onChange={setWodDone}
                    points={20}
                />

                <ToggleCard
                    icon={Footprints}
                    title="Activity"
                    subtitle="8k Steps or Run?"
                    value={stepsDone}
                    onChange={setStepsDone}
                    points={10}
                />

                <ToggleCard
                    icon={Utensils}
                    title="Fuel"
                    subtitle="Pro-Fuel / Clean Eating?"
                    value={dietDone}
                    onChange={setDietDone}
                    points={10}
                />

                <ToggleCard
                    icon={Moon}
                    title="Sleep"
                    subtitle="7+ Hours?"
                    value={sleepDone}
                    onChange={setSleepDone}
                    points={10}
                />

                <ToggleCard
                    icon={Droplets}
                    title="Hydration"
                    subtitle="2.5L+ Water?"
                    value={waterDone}
                    onChange={setWaterDone}
                    points={10}
                />
            </div>

            {goals.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-center text-zinc-400 text-xs font-black uppercase tracking-widest">PERSONAL TARGETS</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {goals.map(goal => (
                            <div key={goal.id} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-bold text-zinc-900 uppercase">{goal.goal_name}</span>
                                    <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full w-fit mt-1">+5 PTS</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleGoalToggle(goal.id, false)} className={cn("h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-all", goalStatus[goal.id] === false ? "bg-zinc-900 border-zinc-900 text-white" : "bg-zinc-50 border-zinc-100 text-zinc-300")}>
                                        <X className="h-6 w-6" />
                                    </button>
                                    <button onClick={() => handleGoalToggle(goal.id, true)} className={cn("h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-all", goalStatus[goal.id] === true ? "bg-[#FF5E00] border-[#FF5E00] text-white shadow-lg shadow-[#FF5E00]/30" : "bg-zinc-50 border-zinc-100 text-zinc-300")}>
                                        <Check className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={submitting || !isFormComplete}
                className="w-full bg-[#FF5E00] text-white font-black py-6 rounded-2xl text-xl uppercase italic tracking-tight shadow-xl shadow-[#FF5E00]/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:grayscale"
            >
                {submitting ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Verify & Submit Log"}
            </button>
        </div>
    );
}
