'use client';

import { useState } from 'react';
import { X, Check, Info, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
    id: string;
    label: string;
    description: string;
    points: number;
}

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    dayType?: 'weekday' | 'weekend';
    customGoals?: Goal[];
}

export interface CheckInData {
    core: Record<string, boolean>;
    custom: Record<string, boolean>;
}

const defaultCoreGoals: Goal[] = [
    { id: 'wod', label: 'Workout of the Day', description: 'Completed "Operation: Burnout"', points: 25 },
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

export default function CheckInModal({
    isOpen,
    onClose,
    onSubmit,
    dayType = 'weekday',
    customGoals = [
        { id: 'sugar', label: 'No Added Sugar', description: 'Steered clear of sweets', points: 5 },
        { id: 'reading', label: 'Reading', description: '20 mins of education', points: 5 },
    ]
}: CheckInModalProps) {
    const activeGoals = dayType === 'weekend' ? weekendGoals : defaultCoreGoals;

    const [data, setData] = useState<CheckInData>({
        core: activeGoals.reduce((acc, goal) => ({ ...acc, [goal.id]: false }), {}),
        custom: customGoals.reduce((acc, goal) => ({ ...acc, [goal.id]: false }), {}),
    });

    if (!isOpen) return null;

    const toggleGoal = (id: string, type: 'core' | 'custom') => {
        setData((prev) => ({
            ...prev,
            [type]: { ...prev[type], [id]: !prev[type][id] }
        }));
    };

    const calculatePoints = () => {
        const coreSum = activeGoals.reduce((sum, goal) => sum + (data.core[goal.id] ? goal.points : 0), 0);
        const customSum = customGoals.reduce((sum, goal) => sum + (data.custom[goal.id] ? goal.points : 0), 0);
        return coreSum + customSum;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl glass rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                <div className="p-8 pb-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                                    {dayType === 'weekend' ? 'WEEKEND LOG' : 'DAILY CHECK-IN'}
                                </h2>
                                <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full border border-primary/30 uppercase tracking-widest">
                                    Day 12
                                </span>
                            </div>
                            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Honesty is your best workout</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-8 overflow-y-auto custom-scrollbar space-y-8">
                    {/* Core Goals Section */}
                    <div>
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Core Foundations</h3>
                        <div className="space-y-3">
                            {activeGoals.map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => toggleGoal(goal.id, 'core')}
                                    className={cn(
                                        "w-full group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                        data.core[goal.id]
                                            ? "bg-success/10 border-success/30"
                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                                            data.core[goal.id]
                                                ? "bg-success text-black scale-110"
                                                : "bg-zinc-800 text-zinc-500"
                                        )}>
                                            {data.core[goal.id] ? <Check className="h-5 w-5 stroke-[3px]" /> : <Info className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <span className={cn(
                                                "block text-base font-bold transition-colors",
                                                data.core[goal.id] ? "text-success" : "text-white"
                                            )}>
                                                {goal.label}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{goal.description}</span>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-lg font-black italic",
                                        data.core[goal.id] ? "text-success" : "text-zinc-700"
                                    )}>
                                        +{goal.points}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Goals Section */}
                    <div>
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">My Personalized Targets</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {customGoals.map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => toggleGoal(goal.id, 'custom')}
                                    className={cn(
                                        "group relative flex flex-col p-4 rounded-2xl border transition-all duration-300 text-left",
                                        data.custom[goal.id]
                                            ? "bg-primary/10 border-primary/30"
                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Star className={cn(
                                            "h-4 w-4",
                                            data.custom[goal.id] ? "text-primary fill-primary" : "text-zinc-600"
                                        )} />
                                        <span className={cn(
                                            "text-sm font-black italic",
                                            data.custom[goal.id] ? "text-primary" : "text-zinc-700"
                                        )}>
                                            +{goal.points}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "block text-sm font-bold uppercase tracking-tight",
                                        data.custom[goal.id] ? "text-white" : "text-zinc-400"
                                    )}>
                                        {goal.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-4 glass border-t border-white/10 shrink-0">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex-1 flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 mb-1">Total Impact</span>
                            <span className="text-44xl font-black text-white tracking-tighter italic leading-none">
                                {calculatePoints()} <span className="text-lg text-primary not-italic">pts</span>
                            </span>
                        </div>
                        <button
                            onClick={() => onSubmit(data)}
                            className="flex-[1.5] bg-primary hover:bg-primary/90 text-black font-black text-xl italic py-5 rounded-3xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20 tracking-tighter"
                        >
                            COMPLETE DAY 12
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
