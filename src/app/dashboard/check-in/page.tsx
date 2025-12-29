'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Check, X, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/auth?mode=login');

            // 1. Get user's squad
            const { data: membership } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id)
                .eq('status', 'approved')
                .single();

            if (!membership) {
                setLoading(false);
                return;
            }

            // 2. Fetch squad's check-in activities
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

            // 3. Fetch admin-assigned goals for this user
            const { data: userGoals } = await supabase
                .from('user_goal_assignments')
                .select(`
                    slot,
                    goal_templates (
                        id,
                        name,
                        description,
                        points
                    )
                `)
                .eq('user_id', user.id)
                .order('slot');

            if (userGoals) {
                setAssignedGoals(userGoals as any);
                userGoals.forEach((g: any) => {
                    setResponses(prev => ({ ...prev, [`goal_${g.slot}`]: null }));
                });
            }

            // 4. Check if already logged today
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: existingLog } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (existingLog) {
                setAlreadySubmitted(true);
                // Parse custom_logs to show previous responses
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

        const today = format(new Date(), 'yyyy-MM-dd');

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
            // Update user's total points
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_points')
                .eq('id', user.id)
                .single();

            await supabase
                .from('profiles')
                .update({ total_points: (profile?.total_points || 0) + totalPoints })
                .eq('id', user.id);

            alert(`Check-in complete! You earned ${totalPoints} points today.`);
            setAlreadySubmitted(true);
        } else {
            alert('Error submitting check-in: ' + error.message);
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
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">
                    Daily <span className="text-[#FF5E00]">Check-In</span>
                </h1>
                <p className="text-zinc-500 font-medium text-sm mt-1">
                    {alreadySubmitted
                        ? 'Done for today! Come back tomorrow.'
                        : 'Track your daily progress'
                    }
                </p>
            </div>

            {/* Activities Section */}
            {activities.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-black italic uppercase text-zinc-700 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-[#FF5E00]" />
                        Daily Tasks
                    </h2>
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-black text-lg text-zinc-900">
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
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all",
                                        responses[`activity_${activity.id}`] === true
                                            ? "bg-emerald-500 text-white"
                                            : "bg-zinc-50 text-zinc-400 border border-zinc-200",
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
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all",
                                        responses[`activity_${activity.id}`] === false
                                            ? "bg-red-500 text-white"
                                            : "bg-zinc-50 text-zinc-400 border border-zinc-200",
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
                <div className="space-y-4">
                    <h2 className="text-xl font-black italic uppercase text-zinc-700 flex items-center gap-2">
                        <Target className="h-6 w-6 text-[#FF5E00]" />
                        Your Goals
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium -mt-2">
                        Set by admin
                    </p>
                    {assignedGoals.map((goal) => (
                        <div
                            key={goal.slot}
                            className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-black text-lg text-zinc-900">
                                        {goal.goal_templates.name}
                                    </h3>
                                    {goal.goal_templates.description && (
                                        <p className="text-sm text-zinc-500 mt-1">
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
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all",
                                        responses[`goal_${goal.slot}`] === true
                                            ? "bg-emerald-500 text-white"
                                            : "bg-zinc-50 text-zinc-400 border border-zinc-200",
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
                                        "flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all",
                                        responses[`goal_${goal.slot}`] === false
                                            ? "bg-red-500 text-white"
                                            : "bg-zinc-50 text-zinc-400 border border-zinc-200",
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

