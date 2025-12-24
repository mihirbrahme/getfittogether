'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Trash2, Edit3, Search, Dumbbell, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LibraryWorkout {
    id: string;
    title: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
}

export default function LibraryManager() {
    const [workouts, setWorkouts] = useState<LibraryWorkout[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [formData, setFormData] = useState<Partial<LibraryWorkout>>({
        title: '',
        description: '',
        type: 'weekday',
    });

    const fetchLibrary = async () => {
        const { data, error } = await supabase
            .from('workout_library')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) setWorkouts(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchLibrary();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('workout_library').upsert([formData]);

        if (!error) {
            setIsAdding(false);
            setFormData({
                title: '',
                description: '',
                type: 'weekday',
            });
            fetchLibrary();
        } else {
            alert('Error saving workout: ' + error.message);
        }
    };

    const deleteWorkout = async (id: string) => {
        if (confirm('Delete this workout template from the library?')) {
            const { error } = await supabase.from('workout_library').delete().eq('id', id);
            if (!error) fetchLibrary();
        }
    };

    const filteredWorkouts = workouts.filter(w => {
        const matchesSearch = w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || w.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Workout Library</h2>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Master templates for all challenges</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
                >
                    {isAdding ? 'CANCEL' : <Plus className="h-5 w-5" />}
                    {!isAdding && 'NEW TEMPLATE'}
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-10 py-3 text-white focus:outline-none focus:border-indigo-500 appearance-none capitalize"
                    >
                        <option value="all">All Types</option>
                        <option value="weekday">Weekday</option>
                        <option value="weekend">Weekend</option>
                        <option value="event">Event</option>
                    </select>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-10 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Template Title</label>
                        <input
                            type="text"
                            placeholder="e.g., Hell of a Morning"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 appearance-none capitalize"
                        >
                            <option value="weekday">Weekday WOD</option>
                            <option value="weekend">Weekend Active Rest</option>
                            <option value="event">Event Special</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase px-2">Description</label>
                        <textarea
                            placeholder="Detailed reps, rounds, and instructions..."
                            rows={4}
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-500 text-white font-black italic text-lg py-4 rounded-2xl hover:scale-[1.01] transition-all shadow-xl shadow-indigo-500/20"
                    >
                        SAVE TO LIBRARY
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWorkouts.length === 0 ? (
                    <div className="col-span-full text-center py-12 border border-dashed border-white/10 rounded-3xl">
                        <BookOpen className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest">No templates found</p>
                    </div>
                ) : (
                    filteredWorkouts.map((wod) => (
                        <div key={wod.id} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className={cn(
                                        "text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-widest",
                                        wod.type === 'weekday' ? "bg-primary/20 text-primary border border-primary/30" :
                                            wod.type === 'weekend' ? "bg-success/20 text-success border border-success/30" :
                                                "bg-accent/20 text-accent border border-accent/30"
                                    )}>
                                        {wod.type}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setFormData(wod);
                                                setIsAdding(true);
                                            }}
                                            className="p-2 bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteWorkout(wod.id)}
                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white italic tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{wod.title}</h3>
                                    <p className="text-sm text-zinc-400 mt-1 line-clamp-3">{wod.description}</p>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                                    <Dumbbell className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-black text-zinc-600 uppercase">Template ID: {wod.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
