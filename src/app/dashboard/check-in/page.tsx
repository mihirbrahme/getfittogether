'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Check, X, Target, Activity, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getToday, formatDate } from '@/lib/dateUtils';
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

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/auth?mode=login');

            const today = getToday();

            // OPTIMIZED: Single RPC call replaces 5 separate queries
            const { data: context, error } = await supabase.rpc('get_checkin_context', {
                p_date: today
            });

            if (error || !context) {
                // Fallback: RPC not yet created, use legacy queries
                await fetchDataLegacy(user.id, today);
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

            // Check if already submitted
            if (context.already_submitted) {
                setAlreadySubmitted(true);
                // Fetch existing responses for display
                const { data: existingLog } = await supabase
                    .from('daily_logs')
                    .select('custom_logs')
                    .eq('user_id', user.id)
                    .eq('date', today)
                    .single();
                if (existingLog?.custom_logs) {
                    setResponses(existingLog.custom_logs as Record<string, boolean | null>);
                }
            }

            setLoading(false);
        };

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

        fetchData();
    }, [router]);

    const handleToggle = (key: string, value: boolean) => {
        setResponses(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = getToday();

        // Calculate total points
        let totalPoints = 0;

        // Points from activities
        activities.forEach(activity => {
            if (responses[`activity_${activity.id}`] === true) {
                totalPoints += activity.points;
            }
        });

        // Points from goals
        assignedGoals.forEach(goal => {
            if (responses[`goal_${goal.slot}`] === true) {
                totalPoints += goal.goal_templates.points;
            }
        });

        // Insert/update daily log with custom_logs
        const { error } = await supabase
            .from('daily_logs')
            .upsert({
                user_id: user.id,
                date: today,
                daily_points: totalPoints,
                custom_logs: responses
            });

        if (!error) {
            // Recalculate total points as sum of all daily logs for this user
            const { data: allLogs } = await supabase
                .from('daily_logs')
                .select('daily_points')
                .eq('user_id', user.id);

            const calculatedTotal = allLogs?.reduce((sum, log) => sum + (log.daily_points || 0), 0) || 0;

            await supabase
                .from('profiles')
                .update({ total_points: calculatedTotal })
                .eq('id', user.id);

            // Log audit event
            await logCheckIn(user.id, today, totalPoints);

            // Trigger celebration!
            setEarnedPoints(totalPoints);
            setShowConfetti(true);
            setAlreadySubmitted(true);
        }

        setSubmitting(false);
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
                            ? `Already checked in for ${formatDate(new Date(), 'short')}!`
                            : 'Track your daily progress'
                        }
                    </p>
                </div>
                <DateDisplay />
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
                                    disabled={alreadySubmitted}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all press-effect",
                                        responses[`activity_${activity.id}`] === true
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700",
                                        alreadySubmitted && "cursor-not-allowed opacity-70"
                                    )}
                                >
                                    <Check className="h-5 w-5 mx-auto" />
                                    <span className="block mt-1 text-[10px]">Yes</span>
                                </button>
                                <button
                                    onClick={() => handleToggle(`activity_${activity.id}`, false)}
                                    disabled={alreadySubmitted}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all press-effect",
                                        responses[`activity_${activity.id}`] === false
                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700",
                                        alreadySubmitted && "cursor-not-allowed opacity-70"
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
                                    disabled={alreadySubmitted}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all press-effect",
                                        responses[`goal_${goal.slot}`] === true
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700",
                                        alreadySubmitted && "cursor-not-allowed opacity-70"
                                    )}
                                >
                                    <Check className="h-5 w-5 mx-auto" />
                                    <span className="block mt-1 text-[10px]">Yes</span>
                                </button>
                                <button
                                    onClick={() => handleToggle(`goal_${goal.slot}`, false)}
                                    disabled={alreadySubmitted}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all press-effect",
                                        responses[`goal_${goal.slot}`] === false
                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700",
                                        alreadySubmitted && "cursor-not-allowed opacity-70"
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

            {/* Submit Button */}
            {!alreadySubmitted && (
                <>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !allAnswered()}
                        className="w-full bg-[#FF5E00] text-white font-black py-4 rounded-xl text-sm uppercase hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            'Submit'
                        )}
                    </button>

                    {!allAnswered() && (
                        <p className="text-center text-sm text-zinc-400 font-medium">
                            Answer all items to submit
                        </p>
                    )}
                </>
            )}

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

