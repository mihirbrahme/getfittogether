'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Edit2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns';
import CalendarAssignModal from './CalendarAssignModal';

interface WOD {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
    group_id: string | null;
    video_url?: string;
}

interface Event {
    id: string;
    date: string;
    title: string;
    bonus_points: number;
}

interface ScheduledWorkout {
    id: string;
    date: string;
    template_id: string;
    template_name: string;
    template_type: 'weekday' | 'weekend' | 'event';
}

export default function WODCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        // Fetch scheduled workouts with template info
        const { data: scheduledData } = await supabase
            .from('scheduled_workouts')
            .select(`
                id,
                date,
                template_id,
                workout_templates (name, type)
            `)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date');

        if (scheduledData) {
            const workouts = scheduledData.map(sw => ({
                id: sw.id,
                date: sw.date,
                template_id: sw.template_id,
                template_name: (sw.workout_templates as any)?.name || 'Unnamed Workout',
                template_type: (sw.workout_templates as any)?.type || 'weekday'
            }));
            setScheduledWorkouts(workouts);
        }

        const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date');

        setEvents(eventsData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [currentMonth]);

    // Generate calendar days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const getWorkoutForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return scheduledWorkouts.find(w => w.date === dateStr);
    };

    const getEventForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return events.find(e => e.date === dateStr);
    };

    if (loading) {
        return (
            <div className="premium-card rounded-[3.5rem] p-12 flex items-center justify-center min-h-[600px]">
                <Loader2 className="h-12 w-12 text-[#FF5E00] animate-spin" />
            </div>
        );
    }

    return (
        <section className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-blue-500/10 transition-colors duration-1000" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <CalendarIcon className="h-7 w-7 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                            WOD <span className="text-blue-500">CALENDAR</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Mission Timeline Visualization</p>
                    </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={prevMonth}
                        className="h-12 w-12 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all flex items-center justify-center border border-zinc-100"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-6 py-3 rounded-xl bg-white border border-zinc-100 text-zinc-900 font-black uppercase text-xs hover:bg-zinc-50 transition-all shadow-sm"
                    >
                        TODAY
                    </button>
                    <button
                        onClick={nextMonth}
                        className="h-12 w-12 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all flex items-center justify-center border border-zinc-100"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Current Month Display */}
            <div className="text-center mb-8">
                <h3 className="text-5xl font-black italic text-zinc-900 font-heading uppercase tracking-tighter">
                    {format(currentMonth, 'MMMM')} <span className="text-blue-500">{format(currentMonth, 'yyyy')}</span>
                </h3>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <div key={day} className="text-center py-3">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{day}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                        const workout = getWorkoutForDate(day);
                        const event = getEventForDate(day);
                        const inCurrentMonth = isSameMonth(day, currentMonth);
                        const today = isToday(day);

                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (workout) {
                                        // Handle view/edit existing workout
                                    } else if (inCurrentMonth) {
                                        setSelectedDate(format(day, 'yyyy-MM-dd'));
                                        setShowAssignModal(true);
                                    }
                                }}
                                className={cn(
                                    "aspect-square p-2 rounded-2xl border-2 transition-all relative group/day",
                                    !inCurrentMonth && "opacity-30",
                                    today && "ring-2 ring-[#FF5E00] ring-offset-2",
                                    workout && "bg-gradient-to-br hover:scale-105 cursor-pointer shadow-md",
                                    !workout && !event && inCurrentMonth && "hover:bg-zinc-100 cursor-pointer",
                                    workout?.template_type === 'weekday' && "from-zinc-900 to-zinc-700 border-zinc-800 text-white",
                                    workout?.template_type === 'weekend' && "from-emerald-500 to-emerald-600 border-emerald-400 text-white",
                                    workout?.template_type === 'event' && "from-purple-500 to-purple-600 border-purple-400 text-white",
                                    event && !workout && "bg-orange-50 border-orange-200",
                                    !workout && !event && "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
                                )}
                            >
                                <div className="flex flex-col items-start h-full">
                                    {/* Date Number */}
                                    <span className={cn(
                                        "text-sm font-black mb-1",
                                        workout ? "text-white" : event ? "text-orange-600" : "text-zinc-600"
                                    )}>
                                        {format(day, 'd')}
                                    </span>

                                    {/* Workout Indicator */}
                                    {workout && (
                                        <div className="flex-1 flex flex-col justify-center items-center w-full">
                                            <div className="h-2 w-2 rounded-full bg-white mb-1 animate-pulse" />
                                            <span className="text-[8px] font-black uppercase text-white/90 text-center line-clamp-2 leading-tight">
                                                {workout.template_name}
                                            </span>
                                        </div>
                                    )}

                                    {/* Event Indicator */}
                                    {event && !workout && (
                                        <div className="flex-1 flex items-center justify-center w-full">
                                            <span className="text-[8px] font-black uppercase text-orange-600 text-center">
                                                EVENT
                                            </span>
                                        </div>
                                    )}

                                    {/* Empty Day Hover State */}
                                    {!workout && !event && inCurrentMonth && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/day:opacity-100 transition-opacity">
                                            <Plus className="h-5 w-5 text-zinc-400" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-8 pt-8 border-t border-zinc-100 flex flex-wrap gap-6 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-gradient-to-br from-zinc-900 to-zinc-700" />
                        <span className="text-xs font-black uppercase text-zinc-500">Weekday WOD</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-gradient-to-br from-emerald-500 to-emerald-600" />
                        <span className="text-xs font-black uppercase text-zinc-500">Weekend WOD</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-gradient-to-br from-purple-500 to-purple-600" />
                        <span className="text-xs font-black uppercase text-zinc-500">Special Event</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-orange-50 border-2 border-orange-200" />
                        <span className="text-xs font-black uppercase text-zinc-500">Event Day</span>
                    </div>
                </div>
            </div>

            {/* Assignment Modal */}
            {showAssignModal && selectedDate && (
                <CalendarAssignModal
                    date={selectedDate}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedDate(null);
                    }}
                    onAssign={() => {
                        fetchData();
                    }}
                />
            )}
        </section>
    );
}
