'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Trash2, Edit3, CheckCircle, Clock, Zap } from 'lucide-react';
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
        <section className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-orange-500/10 transition-colors duration-1000" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Calendar className="h-7 w-7 text-[#FF5E00]" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                            EVENT <span className="text-[#FF5E00]">SCHEDULER</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Operational Timeline & Bonus Missions</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        "primary-glow flex items-center gap-3 font-black px-8 py-4 rounded-[1.5rem] transition-all italic uppercase tracking-tight font-heading group/btn shadow-xl",
                        isAdding ? "bg-zinc-100 text-zinc-500 shadow-none border border-zinc-200" : "bg-[#FF5E00] text-white"
                    )}
                >
                    {isAdding ? 'ABORT PLANNING' : <><Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform" /> SCHEDULE EVENT</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-12 bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">DEPLOYMENT DATE</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-8 py-4 text-zinc-900 font-black focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">BONUS ALLOCATION</label>
                            <div className="relative group/input">
                                <Zap className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within/input:text-[#FF5E00] transition-colors" />
                                <input
                                    type="number"
                                    required
                                    value={formData.bonus_points}
                                    onChange={(e) => setFormData({ ...formData, bonus_points: parseInt(e.target.value) })}
                                    className="w-full bg-white border border-zinc-100 rounded-[1.25rem] pl-16 pr-8 py-4 text-zinc-900 font-black focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">EVENT IDENTIFIER</label>
                        <input
                            type="text"
                            placeholder="e.g., SINHAGAD SUMMIT EXPEDITION"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white border border-zinc-100 rounded-[1.5rem] px-8 py-6 text-zinc-900 font-black text-2xl italic tracking-tighter italic font-heading focus:outline-none focus:border-[#FF5E00]/30 focus:ring-12 focus:ring-[#FF5E00]/5 transition-all placeholder:text-zinc-100 shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">OPERATIONAL BRIEFING</label>
                        <textarea
                            placeholder="OBJECTIVES, MEETING POINTS, AND OUTCOME PARAMETERS..."
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white border border-zinc-100 rounded-[2rem] px-8 py-6 text-zinc-900 font-black text-xs leading-relaxed focus:outline-none focus:border-[#FF5E00]/30 focus:ring-12 focus:ring-[#FF5E00]/5 resize-none transition-all placeholder:text-zinc-100 shadow-sm uppercase tracking-widest"
                        />
                    </div>
                    <button
                        type="submit"
                        className="primary-glow w-full bg-zinc-900 text-white font-black italic text-2xl py-8 rounded-[2rem] hover:bg-black transition-all flex items-center justify-center gap-4 font-heading"
                    >
                        CONFIRM MISSION SCHEDULE
                    </button>
                </form>
            )}

            <div className="space-y-6">
                {events.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-50/50 rounded-[3rem] border border-dashed border-zinc-200">
                        <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-200 shadow-sm border border-zinc-100">
                            <Calendar className="h-10 w-10" />
                        </div>
                        <h3 className="text-zinc-400 font-black uppercase tracking-[0.4em] text-[10px]">No Special Operations Logged</h3>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:border-[#FF5E00]/30 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group/card">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-center justify-center h-20 w-20 rounded-[1.5rem] bg-zinc-900 text-white shadow-lg group-hover/card:bg-[#FF5E00] group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500">
                                    <span className="text-[10px] font-black uppercase leading-none mb-1 opacity-60">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-3xl font-black italic font-heading">{new Date(event.date).getDate()}</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-zinc-900 italic tracking-tighter font-heading uppercase group-hover/card:text-[#FF5E00] transition-colors duration-500 leading-none">{event.title}</h3>
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest line-clamp-1 group-hover/card:text-zinc-500 transition-colors">{event.description || 'No description provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 pt-6 lg:pt-0 lg:pl-8 lg:border-l border-zinc-100 shrink-0">
                                <div className="flex flex-col items-end">
                                    <span className="text-3xl font-black text-[#FF5E00] italic leading-none font-heading">+{event.bonus_points}</span>
                                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">BONUS ALLOCATION</span>
                                </div>
                                <button
                                    onClick={() => deleteEvent(event.id)}
                                    className="h-14 w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100 group/del"
                                    title="Decommission Event"
                                >
                                    <Trash2 className="h-6 w-6 group-hover/del:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
