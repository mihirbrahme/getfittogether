'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Check, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, subDays, formatShortWeekday } from '@/lib/dateUtils';
import DateDisplay from '@/components/DateDisplay';
import StreakBadge from '@/components/StreakBadge';
import WODPreview from '@/components/WODPreview';
import AnimatedNumber from '@/components/AnimatedNumber';
import ProgressRing from '@/components/ProgressRing';
import PhaseBanner from '@/components/PhaseBanner';
import ProgressPrompt from '@/components/ProgressPrompt';

const TOTAL_DAYS = 70;
const MAX_DAILY_POINTS = 75; // WOD(25) + Steps(10) + Diet(10) + Sleep(10) + Hydration(10) + Goals(10)

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
    const [todayPoints, setTodayPoints] = useState(0);
    const [todayCompletion, setTodayCompletion] = useState(0);
    const [lastBiometricDate, setLastBiometricDate] = useState<string | null>(null);
    const [showProgressPrompt, setShowProgressPrompt] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/auth?mode=login');

            // 1. Fetch Profile & Group Start Date
            const { data: profile } = await supabase
                .from('profiles')
                .select(`
                    first_name,
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
                const nameToUse = profile.first_name || profile.full_name?.split(' ')[0] || 'Participant';
                setFirstName(nameToUse);
                setTotalPoints(profile.total_points || 0);

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

            // 2. Fetch Weekly Logs (Last 7 Days) and calculate streak
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(today, 6 - i);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            });

            const { data: logs } = await supabase
                .from('daily_logs')
                .select('date, daily_points')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(30);

            // Map logs to status array
            const logsMap = new Map(logs?.map(l => [l.date, l.daily_points]) || []);
            const newStatus = last7Days.map(dateStr => logsMap.has(dateStr));
            setWeeklyStatus(newStatus);

            // Calculate actual streak (consecutive days)
            let consecutiveDays = 0;
            if (logs && logs.length > 0) {
                const sortedDates = logs.map(l => l.date).sort().reverse();
                for (let i = 0; i < sortedDates.length; i++) {
                    const expectedDate = subDays(today, i);
                    const expectedStr = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, '0')}-${String(expectedDate.getDate()).padStart(2, '0')}`;
                    if (sortedDates.includes(expectedStr)) {
                        consecutiveDays++;
                    } else {
                        break;
                    }
                }
            }
            setStreak(consecutiveDays);

            // Today's points - recalculate from custom_logs instead of trusting stored value
            const { data: todayLogFull } = await supabase
                .from('daily_logs')
                .select('daily_points, custom_logs, junk_food, processed_sugar, alcohol_excess')
                .eq('user_id', user.id)
                .eq('date', todayStr)
                .single();

            if (todayLogFull?.custom_logs) {
                // Fetch activities and goals to get actual point values
                const { data: membership } = await supabase
                    .from('group_members')
                    .select('group_id')
                    .eq('user_id', user.id)
                    .single();

                let recalculatedPoints = 0;
                const customLogs = todayLogFull.custom_logs as Record<string, boolean>;

                if (membership?.group_id) {
                    const { data: activities } = await supabase
                        .from('squad_checkin_activities')
                        .select('id, points')
                        .eq('squad_id', membership.group_id)
                        .eq('enabled', true);

                    if (activities) {
                        activities.forEach(a => {
                            if (customLogs[`activity_${a.id}`] === true) {
                                recalculatedPoints += Math.max(0, a.points || 0);
                            }
                        });
                    }
                }

                const { data: userGoals } = await supabase
                    .from('user_goal_assignments')
                    .select('slot, goal_templates(points)')
                    .eq('user_id', user.id);

                if (userGoals) {
                    userGoals.forEach((g: any) => {
                        if (customLogs[`goal_${g.slot}`] === true) {
                            recalculatedPoints += Math.max(0, g.goal_templates?.points || 0);
                        }
                    });
                }

                // Slipups
                if (todayLogFull.junk_food) recalculatedPoints -= 5;
                if (todayLogFull.processed_sugar) recalculatedPoints -= 5;
                if (todayLogFull.alcohol_excess) recalculatedPoints -= 5;

                setTodayPoints(recalculatedPoints);
                setTodayCompletion(Math.round((recalculatedPoints / MAX_DAILY_POINTS) * 100));

                // Auto-fix stored value if wrong
                if (recalculatedPoints !== (todayLogFull.daily_points || 0)) {
                    await supabase
                        .from('daily_logs')
                        .update({ daily_points: recalculatedPoints })
                        .eq('user_id', user.id)
                        .eq('date', todayStr);
                }
            }

            // Fetch last biometric entry for progress prompts
            const { data: lastBiometric } = await supabase
                .from('biometric_logs')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (lastBiometric) {
                setLastBiometricDate(lastBiometric.created_at);
            }

            setLoading(false);
        };
        fetchData();
    }, [router]);

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </div>
                    <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="premium-card h-32 rounded-[2rem]" />
                    <div className="premium-card h-32 rounded-[2rem]" />
                </div>
            </div>
        );
    }

    const weekLabels = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return formatShortWeekday(d);
    });

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-zinc-400 dark:text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Overview</h2>
                    <h1 className="text-3xl lg:text-4xl font-black italic text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                        Keep going, <br /><span className="text-[#FF5E00]">{firstName}</span>.
                    </h1>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <DateDisplay />
                    {streak > 0 && <StreakBadge streak={streak} size="sm" />}
                </div>
            </div>

            {/* Phase Banner */}
            <PhaseBanner currentDay={currentDay} />

            {/* Progress Prompt (shows every 14 days) */}
            {showProgressPrompt && (
                <ProgressPrompt
                    currentDay={currentDay}
                    lastBiometricDate={lastBiometricDate}
                    onDismiss={() => setShowProgressPrompt(false)}
                    onLogProgress={() => router.push('/dashboard/progress')}
                />
            )}

            {/* Today's Progress Ring + Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Progress Ring */}
                <div className="premium-card rounded-[2rem] p-6 flex flex-col items-center justify-center">
                    <ProgressRing
                        progress={todayCompletion}
                        size={80}
                        strokeWidth={8}
                        color="var(--primary)"
                        bgColor="var(--border-light)"
                    >
                        <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{todayCompletion}%</span>
                    </ProgressRing>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-2">Today</span>
                </div>

                {/* Day of Program */}
                <div className="premium-card rounded-[2rem] p-6 flex flex-col items-center justify-center text-center">
                    <AnimatedNumber
                        value={currentDay}
                        className="text-4xl font-black italic text-zinc-900 dark:text-zinc-100 tracking-tighter mb-1"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FF5E00]">Day</span>
                </div>

                {/* Total Points */}
                <div className="premium-card rounded-[2rem] p-6 flex flex-col items-center justify-center text-center">
                    <AnimatedNumber
                        value={totalPoints}
                        className="text-4xl font-black italic text-zinc-900 dark:text-zinc-100 tracking-tighter mb-1"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FF5E00]">Points</span>
                </div>
            </div>

            {/* Today's WOD Preview */}
            <WODPreview />

            {/* Weekly Status */}
            <div className="premium-card p-6 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                        <Activity className="h-5 w-5 text-[#FF5E00]" />
                    </div>
                    <h3 className="text-lg font-black italic text-zinc-900 dark:text-zinc-100 uppercase">Last 7 Days</h3>
                </div>

                <div className="flex justify-between items-center">
                    {weekLabels.map((day, i) => {
                        const isLogged = weeklyStatus[i];
                        const isToday = i === 6;

                        return (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <div className={cn(
                                    "h-11 w-11 rounded-full flex items-center justify-center border-2 transition-all",
                                    isLogged
                                        ? "bg-[#FF5E00] border-[#FF5E00] text-white"
                                        : isToday
                                            ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 animate-pulse"
                                            : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-300 dark:text-red-400"
                                )}>
                                    {isLogged ? <Check className="h-5 w-5" /> :
                                        isToday ? <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" /> :
                                            <span className="text-xs font-black">X</span>}
                                </div>
                                <span className="text-[11px] font-bold text-zinc-300 dark:text-zinc-600 uppercase">{day}</span>
                            </div>
                        );
                    })}
                </div>

                <p className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-6">
                    {streak > 0
                        ? <span>You're on a <span className="text-[#FF5E00] font-black">{streak}-day</span> streak! Keep it up 🔥</span>
                        : "Start your streak today."}
                </p>
            </div>

            {/* Quick Actions CTA */}
            <div
                className="bg-gradient-to-br from-[#FF5E00] to-orange-600 p-8 rounded-[2.5rem] shadow-xl shadow-orange-500/30 text-center relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer press-effect"
                onClick={() => router.push('/dashboard/check-in')}
            >
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
