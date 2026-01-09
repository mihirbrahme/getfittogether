'use client';

import { useState, useEffect } from 'react';
import { X, Check, Info, Star, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/dateUtils';

interface Goal {
    id: string;
    label: string;
    description: string;
    points: number;
}

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CheckInData) => void;
    dayType?: 'weekday' | 'weekend';
    userId: string;
    dayNumber: number;
}

export interface CheckInData {
    core: Record<string, boolean>;
    custom: Record<string, boolean>;
}

const defaultCoreGoals: Goal[] = [
    { id: 'wod', label: 'Workout of the Day', description: 'Completed daily drill', points: 25 },
    { id: 'steps', label: 'Daily Steps', description: 'Reached 7,500+ steps', points: 10 },
    { id: 'hydration', label: 'Hydration', description: 'Drank 2.5L+ water', points: 6 },
    { id: 'sleep', label: 'Sleep', description: 'Slept 7+ hours', points: 6 },
    { id: 'cleanEating', label: 'Clean Eating', description: 'Followed 80/20 rule', points: 10 },
];

const weekendGoals: Goal[] = [
    { id: 'wod', label: 'Weekend Active Rest', description: 'Walk / Swim / Yoga for 30 mins', points: 15 },
    { id: 'steps', label: 'Weekend Steps', description: 'Reached 10,000+ steps (Bonus)', points: 15 },
    { id: 'hydration', label: 'Hydration', description: 'Drank 2.5L+ water', points: 6 },
    { id: 'sleep', label: 'Sleep', description: 'Slept 8+ hours (Recovery)', points: 10 },
    { id: 'social', label: 'Outdoor Event', description: 'Participated in group event', points: 25 },
];

const availableCustomGoals: Goal[] = [
    { id: 'sugar', label: 'No Added Sugar', description: 'Zero sweets today', points: 5 },
    { id: 'reading', label: 'Reading', description: '20 mins of education', points: 5 },
    { id: 'meditation', label: 'Meditation', description: '10 mins of mindfulness', points: 5 },
    { id: 'cold-plunge', label: 'Cold Exposure', description: '2 min cold shower/plunge', points: 5 },
    { id: 'journal', label: 'Journaling', description: 'Write down thoughts/goals', points: 5 },
    { id: 'no-caffeine-after-2', label: 'Caffeine Cutoff', description: 'No caffeine after 2 PM', points: 5 },
];

export default function CheckInModal({
    isOpen,
    onClose,
    onSubmit,
    dayType = 'weekday',
    userId,
    dayNumber
}: CheckInModalProps) {
    const activeCoreGoals = dayType === 'weekend' ? weekendGoals : defaultCoreGoals;

    const [selectedCustomGoalIds, setSelectedCustomGoalIds] = useState<string[]>([]);
    const [isSelectingGoals, setIsSelectingGoals] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CheckInData>({
        core: activeCoreGoals.reduce((acc, goal) => ({ ...acc, [goal.id]: false }), {}),
        custom: {},
    });

    useEffect(() => {
        if (!isOpen) return;

        const loadUserData = async () => {
            setLoading(true);
            const today = formatDate(new Date(), 'iso');

            // 1. Load active custom goals for this user
            const { data: userGoals } = await supabase
                .from('user_goals')
                .select('goal_name')
                .eq('user_id', userId)
                .eq('active', true);

            const goalIds = userGoals?.map(g => g.goal_name) || [];
            setSelectedCustomGoalIds(goalIds);

            // 2. Initial selection if none
            if (goalIds.length === 0) setIsSelectingGoals(true);

            // 3. Load today's log status
            const { data: log } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .single();

            if (log) {
                setData({
                    core: {
                        wod: log.wod_done,
                        steps: log.steps_done,
                        hydration: log.water_done,
                        sleep: log.sleep_done,
                        cleanEating: log.clean_eating_done, // naming mismatch in DB usually
                    },
                    custom: {
                        ...(goalIds.reduce((acc, id) => ({ ...acc, [id]: false }), {})),
                        ...(log.custom_logs || {})
                    }
                });
            } else {
                setData({
                    core: activeCoreGoals.reduce((acc, goal) => ({ ...acc, [goal.id]: false }), {}),
                    custom: goalIds.reduce((acc, id) => ({ ...acc, [id]: false }), {}),
                });
            }
            setLoading(false);
        };

        loadUserData();
    }, [isOpen, userId, dayType]);

    const toggleCustomGoalSelection = async (id: string) => {
        let newSelection = [...selectedCustomGoalIds];
        if (newSelection.includes(id)) {
            newSelection = newSelection.filter(gid => gid !== id);
        } else if (newSelection.length < 2) {
            newSelection.push(id);
        } else {
            return; // Max 2
        }
        setSelectedCustomGoalIds(newSelection);

        // Persist selection change immediately with 14-day expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 14);
        const expiresStr = formatDate(expiresAt, 'iso');

        await supabase.from('user_goals').update({ active: false }).eq('user_id', userId);
        if (newSelection.length > 0) {
            await supabase.from('user_goals').upsert(
                newSelection.map(gid => ({
                    user_id: userId,
                    goal_name: gid,
                    active: true,
                    expires_at: expiresStr
                }))
            );
        }

        // Sync local data state for custom checkboxes
        setData(prev => {
            const newCustom: Record<string, boolean> = {};
            newSelection.forEach(gid => {
                newCustom[gid] = prev.custom[gid] || false;
            });
            return {
                ...prev,
                custom: newCustom
            };
        });
    };

    const toggleGoal = (id: string, type: 'core' | 'custom') => {
        setData((prev) => ({
            ...prev,
            [type]: { ...prev[type], [id]: !prev[type][id] }
        }));
    };

    const calculatePoints = () => {
        const coreSum = activeCoreGoals.reduce((sum, goal) => sum + (data.core[goal.id] ? goal.points : 0), 0);
        const activeCustomGoalsList = availableCustomGoals.filter(g => selectedCustomGoalIds.includes(g.id));
        const customSum = activeCustomGoalsList.reduce((sum, goal) => sum + (data.custom[goal.id] ? goal.points : 0), 0);
        return coreSum + customSum;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xl transition-all duration-500" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-[3.5rem] border border-zinc-100 shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 ease-out max-h-[90vh] flex flex-col font-body">
                {/* Visual Header Decoration */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FF5E00] to-transparent opacity-50" />

                <div className="p-10 pb-6 shrink-0 relative">
                    <div className="absolute top-0 right-10 w-48 h-48 bg-[#FF5E00]/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 -z-10" />

                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <h2 className="text-4xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-tight">
                                    {isSelectingGoals ? (
                                        <>GOAL <span className="text-[#FF5E00]">SETUP</span></>
                                    ) : (
                                        dayType === 'weekend' ? (
                                            <>WEEKEND <span className="text-[#FF5E00]">CHECK-IN</span></>
                                        ) : (
                                            <>DAILY <span className="text-[#FF5E00]">CHECK-IN</span></>
                                        )
                                    )}
                                </h2>
                                <span className="bg-[#FF5E00] text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-[#FF5E00]/20">
                                    DAY {dayNumber}
                                </span>
                            </div>
                            <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.3em]">
                                {isSelectingGoals ? 'SELECT YOUR PERSONAL GOALS' : 'LOG YOUR PROGRESS FOR TODAY'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isSelectingGoals && (
                                <button
                                    onClick={() => setIsSelectingGoals(true)}
                                    className="h-12 w-12 flex items-center justify-center rounded-2xl bg-zinc-50 hover:bg-[#FF5E00]/10 transition-all text-zinc-400 hover:text-[#FF5E00] border border-zinc-100"
                                    title="Edit Goals"
                                >
                                    <Settings2 className="h-6 w-6" />
                                </button>
                            )}
                            <button onClick={onClose} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-all border border-zinc-100 group">
                                <X className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-10 pb-10 overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <div className="h-12 w-12 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(255,94,0,0.2)]" />
                            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Loading Logs...</span>
                        </div>
                    ) : isSelectingGoals ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in slide-in-from-bottom-8 duration-700 ease-out">
                            {availableCustomGoals.map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => toggleCustomGoalSelection(goal.id)}
                                    className={cn(
                                        "p-6 rounded-[2rem] border transition-all duration-300 text-left group relative overflow-hidden",
                                        selectedCustomGoalIds.includes(goal.id)
                                            ? "bg-white border-[#FF5E00] shadow-2xl shadow-[#FF5E00]/10 scale-[1.02]"
                                            : "bg-zinc-50/50 border-zinc-100 hover:border-zinc-200"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                            selectedCustomGoalIds.includes(goal.id) ? "bg-[#FF5E00] text-white scale-110 shadow-lg shadow-[#FF5E00]/30" : "bg-white border border-zinc-100 text-zinc-300"
                                        )}>
                                            <Star className={cn("h-5 w-5", selectedCustomGoalIds.includes(goal.id) ? "fill-white" : "")} />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                            selectedCustomGoalIds.includes(goal.id) ? "bg-[#FF5E00]/10 text-[#FF5E00]" : "bg-zinc-100 text-zinc-400"
                                        )}>+{goal.points} PTS</span>
                                    </div>
                                    <h4 className={cn(
                                        "font-heading font-black italic uppercase tracking-tight text-xl leading-[0.9] transition-colors",
                                        selectedCustomGoalIds.includes(goal.id) ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-900"
                                    )}>
                                        {goal.label}
                                    </h4>
                                    <p className="text-zinc-400 text-[10px] font-bold uppercase mt-2 tracking-widest leading-relaxed">
                                        {goal.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 ease-out">
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-6 px-2 italic">Daily Habits</h3>
                                <div className="space-y-4">
                                    {activeCoreGoals.map((goal) => (
                                        <button
                                            key={goal.id}
                                            onClick={() => toggleGoal(goal.id, 'core')}
                                            className={cn(
                                                "w-full group relative flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500",
                                                data.core[goal.id]
                                                    ? "bg-white border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-[1.01]"
                                                    : "bg-zinc-50/50 border-zinc-100 hover:border-zinc-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-5 text-left">
                                                <div className={cn(
                                                    "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500",
                                                    data.core[goal.id]
                                                        ? "bg-emerald-500 text-white scale-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                                        : "bg-white border border-zinc-100 text-zinc-300 group-hover:border-zinc-200"
                                                )}>
                                                    {data.core[goal.id] ? <Check className="h-6 w-6 stroke-[4px]" /> : <Info className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <span className={cn("block text-lg font-black font-heading italic uppercase tracking-tight transition-colors leading-none mb-1", data.core[goal.id] ? "text-emerald-600" : "text-zinc-900")}>
                                                        {goal.label}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em]">{goal.description}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn("text-2xl font-black italic tracking-tighter leading-none", data.core[goal.id] ? "text-emerald-600" : "text-zinc-200")}>
                                                    +{goal.points}
                                                </span>
                                                <span className={cn("block text-[8px] font-black uppercase", data.core[goal.id] ? "text-emerald-600" : "text-zinc-200")}>PTS</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedCustomGoalIds.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-6 px-2 italic">Sector Assignments</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {availableCustomGoals.filter(g => selectedCustomGoalIds.includes(g.id)).map((goal) => (
                                            <button
                                                key={goal.id}
                                                onClick={() => toggleGoal(goal.id, 'custom')}
                                                className={cn(
                                                    "group relative flex flex-col p-6 rounded-[2rem] border transition-all duration-500 text-left",
                                                    data.custom[goal.id]
                                                        ? "bg-white border-[#FF5E00] shadow-2xl shadow-[#FF5E00]/10 scale-[1.01]"
                                                        : "bg-zinc-50/50 border-zinc-100 hover:border-zinc-100"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className={cn(
                                                        "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
                                                        data.custom[goal.id] ? "bg-[#FF5E00] text-white shadow-lg shadow-[#FF5E00]/30" : "bg-white border border-zinc-100 text-zinc-300"
                                                    )}>
                                                        <Star className={cn("h-5 w-5", data.custom[goal.id] ? "fill-white" : "")} />
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={cn("text-xl font-black italic leading-none", data.custom[goal.id] ? "text-[#FF5E00]" : "text-zinc-200")}>+{goal.points}</span>
                                                        <span className={cn("block text-[8px] font-black uppercase", data.custom[goal.id] ? "text-[#FF5E00]" : "text-zinc-200")}>PTS</span>
                                                    </div>
                                                </div>
                                                <span className={cn("block text-sm font-black italic uppercase tracking-tight group-hover:text-zinc-900", data.custom[goal.id] ? "text-zinc-900" : "text-zinc-400")}>{goal.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-10 pt-6 bg-white border-t border-zinc-50 shrink-0">
                    <div className="flex items-center justify-between gap-8">
                        {isSelectingGoals ? (
                            <button
                                onClick={() => setIsSelectingGoals(false)}
                                disabled={selectedCustomGoalIds.length !== 2}
                                className="primary-glow w-full bg-[#FF5E00] disabled:bg-zinc-200 disabled:shadow-none text-white font-black text-2xl italic py-6 rounded-[2rem] tracking-tighter uppercase font-heading"
                            >
                                LOCK TARGETS ({selectedCustomGoalIds.length}/2)
                            </button>
                        ) : (
                            <>
                                <div className="flex-1 flex flex-col justify-center">
                                    <span className="text-[11px] uppercase font-black tracking-[0.4em] text-zinc-300 leading-none mb-2">Daily Score</span>
                                    <span className="text-5xl font-black text-zinc-900 tracking-tighter italic leading-none font-heading group">
                                        {calculatePoints()} <span className="text-xl text-[#FF5E00] not-italic align-top">PTS</span>
                                    </span>
                                </div>
                                <button
                                    onClick={() => onSubmit(data)}
                                    className="primary-glow flex-[1.4] bg-[#FF5E00] text-white font-black text-2xl italic py-7 rounded-[2rem] transition-all tracking-tighter uppercase font-heading"
                                >
                                    SUBMIT CHECK-IN
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
