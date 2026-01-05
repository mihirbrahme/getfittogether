'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Check, X, Target, Activity, Sparkles, AlertTriangle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getToday, formatDate, parseLocalDate } from '@/lib/dateUtils';
import DateDisplay from '@/components/DateDisplay';
import { logCheckIn } from '@/lib/auditLog';
import Confetti from '@/components/Confetti';
import AnimatedNumber from '@/components/AnimatedNumber';

interface CheckInActivity {
    id: string;
    activity_name: string;
    activity_type: string;
    points: number;
    icon: string;
    enabled: boolean;
    display_order: number;
}

interface AdminAssignedGoal {
    slot: number;
    goal_templates: {
        id: string;
        name: string;
        description: string;
        points: number;
    };
}

export default function CheckInPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activities, setActivities] = useState<CheckInActivity[]>([]);
    const [assignedGoals, setAssignedGoals] = useState<AdminAssignedGoal[]>([]);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    // Activity responses: key -> boolean | null
    const [responses, setResponses] = useState<Record<string, boolean | null>>({});

    // Celebration state
    const [showConfetti, setShowConfetti] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState(0);

    // Negative points (slip-ups) state
    const [slipups, setSlipups] = useState({
        junk_food: false,
        processed_sugar: false,
        alcohol_excess: false
    });
    const [showSlipups, setShowSlipups] = useState(false);

    // Date selection for backdated check-ins (today, yesterday, 2 days ago)
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [availableDates, setAvailableDates] = useState<{ date: string; label: string; dayName: string }[]>([]);

    // Initialize available dates (today, yesterday, 2 days ago)
    useEffect(() => {
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 3; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = formatDate(date, 'iso');
            const dayName = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' });
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dates.push({ date: dateStr, label, dayName });
        }
        setAvailableDates(dates);
    }, []);

    // Fetch data when selectedDate changes
    const fetchDataForDate = useCallback(async (dateToFetch: string) => {
        setLoading(true);
        setAlreadySubmitted(false);
        setResponses({});
        setSlipups({ junk_food: false, processed_sugar: false, alcohol_excess: false });
        setShowSlipups(false);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/auth?mode=login');

        // OPTIMIZED: Single RPC call replaces 5 separate queries
        const { data: context, error } = await supabase.rpc('get_checkin_context', {
            p_date: dateToFetch
        });

        if (error || !context) {
            // Fallback: RPC not yet created, use legacy queries
            await fetchDataLegacy(user.id, dateToFetch);
            return;
        }

        // Set activities from RPC response
        const fetchedActivities = context.activities || [];
        setActivities(fetchedActivities);

        // Set goals from RPC response
        const fetchedGoals = (context.goals || []).map((g: any) => ({
            slot: g.slot,
            goal_templates: g.goal_templates
        }));
        setAssignedGoals(fetchedGoals);

        // Initialize responses
        const initialResponses: Record<string, boolean | null> = {};
        fetchedActivities.forEach((a: any) => initialResponses[`activity_${a.id}`] = null);
        fetchedGoals.forEach((g: any) => initialResponses[`goal_${g.slot}`] = null);
        setResponses(initialResponses);

        // Check if already submitted for this date
        if (context.already_submitted) {
            setAlreadySubmitted(true);
            // Fetch existing responses for display
            const { data: existingLog } = await supabase
                .from('daily_logs')
                .select('custom_logs, junk_food, processed_sugar, alcohol_excess')
                .eq('user_id', user.id)
                .eq('date', dateToFetch)
                .single();
            if (existingLog?.custom_logs) {
                setResponses(existingLog.custom_logs as Record<string, boolean | null>);
                setSlipups({
                    junk_food: existingLog.junk_food || false,
                    processed_sugar: existingLog.processed_sugar || false,
                    alcohol_excess: existingLog.alcohol_excess || false
                });
            }
        }

        setLoading(false);
    }, [router]);

    // Legacy fallback for when RPC doesn't exist yet
    const fetchDataLegacy = async (userId: string, today: string) => {
        const { data: membership } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .single();

        if (!membership) {
            setLoading(false);
            return;
        }

        const { data: squadActivities } = await supabase
            .from('squad_checkin_activities')
            .select('*')
            .eq('squad_id', membership.group_id)
            .eq('enabled', true)
            .order('display_order');

        if (squadActivities) {
            setActivities(squadActivities);
            const initialResponses: Record<string, boolean | null> = {};
            squadActivities.forEach(a => initialResponses[`activity_${a.id}`] = null);
            setResponses(initialResponses);
        }

        const { data: userGoals } = await supabase
            .from('user_goal_assignments')
            .select(`slot, goal_templates (id, name, description, points)`)
            .eq('user_id', userId)
            .order('slot');

        if (userGoals) {
            setAssignedGoals(userGoals as any);
            userGoals.forEach((g: any) => {
                setResponses(prev => ({ ...prev, [`goal_${g.slot}`]: null }));
            });
        }

        const { data: existingLog } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

        if (existingLog) {
            setAlreadySubmitted(true);
            if (existingLog.custom_logs) {
                setResponses(existingLog.custom_logs as Record<string, boolean | null>);
            }
        }

        setLoading(false);
    };

    // Effect to fetch data when selectedDate changes
    useEffect(() => {
        if (selectedDate) {
            fetchDataForDate(selectedDate);
        }
    }, [selectedDate, fetchDataForDate]);

    const handleToggle = (key: string, value: boolean) => {
        setResponses(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async () => {
        // Prevent duplicate submissions
        if (submitting) return;

        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Not authenticated');
            }

            // Use selectedDate for backdated check-ins

            // Calculate total points with validation
            let totalPoints = 0;

            // Points from activities (with validation)
            activities.forEach(activity => {
                if (responses[`activity_${activity.id}`] === true) {
                    // Use actual configured points
                    const points = Math.max(0, activity.points || 0);
                    totalPoints += points;
                }
            });

            // Points from goals (with validation)
            assignedGoals.forEach(goal => {
                if (responses[`goal_${goal.slot}`] === true) {
                    // Use actual configured points
                    const points = Math.max(0, goal.goal_templates.points || 0);
                    totalPoints += points;
                }
            });

            // Calculate negative points with bounds checking (max -15 for 3 slip-ups)
            let negativePoints = 0;
            if (slipups.junk_food) negativePoints -= 5;
            if (slipups.processed_sugar) negativePoints -= 5;
            if (slipups.alcohol_excess) negativePoints -= 5;

            // Ensure negative points are within valid range
            negativePoints = Math.max(-15, Math.min(0, negativePoints));
            totalPoints += negativePoints;

            // Insert/update daily log with validation
            const { error } = await supabase
                .from('daily_logs')
                .upsert({
                    user_id: user.id,
                    date: selectedDate,
                    daily_points: totalPoints,
                    custom_logs: responses,
                    junk_food: Boolean(slipups.junk_food),
                    processed_sugar: Boolean(slipups.processed_sugar),
                    alcohol_excess: Boolean(slipups.alcohol_excess),
                    negative_points: negativePoints
                });

            if (error) {
                throw new Error(`Failed to submit check-in: ${error.message}`);
            }

            // NOTE: total_points is now auto-calculated by database trigger
            // No need for manual recalculation - prevents race conditions

            // Log audit event
            try {
                await logCheckIn(user.id, selectedDate, totalPoints);
            } catch (auditError) {
                // Non-blocking - audit log failure shouldn't stop submission
                console.warn('Audit log failed:', auditError);
            }

            // Trigger celebration!
            setEarnedPoints(totalPoints);
            setShowConfetti(true);
            setAlreadySubmitted(true);

        } catch (error: any) {
            console.error('Check-in submission error:', error);
            alert(`Failed to submit check-in: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const allAnswered = () => {
        const allKeys = [
            ...activities.map(a => `activity_${a.id}`),
            ...assignedGoals.map(g => `goal_${g.slot}`)
        ];
        return allKeys.every(key => responses[key] !== null);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {/* Confetti Celebration */}
            <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Success Message */}
            {showConfetti && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="premium-card p-8 rounded-[2rem] text-center max-w-sm mx-4 animate-scale-in-bounce">
                        <div className="h-20 w-20 bg-gradient-to-br from-[#FF5E00] to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/30">
                            <Sparkles className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black italic text-zinc-900 dark:text-zinc-100 uppercase mb-2">Amazing!</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-4">You earned</p>
                        <div className="text-5xl font-black text-[#FF5E00] mb-2">
                            <AnimatedNumber value={earnedPoints} duration={1500} />
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">points today</p>
                        <button
                            onClick={() => setShowConfetti(false)}
                            className="mt-6 bg-[#FF5E00] text-white font-black py-3 px-8 rounded-xl text-sm uppercase press-effect"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase text-zinc-900 dark:text-zinc-100 tracking-tighter">
                        Daily <span className="text-[#FF5E00]">Check-In</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mt-1">
                        {alreadySubmitted
                            ? `Already checked in for ${availableDates.find(d => d.date === selectedDate)?.label || selectedDate}!`
                            : 'Track your daily progress'
                        }
                    </p>
                </div>
                <DateDisplay />
            </div>

            {/* Date Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {availableDates.map((dateOption) => {
                    const isSelected = selectedDate === dateOption.date;
                    return (
                        <button
                            key={dateOption.date}
                            onClick={() => setSelectedDate(dateOption.date)}
                            className={cn(
                                "flex-shrink-0 px-4 py-3 rounded-xl font-bold text-sm transition-all press-effect border-2",
                                isSelected
                                    ? "bg-[#FF5E00] text-white border-[#FF5E00] shadow-lg shadow-orange-500/30"
                                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                            )}
                        >
                            <div className="text-center">
                                <div className={cn(
                                    "text-xs uppercase font-black",
                                    isSelected ? "text-white/80" : "text-zinc-400 dark:text-zinc-500"
                                )}>
                                    {dateOption.dayName}
                                </div>
                                <div className="mt-0.5">
                                    {dateOption.label}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            {/* Activities Section */}
            {activities.length > 0 && (
                <div className="space-y-4 animate-stagger">
                    <h2 className="text-xl font-black italic uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-[#FF5E00]" />
                        Daily Tasks
                    </h2>
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="premium-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100">
                                        {activity.activity_name}
                                    </h3>
                                    <p className="text-sm text-[#FF5E00] font-bold">
                                        {activity.points} points
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleToggle(`activity_${activity.id}`, true)}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all press-effect",
                                        responses[`activity_${activity.id}`] === true
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                    )}
                                >
                                    <Check className="h-5 w-5 mx-auto" />
                                    <span className="block mt-1 text-[10px]">Yes</span>
                                </button>
                                <button
                                    onClick={() => handleToggle(`activity_${activity.id}`, false)}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all press-effect",
                                        responses[`activity_${activity.id}`] === false
                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                    )}
                                >
                                    <X className="h-5 w-5 mx-auto" />
                                    <span className="block mt-1 text-[10px]">No</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Goals Section */}
            {assignedGoals.length > 0 && (
                <div className="space-y-4 animate-stagger">
                    <h2 className="text-xl font-black italic uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Target className="h-6 w-6 text-[#FF5E00]" />
                        Your Goals
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium -mt-2">
                        Set by admin
                    </p>
                    {assignedGoals.map((goal) => (
                        <div
                            key={goal.slot}
                            className="premium-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100">
                                        {goal.goal_templates.name}
                                    </h3>
                                    {goal.goal_templates.description && (
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                            {goal.goal_templates.description}
                                        </p>
                                    )}
                                    <p className="text-sm text-[#FF5E00] font-bold mt-1">
                                        {goal.goal_templates.points} points
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleToggle(`goal_${goal.slot}`, true)}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all press-effect",
                                        responses[`goal_${goal.slot}`] === true
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                    )}
                                >
                                    <Check className="h-5 w-5 mx-auto" />
                                    <span className="block mt-1 text-[10px]">Yes</span>
                                </button>
                                <button
                                    onClick={() => handleToggle(`goal_${goal.slot}`, false)}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all press-effect",
                                        responses[`goal_${goal.slot}`] === false
                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                    )}
                                >
                                    <X className="h-5 w-5 mx-auto" />
                                    <span className="block mt-1 text-[10px]">No</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Slip-ups Section (Negative Points) */}
            <div className="space-y-4 animate-stagger">
                <button
                    onClick={() => setShowSlipups(!showSlipups)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <span className="font-black text-sm uppercase text-amber-700 dark:text-amber-300">
                            Log Slip-ups (Optional)
                        </span>
                        {(slipups.junk_food || slipups.processed_sugar || slipups.alcohol_excess) && (
                            <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                                {[slipups.junk_food, slipups.processed_sugar, slipups.alcohol_excess].filter(Boolean).length} logged
                            </span>
                        )}
                    </div>
                    {showSlipups ? (
                        <ChevronUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                </button>

                {showSlipups && (
                    <div className="space-y-3 animate-fade-in">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium px-2">
                            Be honest! Logging slip-ups helps you stay accountable. Each checked item = −5 points.
                        </p>

                        {/* Junk Food */}
                        <button
                            onClick={() => setSlipups(prev => ({ ...prev, junk_food: !prev.junk_food }))}
                            className={cn(
                                "w-full flex items-center justify-between p-5 rounded-2xl border transition-all",
                                slipups.junk_food
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                    slipups.junk_food
                                        ? "bg-red-500 text-white"
                                        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-400"
                                )}>
                                    {slipups.junk_food ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-zinc-900 dark:text-zinc-100">Junk/Fried Food</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Deep-fried, fast food, heavily oily snacks</p>
                                </div>
                            </div>
                            <span className={cn(
                                "font-black text-lg",
                                slipups.junk_food ? "text-red-500" : "text-zinc-300 dark:text-zinc-600"
                            )}>−5</span>
                        </button>

                        {/* Processed Sugar */}
                        <button
                            onClick={() => setSlipups(prev => ({ ...prev, processed_sugar: !prev.processed_sugar }))}
                            className={cn(
                                "w-full flex items-center justify-between p-5 rounded-2xl border transition-all",
                                slipups.processed_sugar
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                    slipups.processed_sugar
                                        ? "bg-red-500 text-white"
                                        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-400"
                                )}>
                                    {slipups.processed_sugar ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-zinc-900 dark:text-zinc-100">Processed Sugar</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Sweets, desserts, sugary drinks, packaged snacks</p>
                                </div>
                            </div>
                            <span className={cn(
                                "font-black text-lg",
                                slipups.processed_sugar ? "text-red-500" : "text-zinc-300 dark:text-zinc-600"
                            )}>−5</span>
                        </button>

                        {/* Alcohol Excess */}
                        <button
                            onClick={() => setSlipups(prev => ({ ...prev, alcohol_excess: !prev.alcohol_excess }))}
                            className={cn(
                                "w-full flex items-center justify-between p-5 rounded-2xl border transition-all",
                                slipups.alcohol_excess
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                    slipups.alcohol_excess
                                        ? "bg-red-500 text-white"
                                        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-400"
                                )}>
                                    {slipups.alcohol_excess ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-zinc-900 dark:text-zinc-100">Alcohol Excess</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">More than 2 drinks in one session</p>
                                </div>
                            </div>
                            <span className={cn(
                                "font-black text-lg",
                                slipups.alcohol_excess ? "text-red-500" : "text-zinc-300 dark:text-zinc-600"
                            )}>−5</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="space-y-2">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !allAnswered()}
                    className="w-full bg-[#FF5E00] text-white font-black py-4 rounded-xl text-sm uppercase hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        alreadySubmitted ? 'Update Check-in' : 'Submit Check-in'
                    )}
                </button>

                {!allAnswered() && (
                    <p className="text-center text-sm text-zinc-400 font-medium">
                        Answer all items to submit
                    </p>
                )}
            </div>

            {/* Empty State */}
            {activities.length === 0 && assignedGoals.length === 0 && (
                <div className="text-center py-12 bg-zinc-50 rounded-2xl">
                    <Activity className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                    <h3 className="font-black text-zinc-900 mb-1">No Tasks Yet</h3>
                    <p className="text-sm text-zinc-500">
                        Your admin will set up activities soon
                    </p>
                </div>
            )}
        </div>
    );
}

