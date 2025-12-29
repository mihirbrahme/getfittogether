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
    video_url?: string;
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
        video_url: '',
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
        <section className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-indigo-500/10 transition-colors duration-1000" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <BookOpen className="h-7 w-7 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                            WORKOUT <span className="text-indigo-500">LIBRARY</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Master Template Repository</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        "primary-glow flex items-center gap-3 font-black px-8 py-4 rounded-[1.5rem] transition-all italic uppercase tracking-tight font-heading group/btn shadow-xl",
                        isAdding ? "bg-zinc-100 text-zinc-500 shadow-none border border-zinc-200" : "bg-indigo-600 text-white shadow-indigo-500/20"
                    )}
                >
                    {isAdding ? 'ABORT ARCHIVE' : <><Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform" /> NEW TEMPLATE</>}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-12">
                <div className="relative flex-1 group/input">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within/input:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH ARCHIVES..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-zinc-100 rounded-[1.25rem] pl-16 pr-8 py-4 text-zinc-900 font-black uppercase text-xs focus:outline-none focus:border-indigo-500/30 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-sm"
                    />
                </div>
                <div className="relative group/input">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within/input:text-indigo-500 transition-colors" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white border border-zinc-100 rounded-[1.25rem] pl-16 pr-12 py-4 text-zinc-900 font-black uppercase text-xs focus:outline-none focus:border-indigo-500/30 focus:ring-8 focus:ring-indigo-500/5 appearance-none shadow-sm"
                    >
                        <option value="all">ALL CLASSIFICATIONS</option>
                        <option value="weekday">WEEKDAY PROTOCOLS</option>
                        <option value="weekend">WEEKEND ACTIVE REST</option>
                        <option value="event">SPECIAL EVENTS</option>
                    </select>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-12 bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">TEMPLATE IDENTIFIER</label>
                            <input
                                type="text"
                                placeholder="e.g., HELL OF A MORNING"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-8 py-4 text-zinc-900 font-black focus:outline-none focus:border-indigo-500/30 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">PROTOCOL CLASS</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-8 py-4 text-zinc-900 font-black uppercase focus:outline-none focus:border-indigo-500/30 focus:ring-8 focus:ring-indigo-500/5 appearance-none shadow-sm"
                            >
                                <option value="weekday">WEEKDAY WOD</option>
                                <option value="weekend">WEEKEND ACTIVE REST</option>
                                <option value="event">EVENT SPECIAL</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">OPERATIONAL DATA</label>
                        <textarea
                            placeholder="DETAILED REPS, ROUNDS, AND SUBMISSION GUIDELINES..."
                            rows={6}
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white border border-zinc-100 rounded-[2rem] px-8 py-6 text-zinc-900 font-black text-xs leading-relaxed focus:outline-none focus:border-indigo-500/30 focus:ring-8 focus:ring-indigo-500/5 resize-none transition-all shadow-sm uppercase tracking-widest"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">VIDEO DEMONSTRATION</label>
                        <input
                            type="url"
                            placeholder="https://youtube.com/watch?v=... (Optional)"
                            value={formData.video_url}
                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                            className="w-full bg-white border border-zinc-100 rounded-[1.5rem] px-8 py-4 text-zinc-700 font-semibold focus:outline-none focus:border-indigo-500/30 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-black italic text-2xl py-8 rounded-[2rem] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-indigo-500/20 font-heading uppercase tracking-tight"
                    >
                        ARCHIVE TEMPLATE
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredWorkouts.length === 0 ? (
                    <div className="col-span-full text-center py-24 bg-zinc-50/50 rounded-[3rem] border border-dashed border-zinc-200">
                        <BookOpen className="h-16 w-16 text-zinc-200 mx-auto mb-6" />
                        <h3 className="text-zinc-300 font-black uppercase tracking-[0.5em] text-[10px]">No Templates Found in Archives</h3>
                    </div>
                ) : (
                    filteredWorkouts.map((wod) => (
                        <div key={wod.id} className="bg-zinc-50/50 p-8 rounded-[2.5rem] border border-zinc-100 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-500 flex flex-col justify-between group/card">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className={cn(
                                        "text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest border shadow-sm",
                                        wod.type === 'weekday' ? "bg-zinc-900 text-white border-zinc-800" :
                                            wod.type === 'weekend' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-indigo-600 text-white border-indigo-500"
                                    )}>
                                        {wod.type}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setFormData(wod);
                                                setIsAdding(true);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="h-10 w-10 flex items-center justify-center bg-white text-zinc-300 rounded-xl hover:text-indigo-500 hover:bg-indigo-50 border border-zinc-100 transition-all shadow-sm"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteWorkout(wod.id)}
                                            className="h-10 w-10 flex items-center justify-center bg-white text-zinc-300 rounded-xl hover:text-red-500 hover:bg-red-50 border border-zinc-100 transition-all shadow-sm"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading group-hover/card:text-indigo-500 transition-colors duration-500 leading-tight mb-2">{wod.title}</h3>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest line-clamp-3 group-hover/card:text-zinc-500 transition-colors">{wod.description}</p>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-zinc-100/50 flex items-center justify-between">
                                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm border border-zinc-100 group-hover/card:scale-110 group-hover/card:rotate-6 transition-all duration-500">
                                    <Dumbbell className="h-6 w-6" />
                                </div>
                                <span className="text-[9px] font-black text-zinc-200 uppercase tracking-[0.2em]">ID: {wod.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
