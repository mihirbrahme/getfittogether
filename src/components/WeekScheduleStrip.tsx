'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfWeek, endOfWeek, eachDayOfInterval, addDays, formatDate, parseLocalDate } from '@/lib/dateUtils';

interface WeekWorkout {
    date: string;
    templateName: string | null;
    templateType: 'weekday' | 'weekend' | 'event' | null;
}

interface WeekScheduleStripProps {
    selectedDate: string;
    onSelectDate: (date: string) => void;
    userGroupId?: string;
}

export default function WeekScheduleStrip({ selectedDate, onSelectDate, userGroupId }: WeekScheduleStripProps) {
    const [weekStart, setWeekStart] = useState(() => {
        const today = new Date();
        return startOfWeek(today);
    });
    const [weekWorkouts, setWeekWorkouts] = useState<WeekWorkout[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeekWorkouts();
    }, [weekStart, userGroupId]);

    const fetchWeekWorkouts = async () => {
        setLoading(true);
        const weekEnd = endOfWeek(weekStart);
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const startStr = formatDate(weekStart, 'iso');
        const endStr = formatDate(weekEnd, 'iso');

        // Fetch scheduled workouts for the week
        let query = supabase
            .from('scheduled_workouts')
            .select(`
                id,
                date,
                workout_templates (name, type)
            `)
            .gte('date', startStr)
            .lte('date', endStr);

        const { data: workouts } = await query;

        // If user has a group, also filter by that group's assigned workouts
        let assignedDates: Set<string> = new Set();
        if (userGroupId) {
            const { data: squadWorkouts } = await supabase
                .from('scheduled_workout_squads')
                .select('workout_id, scheduled_workouts!inner(date)')
                .eq('group_id', userGroupId);

            if (squadWorkouts) {
                squadWorkouts.forEach((sw: any) => {
                    if (sw.scheduled_workouts?.date) {
                        assignedDates.add(sw.scheduled_workouts.date);
                    }
                });
            }
        }

        // Map each day to its workout
        const weekData: WeekWorkout[] = days.map(day => {
            const dateStr = formatDate(day, 'iso');
            const workout = workouts?.find((w: any) => w.date === dateStr);

            // If user has group, only show workouts assigned to their group
            const isAssigned = userGroupId ? assignedDates.has(dateStr) : true;

            if (workout && isAssigned) {
                const template = workout.workout_templates as any;
                return {
                    date: dateStr,
                    templateName: template?.name || null,
                    templateType: template?.type || null
                };
            }

            return {
                date: dateStr,
                templateName: null,
                templateType: null
            };
        });

        setWeekWorkouts(weekData);
        setLoading(false);
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const days = direction === 'prev' ? -7 : 7;
        setWeekStart(addDays(weekStart, days));
    };

    const today = formatDate(new Date(), 'iso');
    const selectedParsed = parseLocalDate(selectedDate);

    // Get week label
    const weekEndDate = endOfWeek(weekStart);
    const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    return (
        <div className="premium-card rounded-[2rem] p-4 md:p-6">
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigateWeek('prev')}
                    className="h-10 w-10 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all flex items-center justify-center"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                    <p className="text-xs font-black uppercase text-zinc-400 tracking-widest">Week Schedule</p>
                    <p className="text-sm font-bold text-zinc-700">{weekLabel}</p>
                </div>
                <button
                    onClick={() => navigateWeek('next')}
                    className="h-10 w-10 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all flex items-center justify-center"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Days strip */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
                {weekWorkouts.map((day) => {
                    const isToday = day.date === today;
                    const isSelected = day.date === selectedDate;
                    const hasWorkout = !!day.templateName;
                    const dayDate = parseLocalDate(day.date);

                    return (
                        <button
                            key={day.date}
                            onClick={() => hasWorkout && onSelectDate(day.date)}
                            disabled={!hasWorkout}
                            className={cn(
                                "flex flex-col items-center p-2 md:p-3 rounded-xl transition-all border-2",
                                isSelected && hasWorkout && "border-[#FF5E00] bg-orange-50 scale-105",
                                isToday && !isSelected && "border-blue-300 bg-blue-50",
                                !isSelected && !isToday && hasWorkout && "border-zinc-100 bg-zinc-50 hover:border-zinc-200 hover:bg-zinc-100",
                                !hasWorkout && "border-transparent bg-zinc-50/50 opacity-50 cursor-not-allowed",
                                hasWorkout && "cursor-pointer"
                            )}
                        >
                            {/* Day name */}
                            <span className={cn(
                                "text-[10px] font-black uppercase",
                                isSelected ? "text-[#FF5E00]" : isToday ? "text-blue-600" : "text-zinc-400"
                            )}>
                                {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>

                            {/* Date number */}
                            <span className={cn(
                                "text-lg md:text-xl font-black",
                                isSelected ? "text-[#FF5E00]" : isToday ? "text-blue-600" : hasWorkout ? "text-zinc-900" : "text-zinc-300"
                            )}>
                                {dayDate.getDate()}
                            </span>

                            {/* Workout indicator */}
                            {hasWorkout ? (
                                <div className="mt-1 w-full">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full mx-auto mb-1",
                                        day.templateType === 'weekday' && "bg-zinc-900",
                                        day.templateType === 'weekend' && "bg-emerald-500",
                                        day.templateType === 'event' && "bg-purple-500"
                                    )} />
                                    <p className={cn(
                                        "text-[8px] md:text-[10px] font-bold text-center line-clamp-1",
                                        isSelected ? "text-[#FF5E00]" : "text-zinc-500"
                                    )}>
                                        {day.templateName}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-1">
                                    <p className="text-[8px] md:text-[10px] font-bold text-zinc-300 text-center">
                                        Rest
                                    </p>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="hidden md:flex items-center justify-center gap-4 mt-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-zinc-900" />
                    <span className="text-[10px] font-bold text-zinc-500">Weekday</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-zinc-500">Weekend</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-[10px] font-bold text-zinc-500">Event</span>
                </div>
            </div>
        </div>
    );
}
