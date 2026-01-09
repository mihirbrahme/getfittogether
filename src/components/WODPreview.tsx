'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, Clock, ChevronRight, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';

interface WODPreviewProps {
    className?: string;
}

interface WorkoutPreview {
    id: string;
    name: string;
    type: 'weekday' | 'weekend' | 'event';
    exerciseCount: number;
    estimatedDuration: number; // in minutes
}

export default function WODPreview({ className }: WODPreviewProps) {
    const [workout, setWorkout] = useState<WorkoutPreview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodayWOD();
    }, []);

    const fetchTodayWOD = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user's group
            const { data: groupMember } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id)
                .eq('status', 'approved')
                .single();

            if (!groupMember) {
                setLoading(false);
                return;
            }

            const today = formatDate(new Date(), 'iso');

            // Find today's workout for user's squad
            const { data: scheduledWorkouts } = await supabase
                .from('scheduled_workout_squads')
                .select(`
                    workout_id,
                    scheduled_workouts (
                        id,
                        date,
                        workout_templates (
                            id,
                            name,
                            type
                        )
                    )
                `)
                .eq('group_id', groupMember.group_id);

            if (!scheduledWorkouts) {
                setLoading(false);
                return;
            }

            // Find today's workout
            const todayWorkout = scheduledWorkouts.find((sw: any) =>
                sw.scheduled_workouts?.date === today
            ) as any;

            if (todayWorkout?.scheduled_workouts?.workout_templates) {
                const template = todayWorkout.scheduled_workouts.workout_templates;

                // Get exercise count
                const { count } = await supabase
                    .from('workout_exercises')
                    .select('*', { count: 'exact', head: true })
                    .eq('template_id', template.id);

                // Estimate duration (rough: 3 min per exercise)
                const estimatedDuration = (count || 0) * 3 + 5; // +5 for rest between sets

                setWorkout({
                    id: template.id,
                    name: template.name,
                    type: template.type,
                    exerciseCount: count || 0,
                    estimatedDuration,
                });
            }
        } catch (error) {
            console.error('Error fetching WOD preview:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={cn('premium-card rounded-[2rem] p-6 animate-pulse', className)}>
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                        <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!workout) {
        return (
            <div className={cn('premium-card rounded-[2rem] p-6', className)}>
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No WOD Today</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Enjoy your rest day!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link href="/dashboard/wod" className={cn('block group', className)}>
            <div className="premium-card rounded-[2rem] p-6 hover:scale-[1.02] transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#FF5E00] to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                        <Dumbbell className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5E00]">
                                Today's WOD
                            </span>
                            <span className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                                workout.type === 'event'
                                    ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                            )}>
                                {workout.type}
                            </span>
                        </div>
                        <h3 className="font-black italic uppercase text-zinc-900 dark:text-zinc-100 text-lg truncate">
                            {workout.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                                <Dumbbell className="h-3 w-3" />
                                {workout.exerciseCount} exercises
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ~{workout.estimatedDuration} min
                            </span>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-300 dark:text-zinc-600 group-hover:text-[#FF5E00] group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    );
}
