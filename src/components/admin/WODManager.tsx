'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Plus, Search, Dumbbell, Zap, Calendar, Users, BookOpen, Edit3, Trash2 } from 'lucide-react';
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
        const { data: wodsData } = await supabase.from('wods').select('*').order('date', { ascending: false }).limit(20);
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
        <section className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5E00]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-[#FF5E00]/10 transition-colors duration-1000" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Activity className="h-7 w-7 text-[#FF5E00]" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                            WOD <span className="text-[#FF5E00]">ENGINE</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Neural Workout Deployment System</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        "primary-glow flex items-center gap-3 font-black px-8 py-4 rounded-[1.5rem] transition-all italic uppercase tracking-tight font-heading group/btn",
                        isAdding ? "bg-zinc-100 text-zinc-500 shadow-none border border-zinc-200" : "bg-[#FF5E00] text-white"
                    )}
                >
                    {isAdding ? 'ABORT DEPLOYMENT' : <><Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform" /> INITIATE NEW DEPLOY</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-12 bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-500 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">01. TEMPLATE UPLOAD</label>
                            <div className="relative group/input">
                                <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within/input:text-[#FF5E00] transition-colors" />
                                <select
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                    className="w-full bg-white border border-zinc-100 rounded-[1.25rem] pl-16 pr-8 py-4 text-zinc-900 font-black uppercase text-xs focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 appearance-none transition-all shadow-sm"
                                >
                                    <option value="">MANUAL OVERRIDE</option>
                                    {library.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">02. TARGET AUDIENCE</label>
                            <div className="relative group/input">
                                <Users className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within/input:text-[#FF5E00] transition-colors" />
                                <select
                                    value={formData.group_id || ''}
                                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value || null })}
                                    className="w-full bg-white border border-zinc-100 rounded-[1.25rem] pl-16 pr-8 py-4 text-zinc-900 font-black uppercase text-xs focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 appearance-none transition-all shadow-sm"
                                >
                                    <option value="">BROADCAST - ALL OPERATIVES</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">03. SCHEDULE DATE</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-8 py-4 text-zinc-900 font-black focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">04. OPERATION CLASS</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-8 py-4 text-zinc-900 font-black uppercase text-xs focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 appearance-none transition-all shadow-sm"
                            >
                                <option value="weekday">STANDARD PROTOCOL</option>
                                <option value="weekend">ACTIVE REST</option>
                                <option value="event">SPECIAL DEPLOYMENT</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">05. MISSION IDENTIFIER</label>
                        <input
                            type="text"
                            placeholder="OPERATION: PHOENIX RISE"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white border border-zinc-100 rounded-[1.5rem] px-8 py-6 text-zinc-900 font-black text-2xl italic tracking-tighter italic font-heading focus:outline-none focus:border-[#FF5E00]/30 focus:ring-12 focus:ring-[#FF5E00]/5 transition-all placeholder:text-zinc-100 shadow-sm transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">06. MISSION BRIEFING DATA</label>
                        <textarea
                            placeholder="DETAILED REPS, ROUNDS, AND OPERATIONAL PARAMETERS..."
                            rows={6}
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white border border-zinc-100 rounded-[2rem] px-8 py-6 text-zinc-900 font-black text-xs leading-relaxed focus:outline-none focus:border-[#FF5E00]/30 focus:ring-12 focus:ring-[#FF5E00]/5 resize-none transition-all placeholder:text-zinc-100 shadow-sm uppercase tracking-widest"
                        />
                    </div>

                    <button
                        type="submit"
                        className="primary-glow w-full bg-[#FF5E00] text-white font-black italic text-2xl py-8 rounded-[2rem] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 font-heading"
                    >
                        <Zap className="h-8 w-8 fill-active animate-pulse" /> BROADCAST MISSION
                    </button>
                </form>
            )}

            <div className="space-y-6">
                {wods.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-50/50 rounded-[3rem] border border-dashed border-zinc-200">
                        <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-200 shadow-sm border border-zinc-100">
                            <Dumbbell className="h-10 w-10" />
                        </div>
                        <h3 className="text-zinc-400 font-black uppercase tracking-[0.4em] text-[10px]">No Active Operations Logged</h3>
                    </div>
                ) : (
                    wods.map((wod) => (
                        <div key={wod.id || wod.date} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:border-[#FF5E00]/30 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group/card">
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className={cn(
                                        "text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest border",
                                        wod.type === 'weekday' ? "bg-zinc-900 text-white border-zinc-800" :
                                            wod.type === 'weekend' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-[#FF5E00] text-white border-[#FF5E00]"
                                    )}>
                                        {wod.type}
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100">
                                        <Calendar className="h-3.5 w-3.5 text-[#FF5E00]" />
                                        <span>{wod.date}</span>
                                    </div>
                                    {wod.group_id && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 text-[#FF5E00] border border-orange-100">
                                            <Users className="h-3.5 w-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {groups.find(g => g.id === wod.group_id)?.name || 'Unknown Squad'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-zinc-900 italic tracking-tighter font-heading uppercase group-hover/card:text-[#FF5E00] transition-colors duration-500 leading-none">{wod.title}</h3>
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest line-clamp-1 group-hover/card:text-zinc-500 transition-colors">{wod.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pt-6 lg:pt-0 lg:pl-8 lg:border-l border-zinc-100 shrink-0">
                                <button
                                    onClick={() => {
                                        setFormData(wod);
                                        setIsAdding(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="h-14 w-14 bg-zinc-50 text-zinc-400 rounded-2xl flex items-center justify-center hover:bg-[#FF5E00]/10 hover:text-[#FF5E00] transition-all duration-300 border border-zinc-100 group/edit"
                                    title="Edit Operation"
                                >
                                    <Edit3 className="h-6 w-6 group-hover/edit:rotate-12 transition-transform" />
                                </button>
                                <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-zinc-900 text-white shadow-lg group-hover/card:bg-[#FF5E00] group-hover/card:scale-110 transition-all duration-500 group-hover/card:rotate-3">
                                    <Zap className="h-8 w-8 fill-active" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
