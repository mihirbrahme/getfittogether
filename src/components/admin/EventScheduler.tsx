'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Trash2, Edit3, CheckCircle, Clock, Award, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
    id: string;
    date: string;
    title: string;
    description: string;
    bonus_points: number;
    status: 'upcoming' | 'completed' | 'cancelled';
    assigned_squads?: string[];
}

interface Group {
    id: string;
    name: string;
}

export default function EventScheduler() {
    const [events, setEvents] = useState<Event[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        bonus_points: 50,
        status: 'upcoming' as 'upcoming' | 'completed' | 'cancelled',
        assigned_squads: [] as string[]
    });

    const fetchData = async () => {
        // Fetch events with squad assignments
        const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        if (eventsData) {
            const eventsWithSquads = await Promise.all(
                eventsData.map(async (event) => {
                    const { data: assignments } = await supabase
                        .from('event_squad_assignments')
                        .select('group_id')
                        .eq('event_id', event.id);

                    return {
                        ...event,
                        assigned_squads: assignments?.map(a => a.group_id) || []
                    };
                })
            );
            setEvents(eventsWithSquads);
        }

        // Fetch squads
        const { data: groupsData } = await supabase
            .from('groups')
            .select('id, name')
            .order('name');

        setGroups(groupsData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingEvent) {
                // Update existing event
                const { error: updateError } = await supabase
                    .from('events')
                    .update({
                        date: formData.date,
                        title: formData.title,
                        description: formData.description,
                        bonus_points: formData.bonus_points,
                        status: formData.status
                    })
                    .eq('id', editingEvent.id);

                if (updateError) throw updateError;

                // Update squad assignments
                await supabase
                    .from('event_squad_assignments')
                    .delete()
                    .eq('event_id', editingEvent.id);

                if (formData.assigned_squads.length > 0) {
                    const assignments = formData.assigned_squads.map(squadId => ({
                        event_id: editingEvent.id,
                        group_id: squadId
                    }));

                    await supabase
                        .from('event_squad_assignments')
                        .insert(assignments);
                }

                setEditingEvent(null);
            } else {
                // Create new event
                const { data: newEvent, error: insertError } = await supabase
                    .from('events')
                    .insert([{
                        date: formData.date,
                        title: formData.title,
                        description: formData.description,
                        bonus_points: formData.bonus_points,
                        status: formData.status
                    }])
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Add squad assignments
                if (formData.assigned_squads.length > 0) {
                    const assignments = formData.assigned_squads.map(squadId => ({
                        event_id: newEvent.id,
                        group_id: squadId
                    }));

                    await supabase
                        .from('event_squad_assignments')
                        .insert(assignments);
                }
            }

            setIsAdding(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                title: '',
                description: '',
                bonus_points: 50,
                status: 'upcoming',
                assigned_squads: []
            });
            fetchData();
        } catch (error: any) {
            alert('Error saving event: ' + error.message);
        }
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setFormData({
            date: event.date,
            title: event.title,
            description: event.description,
            bonus_points: event.bonus_points,
            status: event.status,
            assigned_squads: event.assigned_squads || []
        });
        setIsAdding(true);
    };

    const deleteEvent = async (id: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (!error) fetchData();
        }
    };

    const toggleSquad = (squadId: string) => {
        if (formData.assigned_squads.includes(squadId)) {
            setFormData({
                ...formData,
                assigned_squads: formData.assigned_squads.filter(id => id !== squadId)
            });
        } else {
            setFormData({
                ...formData,
                assigned_squads: [...formData.assigned_squads, squadId]
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-500';
            case 'completed': return 'bg-emerald-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-zinc-500';
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
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Manage Special Events & Bonus Points</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        if (isAdding) {
                            setEditingEvent(null);
                            setFormData({
                                date: new Date().toISOString().split('T')[0],
                                title: '',
                                description: '',
                                bonus_points: 50,
                                status: 'upcoming',
                                assigned_squads: []
                            });
                        }
                    }}
                    className={cn(
                        "primary-glow flex items-center gap-3 font-black px-8 py-4 rounded-[1.5rem] transition-all italic uppercase tracking-tight font-heading group/btn shadow-xl",
                        isAdding ? "bg-zinc-100 text-zinc-500 shadow-none border border-zinc-200" : "bg-[#FF5E00] text-white"
                    )}
                >
                    {isAdding ? 'CANCEL' : <><Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform" /> CREATE EVENT</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-12 bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Event Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-6 py-4 text-zinc-900 font-semibold focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Bonus Points</label>
                            <div className="relative group/input">
                                <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within/input:text-[#FF5E00] transition-colors" />
                                <input
                                    type="number"
                                    required
                                    value={formData.bonus_points}
                                    onChange={(e) => setFormData({ ...formData, bonus_points: parseInt(e.target.value) })}
                                    className="w-full bg-white border border-zinc-100 rounded-[1.25rem] pl-12 pr-6 py-4 text-zinc-900 font-bold focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-6 py-4 text-zinc-900 font-semibold focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all shadow-sm"
                            >
                                <option value="upcoming">Upcoming</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Event Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Mountain Trek Challenge"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white border border-zinc-100 rounded-[1.5rem] px-8 py-6 text-zinc-900 font-black text-2xl italic tracking-tighter font-heading focus:outline-none focus:border-[#FF5E00]/30 focus:ring-12 focus:ring-[#FF5E00]/5 transition-all placeholder:text-zinc-200 shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Description</label>
                        <textarea
                            placeholder="Event details, meeting point, what to bring..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white border border-zinc-100 rounded-[2rem] px-8 py-6 text-zinc-900 font-medium text-sm leading-relaxed focus:outline-none focus:border-[#FF5E00]/30 focus:ring-12 focus:ring-[#FF5E00]/5 resize-none transition-all placeholder:text-zinc-200 shadow-sm"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Assign to Squads</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    type="button"
                                    onClick={() => toggleSquad(group.id)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 text-left font-bold text-sm transition-all flex items-center gap-3",
                                        formData.assigned_squads.includes(group.id)
                                            ? "border-[#FF5E00] bg-orange-50"
                                            : "border-zinc-200 hover:border-zinc-300"
                                    )}
                                >
                                    <div className={cn(
                                        "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                                        formData.assigned_squads.includes(group.id)
                                            ? "border-[#FF5E00] bg-[#FF5E00]"
                                            : "border-zinc-300"
                                    )}>
                                        {formData.assigned_squads.includes(group.id) && (
                                            <CheckCircle className="h-3 w-3 text-white" />
                                        )}
                                    </div>
                                    {group.name}
                                </button>
                            ))}
                        </div>
                        {formData.assigned_squads.length === 0 && (
                            <p className="text-xs text-zinc-400 px-2">No squads selected - event will be visible to all</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="primary-glow w-full bg-zinc-900 text-white font-black italic text-xl py-6 rounded-[2rem] hover:bg-black transition-all flex items-center justify-center gap-4 font-heading"
                    >
                        {editingEvent ? 'UPDATE EVENT' : 'CREATE EVENT'}
                    </button>
                </form>
            )}

            <div className="space-y-6">
                {events.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-50/50 rounded-[3rem] border border-dashed border-zinc-200">
                        <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-200 shadow-sm border border-zinc-100">
                            <Calendar className="h-10 w-10" />
                        </div>
                        <h3 className="text-zinc-400 font-black uppercase tracking-[0.4em] text-[10px]">No Events Scheduled</h3>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:border-[#FF5E00]/30 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group/card">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-center justify-center h-20 w-20 rounded-[1.5rem] bg-zinc-900 text-white shadow-lg group-hover/card:bg-[#FF5E00] group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500">
                                    <span className="text-[10px] font-black uppercase leading-none mb-1 opacity-60">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-3xl font-black italic font-heading">{new Date(event.date).getDate()}</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-black text-zinc-900 italic tracking-tighter font-heading uppercase group-hover/card:text-[#FF5E00] transition-colors duration-500 leading-none">{event.title}</h3>
                                        <span className={cn("px-3 py-1 rounded-lg text-xs font-black uppercase text-white", getStatusColor(event.status))}>
                                            {event.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium line-clamp-1">{event.description || 'No description'}</p>
                                    {event.assigned_squads && event.assigned_squads.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {event.assigned_squads.map(squadId => {
                                                const squad = groups.find(g => g.id === squadId);
                                                return squad ? (
                                                    <span key={squadId} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">
                                                        {squad.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pt-6 lg:pt-0 lg:pl-8 lg:border-l border-zinc-100 shrink-0">
                                <div className="flex flex-col items-end">
                                    <span className="text-3xl font-black text-[#FF5E00] italic leading-none font-heading">+{event.bonus_points}</span>
                                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Bonus Points</span>
                                </div>
                                <button
                                    onClick={() => handleEdit(event)}
                                    className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all duration-300 border border-blue-100 group/edit"
                                    title="Edit Event"
                                >
                                    <Edit3 className="h-5 w-5 group-hover/edit:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => deleteEvent(event.id)}
                                    className="h-14 w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100 group/del"
                                    title="Delete Event"
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
