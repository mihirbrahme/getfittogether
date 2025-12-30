'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Dumbbell, Clock, Repeat, Timer, Package, Video, AlertCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import DateDisplay from '@/components/DateDisplay';
import YouTubeEmbed from '@/components/YouTubeEmbed';

interface Exercise {
    id: string;
    order_index: number;
    exercise_name: string;
    sets: number | null;
    reps: number | null;
    duration_seconds: number | null;
    rest_seconds: number;
    equipment: string;
    video_url: string;
    notes: string;
}

interface WorkoutTemplate {
    id: string;
    name: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
}

interface ScheduledWorkout {
    id: string;
    date: string;
    template: WorkoutTemplate;
    exercises: Exercise[];
}

export default function WODPage() {
    const [workout, setWorkout] = useState<ScheduledWorkout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAuthAndFetchWOD();
    }, []);

    const checkAuthAndFetchWOD = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            redirect('/');
            return;
        }

        // OPTIMIZED: Try RPC first (single query instead of 4)
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_wod_today');

        if (!rpcError && rpcData && rpcData.found) {
            // RPC succeeded - use optimized data
            setWorkout({
                id: rpcData.workout.id,
                date: rpcData.date,
                template: {
                    id: rpcData.workout.template_id,
                    name: rpcData.workout.name,
                    description: rpcData.workout.description,
                    type: rpcData.workout.type
                },
                exercises: rpcData.exercises || []
            });
            setLoading(false);
            return;
        }

        // FALLBACK: Legacy queries if RPC fails or returns null
        await fetchWODLegacy(session.user.id);
    };

    // Legacy fallback for backwards compatibility
    const fetchWODLegacy = async (userId: string) => {
        // Get user's group
        const { data: groupMember } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .single();

        if (!groupMember) {
            setError('You are not assigned to any squad yet.');
            setLoading(false);
            return;
        }

        // Get today's date
        const today = new Date().toISOString().split('T')[0];

        // Find scheduled workout for today assigned to user's squad
        const { data: scheduledWorkouts } = await supabase
            .from('scheduled_workout_squads')
            .select(`
                workout_id,
                scheduled_workouts (
                    id,
                    date,
                    template_id,
                    workout_templates (
                        id,
                        name,
                        description,
                        type
                    )
                )
            `)
            .eq('group_id', groupMember.group_id);

        if (!scheduledWorkouts || scheduledWorkouts.length === 0) {
            setError('No workout scheduled for today.');
            setLoading(false);
            return;
        }

        // Find today's workout from the results
        const todayWorkout = scheduledWorkouts.find((sw: any) =>
            sw.scheduled_workouts?.date === today
        );

        if (!todayWorkout || !todayWorkout.scheduled_workouts) {
            setError('No workout scheduled for today.');
            setLoading(false);
            return;
        }

        const swData: any = todayWorkout.scheduled_workouts;
        const templateData: any = swData.workout_templates;

        // Fetch exercises for the template
        const { data: exercises } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('template_id', templateData.id)
            .order('order_index');

        setWorkout({
            id: swData.id,
            date: swData.date,
            template: {
                id: templateData.id,
                name: templateData.name,
                description: templateData.description,
                type: templateData.type
            },
            exercises: exercises || []
        });

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-black uppercase text-zinc-400 tracking-widest">Loading Workout...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="premium-card rounded-[3rem] p-12 text-center">
                <AlertCircle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                <h2 className="text-2xl font-black italic uppercase text-zinc-900 mb-2">No Workout Today</h2>
                <p className="text-zinc-600">{error}</p>
                <p className="text-sm text-zinc-400 mt-4">Check back tomorrow or contact your admin.</p>
            </div>
        );
    }

    if (!workout) return null;

    return (
        <div className="space-y-6">
            {/* Date Display */}
            <div className="flex justify-end">
                <DateDisplay />
            </div>

            {/* Header */}
            <div className="premium-card rounded-[3rem] p-10 bg-gradient-to-br from-[#FF5E00] to-orange-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Calendar className="h-6 w-6" />
                        <span className="text-sm font-black uppercase tracking-wider">
                            {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-3">
                        {workout.template.name}
                    </h1>
                    {workout.template.description && (
                        <p className="text-orange-100 text-lg font-medium">
                            {workout.template.description}
                        </p>
                    )}
                    <div className="mt-4">
                        <span className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-sm font-black uppercase">
                            {workout.template.type} WOD
                        </span>
                    </div>
                </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-4">
                <h2 className="text-2xl font-black italic uppercase text-zinc-900 px-4">
                    Exercises ({workout.exercises.length})
                </h2>

                {workout.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="premium-card rounded-[2rem] p-6 hover:scale-[1.01] transition-all">
                        <div className="flex items-start gap-4">
                            {/* Exercise Number */}
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FF5E00] to-orange-600 text-white flex items-center justify-center font-black text-xl shrink-0">
                                {index + 1}
                            </div>

                            {/* Exercise Details */}
                            <div className="flex-1 space-y-3">
                                <h3 className="text-xl font-black uppercase text-zinc-900">
                                    {exercise.exercise_name}
                                </h3>

                                {/* Reps/Sets/Duration */}
                                <div className="flex flex-wrap gap-4">
                                    {exercise.sets && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Repeat className="h-4 w-4 text-[#FF5E00]" />
                                            <span className="font-black text-zinc-700">{exercise.sets}</span>
                                            <span className="text-zinc-500">sets</span>
                                        </div>
                                    )}
                                    {exercise.reps && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Dumbbell className="h-4 w-4 text-[#FF5E00]" />
                                            <span className="font-black text-zinc-700">{exercise.reps}</span>
                                            <span className="text-zinc-500">reps</span>
                                        </div>
                                    )}
                                    {exercise.duration_seconds && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Timer className="h-4 w-4 text-[#FF5E00]" />
                                            <span className="font-black text-zinc-700">{exercise.duration_seconds}s</span>
                                            <span className="text-zinc-500">duration</span>
                                        </div>
                                    )}
                                    {exercise.rest_seconds > 0 && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            <span className="font-black text-zinc-700">{exercise.rest_seconds}s</span>
                                            <span className="text-zinc-500">rest</span>
                                        </div>
                                    )}
                                    {exercise.equipment && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Package className="h-4 w-4 text-purple-500" />
                                            <span className="font-semibold text-zinc-600">{exercise.equipment}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                {exercise.notes && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <p className="text-sm text-amber-900 font-medium">
                                            💡 {exercise.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Video */}
                                {exercise.video_url && (
                                    <div className="mt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Video className="h-4 w-4 text-red-500" />
                                            <span className="text-xs font-black uppercase text-zinc-500">Video Guide</span>
                                        </div>
                                        <YouTubeEmbed url={exercise.video_url} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Footer */}
            <div className="premium-card rounded-[2rem] p-6 bg-gradient-to-r from-emerald-50 to-blue-50">
                <p className="text-center text-sm font-black uppercase text-zinc-600 tracking-wider">
                    💪 Complete all exercises to earn your daily points!
                </p>
            </div>
        </div>
    );
}
