'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Plus, Search, Dumbbell, Zap, Calendar, Users, BookOpen, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WOD {
    id?: string;
    date: string;
    title: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
    group_id: string | null;
}

interface LibraryWorkout {
    id: string;
    title: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
}

interface Group {
    id: string;
    name: string;
}

export default function WODManager() {
    const [wods, setWods] = useState<WOD[]>([]);
    const [library, setLibrary] = useState<LibraryWorkout[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState<WOD>({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        type: 'weekday',
        group_id: null,
    });

    const fetchData = async () => {
        const { data: wodsData } = await supabase.from('wods').select('*').order('date', { ascending: false }).limit(10);
        const { data: libData } = await supabase.from('workout_library').select('*');
        const { data: groupsData } = await supabase.from('groups').select('id, name');

        setWods(wodsData || []);
        setLibrary(libData || []);
        setGroups(groupsData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTemplateSelect = (templateId: string) => {
        const template = library.find(t => t.id === templateId);
        if (template) {
            setFormData({
                ...formData,
                title: template.title,
                description: template.description,
                type: template.type,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('wods').upsert([formData]);

        if (!error) {
            setIsAdding(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                title: '',
                description: '',
                type: 'weekday',
                group_id: null,
            });
            fetchData();
        } else {
            alert('Error updating WOD: ' + error.message);
        }
    };

    return (
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">WOD Engine</h2>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Deploy daily challenges to all participants</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-accent/20"
                >
                    {isAdding ? 'CANCEL' : <Plus className="h-5 w-5" />}
                    {!isAdding && 'DEPLOY WOD'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-10 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase px-2">1. Select Template (Optional)</label>
                            <div className="relative">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <select
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-accent appearance-none"
                                >
                                    <option value="">-- Choose from Library --</option>
                                    {library.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase px-2">2. Target Squad</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <select
                                    value={formData.group_id || ''}
                                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value || null })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-accent appearance-none"
                                >
                                    <option value="">All Participants</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Deployment Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent appearance-none capitalize"
                            >
                                <option value="weekday">Weekday WOD</option>
                                <option value="weekend">Weekend Active Rest</option>
                                <option value="event">Event Special</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Operation Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Operation: Phoenix"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Workout Description</label>
                        <textarea
                            placeholder="Details, reps, rounds, etc."
                            rows={4}
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-accent text-white font-black italic text-lg py-4 rounded-2xl hover:scale-[1.01] transition-all shadow-xl shadow-accent/20"
                    >
                        DEPLOY TO CHALLENGE
                    </button>
                </form>
            )}

            <div className="space-y-6">
                {wods.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                        <Dumbbell className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest">No WODs deployed yet</p>
                    </div>
                ) : (
                    wods.map((wod) => (
                        <div key={wod.id || wod.date} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-accent/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-widest",
                                        wod.type === 'weekday' ? "bg-primary/20 text-primary border border-primary/30" :
                                            wod.type === 'weekend' ? "bg-success/20 text-success border border-success/30" :
                                                "bg-accent/20 text-accent border border-accent/30"
                                    )}>
                                        {wod.type}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-[10px] font-black">{wod.date}</span>
                                    </div>
                                    {wod.group_id && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                            <Users className="h-3 w-3 text-zinc-400" />
                                            <span className="text-[10px] font-black text-zinc-400 uppercase">
                                                {groups.find(g => g.id === wod.group_id)?.name || 'Squad'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic tracking-tight group-hover:text-accent transition-colors">{wod.title}</h3>
                                    <p className="text-sm text-zinc-400 mt-1 max-w-xl line-clamp-2">{wod.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 shrink-0">
                                <button
                                    onClick={() => {
                                        setFormData(wod);
                                        setIsAdding(true);
                                    }}
                                    className="p-3 bg-white/5 text-zinc-400 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <Edit3 className="h-5 w-5" />
                                </button>
                                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-zinc-700 font-black italic">
                                    <Zap className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
