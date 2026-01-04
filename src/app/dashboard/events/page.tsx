'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Users, Trophy, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';
import DateDisplay from '@/components/DateDisplay';

interface Event {
    id: string;
    date: string;
    title: string;
    description: string;
    bonus_points: number;
    status: 'upcoming' | 'completed' | 'cancelled';
    attendees: string[];
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [attending, setAttending] = useState<Record<string, boolean>>({});
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        if (data) {
            setEvents(data);
            // Check which events user is attending
            const attendingMap: Record<string, boolean> = {};
            data.forEach(event => {
                attendingMap[event.id] = event.attendees?.includes(user.id) || false;
            });
            setAttending(attendingMap);
        }

        setLoading(false);
    };

    const handleAttendance = async (eventId: string, isAttending: boolean) => {
        if (!userId) return;

        const event = events.find(e => e.id === eventId);
        if (!event) return;

        let newAttendees = [...(event.attendees || [])];

        if (isAttending && !newAttendees.includes(userId)) {
            newAttendees.push(userId);
        } else if (!isAttending) {
            newAttendees = newAttendees.filter(id => id !== userId);
        }

        const { error } = await supabase
            .from('events')
            .update({ attendees: newAttendees })
            .eq('id', eventId);

        if (!error) {
            // If marking as attended for a completed event, add bonus points
            if (isAttending && event.status === 'completed') {
                // Try RPC first, fallback to direct update if RPC doesn't exist
                try {
                    const { error: rpcError } = await supabase.rpc('add_event_bonus', {
                        p_user_id: userId,
                        p_event_id: eventId,
                        p_bonus_points: event.bonus_points
                    });

                    if (rpcError) {
                        // Fallback: update profile directly if RPC doesn't exist
                        const { data } = await supabase
                            .from('profiles')
                            .select('total_points')
                            .eq('id', userId)
                            .single();

                        if (data) {
                            await supabase
                                .from('profiles')
                                .update({ total_points: (data.total_points || 0) + event.bonus_points })
                                .eq('id', userId);
                        }
                    }
                } catch {
                    // Silently fail - points may be added via trigger
                }
            }

            setAttending(prev => ({ ...prev, [eventId]: isAttending }));
            fetchEvents(); // Refresh
        }
    };

    const upcomingEvents = events.filter(e => e.status === 'upcoming');
    const pastEvents = events.filter(e => e.status === 'completed');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-[#FF5E00] animate-spin mx-auto mb-4" />
                    <p className="text-sm font-black uppercase text-zinc-400 tracking-widest">Loading Events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase text-zinc-900 dark:text-zinc-100 tracking-tighter">
                        Community <span className="text-[#FF5E00]">Events</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mt-1">
                        Join bi-weekly events and earn bonus points
                    </p>
                </div>
                <DateDisplay />
            </div>

            {/* Upcoming Events */}
            <div className="space-y-4">
                <h2 className="text-xl font-black italic uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-[#FF5E00]" />
                    Upcoming Events
                </h2>

                {upcomingEvents.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                        <Calendar className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 font-medium">No upcoming events scheduled</p>
                        <p className="text-zinc-400 text-sm">Check back soon!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                className="bg-gradient-to-br from-[#FF5E00] to-orange-600 rounded-[2rem] p-6 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">
                                                {formatDate(new Date(event.date), 'full')}
                                            </p>
                                            <h3 className="text-2xl font-black italic uppercase">{event.title}</h3>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                                            <span className="text-2xl font-black">+{event.bonus_points}</span>
                                            <span className="text-xs block opacity-80">PTS</span>
                                        </div>
                                    </div>
                                    {event.description && (
                                        <p className="text-white/80 text-sm mb-4">{event.description}</p>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4" />
                                            <span>{event.attendees?.length || 0} attending</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4" />
                                            <span>Upcoming</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Events */}
            <div className="space-y-4">
                <h2 className="text-xl font-black italic uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-emerald-500" />
                    Past Events
                </h2>

                {pastEvents.length === 0 ? (
                    <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                        <p className="text-zinc-400 font-medium">No completed events yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pastEvents.map((event) => {
                            const isAttending = attending[event.id];
                            const canMarkAttendance = !isAttending; // Can only mark once

                            return (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "bg-white dark:bg-zinc-800 border rounded-2xl p-5 transition-colors",
                                        isAttending
                                            ? "border-emerald-300 dark:border-emerald-700"
                                            : "border-zinc-200 dark:border-zinc-700"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center",
                                                isAttending
                                                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                                                    : "bg-zinc-100 dark:bg-zinc-700"
                                            )}>
                                                {isAttending ? (
                                                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                                                ) : (
                                                    <Calendar className="h-6 w-6 text-zinc-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-zinc-900 dark:text-zinc-100">{event.title}</h3>
                                                <p className="text-sm text-zinc-500">
                                                    {formatDate(new Date(event.date), 'short')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-lg font-black",
                                                    isAttending ? "text-emerald-500" : "text-zinc-400"
                                                )}>
                                                    +{event.bonus_points}
                                                </span>
                                                <p className="text-xs text-zinc-400 uppercase">pts</p>
                                            </div>

                                            {canMarkAttendance ? (
                                                <button
                                                    onClick={() => handleAttendance(event.id, true)}
                                                    className="px-4 py-2 bg-[#FF5E00] text-white font-black text-xs uppercase rounded-xl hover:bg-orange-600 transition-colors"
                                                >
                                                    I Attended
                                                </button>
                                            ) : (
                                                <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase rounded-xl">
                                                    Attended ✓
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <h3 className="font-black text-blue-900 dark:text-blue-300 mb-2">About Community Events</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Events are scheduled every two weeks</li>
                    <li>• Attending an event earns you <strong>+20 bonus points</strong></li>
                    <li>• The top scorer from the previous 2 weeks gets to choose the next activity!</li>
                    <li>• Can't make it? Complete an equivalent activity over the weekend</li>
                </ul>
            </div>
        </div>
    );
}
