'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Trash2, Edit3, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
    id: string;
    date: string;
    title: string;
    description: string;
    bonus_points: number;
}

export default function EventScheduler() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        bonus_points: 50,
    });

    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        if (!error) setEvents(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('events').insert([formData]);

        if (!error) {
            setIsAdding(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                title: '',
                description: '',
                bonus_points: 50,
            });
            fetchEvents();
        } else {
            alert('Error adding event: ' + error.message);
        }
    };

    const deleteEvent = async (id: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (!error) fetchEvents();
        }
    };

    return (
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Event Scheduler</h2>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Plan weekend treks & bonus activities</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-primary/20"
                >
                    {isAdding ? <Clock className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {isAdding ? 'CANCEL' : 'ADD EVENT'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-10 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Bonus Points</label>
                            <input
                                type="number"
                                required
                                value={formData.bonus_points}
                                onChange={(e) => setFormData({ ...formData, bonus_points: parseInt(e.target.value) })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Title</label>
                        <input
                            type="text"
                            placeholder="e.g., Sinhagad Trek"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Description</label>
                        <textarea
                            placeholder="Detailed description or outcome bonus info..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-white text-black font-black italic text-lg py-4 rounded-2xl hover:bg-zinc-200 transition-colors shadow-xl"
                    >
                        CONFIRM SCHEDULE
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {events.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest">No events scheduled yet</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                                    <span className="text-[10px] font-black uppercase leading-none">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-2xl font-black italic">{new Date(event.date).getDate()}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white italic leading-tight">{event.title}</h3>
                                    <p className="text-xs text-zinc-500 font-medium">{event.description || 'No description provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-xl font-black text-primary italic leading-none">+{event.bonus_points}</span>
                                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-tighter">BONUS PTS</span>
                                </div>
                                <button
                                    onClick={() => deleteEvent(event.id)}
                                    className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
