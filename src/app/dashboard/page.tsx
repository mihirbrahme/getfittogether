'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Check, Calendar, ArrowRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays, subDays, startOfDay } from 'date-fns';

const TOTAL_DAYS = 70;

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState('');

    // Stats State
    const [currentDay, setCurrentDay] = useState(1);
    const [daysRemaining, setDaysRemaining] = useState(TOTAL_DAYS);
    const [weeklyStatus, setWeeklyStatus] = useState<(boolean | null)[]>(Array(7).fill(null));
    const [streak, setStreak] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/auth?mode=login');

            // 1. Fetch Profile & Group Start Date
            const { data: profile } = await supabase
                .from('profiles')
                .select(`
                    display_name,
                    full_name,
                    total_points,
                    group_members (
                        groups (
                            start_date
                        )
                    )
                `)
                .eq('id', user.id)
                .single();

            if (profile) {
                // Set Name (Use display name or first name)
                const nameToUse = profile.display_name || profile.full_name?.split(' ')[0] || 'Soldier';
                setFirstName(nameToUse);
                setTotalPoints(profile.total_points || 0);

                // Calculate Day of Program
                // @ts-ignore
                const groupStartDate = profile.group_members?.[0]?.groups?.start_date;
                if (groupStartDate) {
                    const start = new Date(groupStartDate);
                    const today = new Date();
                    const diff = differenceInDays(today, start);
                    const dayNum = Math.max(1, diff + 1);
                    setCurrentDay(dayNum);
                    setDaysRemaining(Math.max(0, TOTAL_DAYS - dayNum));
                }
            }

            // 2. Fetch Weekly Logs (Last 7 Days)
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(today, 6 - i);
                return format(d, 'yyyy-MM-dd');
            });

            const { data: logs } = await supabase
                .from('daily_logs')
                .select('date')
                .eq('user_id', user.id)
                .in('date', last7Days);

            // Map logs to status array
            const statusMap = new Set(logs?.map(l => l.date));
            const newStatus = last7Days.map(dateStr => statusMap.has(dateStr)); // true if logged, false if missed (simplified)

            // For future days vs missed past days logic:
            // This simple version assumes false = missed. 
            // Better logic: if date > today, result is null (future).
            // But here we are iterating up to today. So all are past or present.

            setWeeklyStatus(newStatus);
            setStreak(logs?.length || 0); // Simple count for now, real streak logic involves consecutive check

            setLoading(false);
        };
        fetchData();
    }, [router]);

    if (loading) return null;

    const weekLabels = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, 'EEE'); // Mon, Tue...
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-1">Overview</h2>
                    <h1 className="text-3xl lg:text-4xl font-black italic text-zinc-900 uppercase tracking-tighter">
                        Keep going, <br /><span className="text-[#FF5E00]">{firstName}</span>.
                    </h1>
                </div>
                <div className="h-12 w-12 bg-zinc-100 rounded-full border border-zinc-200 flex items-center justify-center">
                    <span className="font-black text-zinc-400">{firstName[0]}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-5xl font-black italic text-zinc-900 tracking-tighter mb-2">{currentDay}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5E00]">Day of Program</span>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-5xl font-black italic text-zinc-900 tracking-tighter mb-2">{totalPoints}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5E00]">Total Points</span>
                </div>
            </div>

            {/* Weekly Status */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-50 rounded-xl">
                        <Activity className="h-5 w-5 text-[#FF5E00]" />
                    </div>
                    <h3 className="text-lg font-black italic text-zinc-900 uppercase">Last 7 Days</h3>
                </div>

                <div className="flex justify-between items-center">
                    {weekLabels.map((day, i) => {
                        const isLogged = weeklyStatus[i];
                        const isToday = i === 6;

                        return (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all",
                                    isLogged
                                        ? "bg-[#FF5E00] border-[#FF5E00] text-white"
                                        : isToday
                                            ? "bg-zinc-50 border-zinc-100 text-zinc-300 animate-pulse" // Today pending
                                            : "bg-red-50 border-red-100 text-red-300" // Past Missed
                                )}>
                                    {isLogged ? <Check className="h-5 w-5" /> :
                                        isToday ? <div className="h-2 w-2 rounded-full bg-zinc-300" /> :
                                            <span className="text-xs font-black">X</span>}
                                </div>
                                <span className="text-[10px] font-bold text-zinc-300 uppercase">{day}</span>
                            </div>
                        );
                    })}
                </div>
                <p className="text-center text-xs font-medium text-zinc-400 mt-6">
                    {streak > 0
                        ? <span>You've logged <span className="text-[#FF5E00] font-black">{streak}</span> times this week. Good work.</span>
                        : "Start your streak today."}
                </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#FF5E00] to-orange-600 p-8 rounded-[2.5rem] shadow-xl shadow-orange-500/30 text-center relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => router.push('/dashboard/check-in')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                        <Check className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tight mb-2">Log Today's Activity</h3>
                    <p className="text-orange-100 text-sm font-medium">Log your daily progress including WOD, habits, and goals.</p>
                </div>
            </div>
        </div>
    );
}
