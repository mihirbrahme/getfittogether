'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Plus, Calendar, Settings, Play, Archive, CheckCircle, AlertTriangle, Loader2, Save, X, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';

interface Program {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'completed';
    max_daily_points: number;
}

interface Squad {
    id: string;
    name: string;
}

interface ProgramSquadDate {
    squad_id: string;
    start_date: string;
    end_date: string;
}

interface MetricConfig {
    id: string;
    metric_name: string;
    metric_key: string;
    metric_type: 'core_habit' | 'nutrition' | 'negative';
    points: number;
    description: string;
}

interface StreakConfig {
    id: string;
    streak_type: string;
    days_required: number;
    bonus_points: number;
}

export default function ProgramManager() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');

    const defaultMetrics: MetricConfig[] = [
        { id: '1', metric_key: 'wod', metric_name: 'Workout of the Day', metric_type: 'core_habit', points: 25, description: 'Completed daily drill' },
        { id: '2', metric_key: 'steps', metric_name: 'Daily Steps', metric_type: 'core_habit', points: 10, description: 'Reached 7,500+ steps' },
        { id: '3', metric_key: 'hydration', metric_name: 'Hydration', metric_type: 'core_habit', points: 6, description: 'Drank 2.5L+ water' },
        { id: '4', metric_key: 'sleep', metric_name: 'Sleep', metric_type: 'core_habit', points: 6, description: 'Slept 7+ hours' },
        { id: '5', metric_key: 'cleanEating', metric_name: 'Clean Eating', metric_type: 'nutrition', points: 10, description: 'Followed 80/20 rule' },
        { id: '6', metric_key: 'sugar', metric_name: 'No Added Sugar', metric_type: 'nutrition', points: 5, description: 'Zero sweets today' },
        { id: '7', metric_key: 'junkFood', metric_name: 'Junk Food', metric_type: 'negative', points: -10, description: 'Ate highly processed food' },
    ];

    const defaultStreaks: StreakConfig[] = [
        { id: 's1', streak_type: 'checkin', days_required: 3, bonus_points: 10 },
        { id: 's2', streak_type: 'checkin', days_required: 5, bonus_points: 20 },
        { id: 's3', streak_type: 'checkin', days_required: 7, bonus_points: 50 },
        { id: 's4', streak_type: 'workout', days_required: 5, bonus_points: 25 },
        { id: 's5', streak_type: 'clean_eating', days_required: 5, bonus_points: 25 },
    ];

    // Form State
    const [formData, setFormData] = useState<Partial<Program>>({
        name: '', description: '', start_date: '', end_date: '', status: 'draft', max_daily_points: 70
    });
    const [squadDates, setSquadDates] = useState<Record<string, ProgramSquadDate>>({});
    const [metrics, setMetrics] = useState<MetricConfig[]>(defaultMetrics);
    const [streaks, setStreaks] = useState<StreakConfig[]>(defaultStreaks);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

    // Action State
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [activateModalProg, setActivateModalProg] = useState<string | null>(null);
    const [selectedSquadsForActivation, setSelectedSquadsForActivation] = useState<string[]>([]);
    const [resetPointsOnActivate, setResetPointsOnActivate] = useState(true);

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        }
    }, [view]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [{ data: pData }, { data: sData }] = await Promise.all([
                supabase.from('programs').select('*').order('created_at', { ascending: false }),
                supabase.from('groups').select('id, name').order('name')
            ]);
            if (pData) setPrograms(pData);
            if (sData) setSquads(sData);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleCreateNew = () => {
        setFormData({
            name: '', description: '', start_date: '', end_date: '', status: 'draft', max_daily_points: 70
        });
        const initialSquadDates: Record<string, ProgramSquadDate> = {};
        squads.forEach(s => {
            initialSquadDates[s.id] = { squad_id: s.id, start_date: '', end_date: '' };
        });
        setSquadDates(initialSquadDates);
        setMetrics(defaultMetrics);
        setStreaks(defaultStreaks);
        setEditingProgramId(null);
        setView('create');
    };

    const handleEdit = async (programId: string) => {
        setEditingProgramId(programId);
        setSaving(false);

        // Fetch program data
        const { data: prog } = await supabase.from('programs').select('*').eq('id', programId).single();
        if (!prog) return alert('Program not found');

        setFormData({
            name: prog.name,
            description: prog.description || '',
            start_date: prog.start_date,
            end_date: prog.end_date,
            status: prog.status,
            max_daily_points: prog.max_daily_points || 70
        });

        // Fetch squad date overrides
        const { data: overrides } = await supabase.from('program_squad_dates').select('*').eq('program_id', programId);
        const sdMap: Record<string, ProgramSquadDate> = {};
        squads.forEach(s => { sdMap[s.id] = { squad_id: s.id, start_date: '', end_date: '' }; });
        overrides?.forEach(o => { sdMap[o.squad_id] = { squad_id: o.squad_id, start_date: o.start_date, end_date: o.end_date }; });
        setSquadDates(sdMap);

        // Fetch metrics
        const { data: metricsData } = await supabase.from('program_metrics').select('*').eq('program_id', programId).order('display_order');
        if (metricsData && metricsData.length > 0) {
            setMetrics(metricsData.map(m => ({
                id: m.id,
                metric_name: m.metric_name,
                metric_key: m.metric_key,
                metric_type: m.metric_type,
                points: m.points,
                description: m.description || ''
            })));
        } else {
            setMetrics(defaultMetrics);
        }

        // Fetch streaks
        const { data: streaksData } = await supabase.from('program_streak_config').select('*').eq('program_id', programId);
        if (streaksData && streaksData.length > 0) {
            setStreaks(streaksData.map(s => ({
                id: s.id,
                streak_type: s.streak_type,
                days_required: s.days_required,
                bonus_points: s.bonus_points
            })));
        } else {
            setStreaks(defaultStreaks);
        }

        setView('edit');
    };

    const handleSave = async () => {
        if (!formData.name || !formData.start_date || !formData.end_date) return alert('Name and global dates required');

        setSaving(true);
        try {
            let programId: string;

            if (editingProgramId) {
                // UPDATE existing program
                const { error } = await supabase.from('programs').update({
                    name: formData.name,
                    description: formData.description,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    max_daily_points: formData.max_daily_points
                }).eq('id', editingProgramId);
                if (error) throw error;
                programId = editingProgramId;

                // Delete old related data and re-insert
                await supabase.from('program_squad_dates').delete().eq('program_id', programId);
                await supabase.from('program_metrics').delete().eq('program_id', programId);
                await supabase.from('program_streak_config').delete().eq('program_id', programId);
            } else {
                // INSERT new program
                const { data: prog, error } = await supabase.from('programs').insert([{
                    name: formData.name,
                    description: formData.description,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    status: 'draft',
                    max_daily_points: formData.max_daily_points
                }]).select('id').single();
                if (error) throw error;
                programId = prog.id;
            }

            // Save Squad Date Overrides
            const overridesToSave = Object.values(squadDates).filter(sd => sd.start_date && sd.end_date).map(sd => ({
                program_id: programId,
                ...sd
            }));
            if (overridesToSave.length > 0) {
                await supabase.from('program_squad_dates').insert(overridesToSave);
            }

            // Save Metrics
            if (metrics.length > 0) {
                const metricsToInsert = metrics.map((m, i) => ({
                    program_id: programId,
                    metric_name: m.metric_name,
                    metric_key: m.metric_key,
                    metric_type: m.metric_type,
                    points: m.points,
                    description: m.description,
                    display_order: i,
                    enabled: true
                }));
                await supabase.from('program_metrics').insert(metricsToInsert);
            }

            // Save Streaks
            if (streaks.length > 0) {
                const streaksToInsert = streaks.map(s => ({
                    program_id: programId,
                    streak_type: s.streak_type,
                    days_required: s.days_required,
                    bonus_points: s.bonus_points
                }));
                await supabase.from('program_streak_config').insert(streaksToInsert);
            }

            setView('list');
        } catch (e: any) {
            alert('Error saving program: ' + e.message);
        }
        setSaving(false);
    };

    const handleActivateClick = (programId: string) => {
        setActivateModalProg(programId);
        setSelectedSquadsForActivation(squads.map(s => s.id));
        setResetPointsOnActivate(true);
    };

    const confirmActivation = async () => {
        if (!activateModalProg) return;
        if (selectedSquadsForActivation.length === 0) return alert('Please select at least one squad.');

        setActivatingId(activateModalProg);
        setActivateModalProg(null);
        try {
            const { error } = await supabase.rpc('activate_program_for_squads', {
                p_program_id: activateModalProg,
                p_squad_ids: selectedSquadsForActivation,
                p_reset_points: resetPointsOnActivate
            });
            if (error) throw error;
            await fetchData();
            alert(`Program successfully activated for ${selectedSquadsForActivation.length} squad(s)! Points ${resetPointsOnActivate ? 'have been reset to 0' : 'were kept intact'}.`);
        } catch (e: any) {
            alert('Error activating program: ' + e.message);
        }
        setActivatingId(null);
    };

    const renderList = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900">Program Management</h3>
                    <p className="text-sm text-zinc-500 font-medium">Create and manage seasonal programs and their timelines.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-[#FF5E00] text-white px-5 py-3 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                    <Plus className="h-4 w-4" /> New Program
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                </div>
            ) : programs.length === 0 ? (
                <div className="premium-card p-12 text-center flex flex-col items-center">
                    <div className="h-16 w-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                        <Activity className="h-8 w-8 text-zinc-400" />
                    </div>
                    <h4 className="text-lg font-black uppercase text-zinc-900 mb-2">No Programs Found</h4>
                    <p className="text-zinc-500 text-sm max-w-sm">Create your first program to start tracking participant progress in a structured timeline.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programs.map(p => (
                        <div key={p.id} className="premium-card p-6 flex flex-col relative overflow-hidden group">
                            {p.status === 'active' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF5E00] to-orange-400" />}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                            p.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                                                p.status === 'draft' ? "bg-zinc-100 text-zinc-600" :
                                                    "bg-blue-100 text-blue-700"
                                        )}>
                                            {p.status}
                                        </span>
                                        {p.status === 'active' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                                    </div>
                                    <h4 className="text-xl font-black italic uppercase text-zinc-900 mt-2">{p.name}</h4>
                                </div>
                            </div>

                            <p className="text-xs text-zinc-500 mb-6 line-clamp-2 min-h-[32px]">{p.description || "No description provided."}</p>

                            <div className="grid grid-cols-2 gap-3 mb-6 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                <div>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Starts</span>
                                    <span className="text-xs font-semibold text-zinc-700">{formatDate(new Date(p.start_date))}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Ends</span>
                                    <span className="text-xs font-semibold text-zinc-700">{formatDate(new Date(p.end_date))}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-zinc-100 flex gap-2">
                                {p.status === 'draft' && (
                                    <>
                                        <button
                                            onClick={() => handleActivateClick(p.id)}
                                            disabled={activatingId === p.id}
                                            className="flex-1 bg-zinc-900 text-white py-2 rounded-lg text-xs font-bold uppercase hover:bg-[#FF5E00] transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                        >
                                            {activatingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3 w-3" />}
                                            Activate
                                        </button>
                                        <button
                                            onClick={() => handleEdit(p.id)}
                                            className="p-2 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors"
                                            title="Edit program"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                                {p.status === 'active' && (
                                    <>
                                        <button className="flex-1 bg-emerald-50 text-emerald-700 py-2 rounded-lg text-xs font-bold uppercase border border-emerald-200 flex justify-center items-center gap-2 cursor-default">
                                            <CheckCircle className="h-3 w-3" /> Active
                                        </button>
                                        <button
                                            onClick={() => handleEdit(p.id)}
                                            className="p-2 border border-emerald-200 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                            title="Edit program"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                                {p.status === 'completed' && (
                                    <button className="flex-1 bg-zinc-50 text-zinc-500 py-2 rounded-lg text-xs font-bold uppercase border border-zinc-200 flex justify-center items-center gap-2 cursor-default">
                                        <Archive className="h-3 w-3" /> Archived
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activateModalProg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black uppercase italic tracking-tight text-zinc-900">Activate Program</h3>
                            <button onClick={() => setActivateModalProg(null)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                        <p className="text-sm text-zinc-500 mb-6">Select which squads this program should be active for. Note: One squad can only have one active program at a time.</p>

                        <div className="space-y-4 mb-6">
                            <h4 className="text-xs font-bold uppercase text-zinc-400">Select Squads</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {squads.map(s => (
                                    <label key={s.id} className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                                            checked={selectedSquadsForActivation.includes(s.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedSquadsForActivation([...selectedSquadsForActivation, s.id]);
                                                else setSelectedSquadsForActivation(selectedSquadsForActivation.filter(id => id !== s.id));
                                            }}
                                        />
                                        <span className="text-sm font-bold text-zinc-700">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 mt-1 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                                    checked={resetPointsOnActivate}
                                    onChange={(e) => setResetPointsOnActivate(e.target.checked)}
                                />
                                <div>
                                    <span className="block text-sm font-black uppercase text-orange-800 tracking-tight">Reset Squad Points & Streaks</span>
                                    <span className="block text-xs text-orange-600/80 mt-1">If enabled, all users in the selected squads will have their total points and current streaks reset to 0. Recommended for new seasons.</span>
                                </div>
                            </label>
                        </div>

                        <button
                            onClick={confirmActivation}
                            disabled={selectedSquadsForActivation.length === 0}
                            className="w-full bg-[#FF5E00] text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-orange-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm & Activate
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderForm = () => (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900">
                        {editingProgramId ? 'Edit Program' : 'Create Program'}
                    </h3>
                    <p className="text-sm text-zinc-500 font-medium">
                        {editingProgramId ? 'Modify timeline, metrics, and configuration.' : 'Define timeline, metrics, and squad overrides.'}
                    </p>
                </div>
                <button onClick={() => { setView('list'); setEditingProgramId(null); }} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>

            <div className="premium-card p-8 space-y-8">
                <div>
                    <h4 className="font-black uppercase text-sm border-b pb-2 mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-orange-500" /> General Info</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Program Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="e.g. GFT Season 2" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Description (Optional)</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field min-h-[80px]" placeholder="Brief context about this season..." />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-black uppercase text-sm border-b pb-2 mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-orange-500" /> Global Timeline</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Start Date</label>
                            <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">End Date</label>
                            <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="input-field" />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-black uppercase text-sm border-b pb-2 mb-4 flex items-center gap-2"><Settings className="h-4 w-4 text-orange-500" /> Squad Specific Dates (Optional)</h4>
                    <p className="text-xs text-zinc-500 mb-4">Overrides the global timeline for specific squads if they start earlier or later.</p>
                    <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
                        {squads.map((s, i) => (
                            <div key={s.id} className={cn("p-4 flex items-center gap-4", i !== squads.length - 1 && "border-b border-zinc-200")}>
                                <div className="w-1/3 font-bold text-sm">{s.name}</div>
                                <div className="flex-1 flex gap-2">
                                    <input type="date" value={squadDates[s.id]?.start_date || ''} onChange={e => setSquadDates({ ...squadDates, [s.id]: { ...squadDates[s.id], start_date: e.target.value } })} className="input-field text-sm flex-1" />
                                    <span className="text-zinc-300 self-center">→</span>
                                    <input type="date" value={squadDates[s.id]?.end_date || ''} onChange={e => setSquadDates({ ...squadDates, [s.id]: { ...squadDates[s.id], end_date: e.target.value } })} className="input-field text-sm flex-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between border-b pb-2 mb-4">
                        <h4 className="font-black uppercase text-sm flex items-center gap-2"><Settings className="h-4 w-4 text-orange-500" /> Check-in Metrics</h4>
                        <button onClick={() => setMetrics([...metrics, { id: Math.random().toString(), metric_key: '', metric_name: '', metric_type: 'core_habit', points: 5, description: '' }])} className="text-xs text-orange-500 font-bold hover:bg-orange-50 px-2 py-1 rounded">
                            + Add Metric
                        </button>
                    </div>
                    <div className="space-y-3">
                        {metrics.map((m, i) => (
                            <div key={m.id} className="grid grid-cols-12 gap-2 items-center bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                                <div className="col-span-3">
                                    <input type="text" value={m.metric_name} placeholder="Name (e.g. WOD)" onChange={e => setMetrics(metrics.map((x, j) => i === j ? { ...x, metric_name: e.target.value, metric_key: e.target.value.toLowerCase().replace(/\s+/g, '_') } : x))} className="input-field text-xs py-2" />
                                </div>
                                <div className="col-span-3">
                                    <input type="text" value={m.description} placeholder="Description" onChange={e => setMetrics(metrics.map((x, j) => i === j ? { ...x, description: e.target.value } : x))} className="input-field text-xs py-2" />
                                </div>
                                <div className="col-span-3">
                                    <select value={m.metric_type} onChange={e => setMetrics(metrics.map((x, j) => i === j ? { ...x, metric_type: e.target.value as any } : x))} className="input-field text-xs py-2 appearance-none">
                                        <option value="core_habit">Core Habit</option>
                                        <option value="nutrition">Nutrition</option>
                                        <option value="negative">Negative</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <input type="number" value={m.points} placeholder="Pts" onChange={e => setMetrics(metrics.map((x, j) => i === j ? { ...x, points: parseInt(e.target.value) || 0 } : x))} className="input-field text-xs py-2" />
                                </div>
                                <div className="col-span-1 text-center">
                                    <button onClick={() => setMetrics(metrics.filter((_, j) => i !== j))} className="text-zinc-400 hover:text-red-500"><X className="h-4 w-4 mx-auto" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between border-b pb-2 mb-4">
                        <h4 className="font-black uppercase text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-orange-500" /> Streak Milestones</h4>
                        <button onClick={() => setStreaks([...streaks, { id: Math.random().toString(), streak_type: 'checkin', days_required: 3, bonus_points: 10 }])} className="text-xs text-orange-500 font-bold hover:bg-orange-50 px-2 py-1 rounded">
                            + Add Milestone
                        </button>
                    </div>
                    <div className="space-y-3">
                        {streaks.map((s, i) => (
                            <div key={s.id} className="grid grid-cols-12 gap-2 items-center bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                                <div className="col-span-5">
                                    <select value={s.streak_type} onChange={e => setStreaks(streaks.map((x, j) => i === j ? { ...x, streak_type: e.target.value } : x))} className="input-field text-xs py-2 appearance-none">
                                        <option value="checkin">Daily Check-in</option>
                                        <option value="workout">Workout</option>
                                        <option value="clean_eating">Clean Eating</option>
                                    </select>
                                </div>
                                <div className="col-span-3 relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 uppercase font-black">Day</span>
                                    <input type="number" value={s.days_required} onChange={e => setStreaks(streaks.map((x, j) => i === j ? { ...x, days_required: parseInt(e.target.value) || 0 } : x))} className="input-field text-xs py-2 pl-8" />
                                </div>
                                <div className="col-span-3 relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 uppercase font-black">Pts</span>
                                    <input type="number" value={s.bonus_points} onChange={e => setStreaks(streaks.map((x, j) => i === j ? { ...x, bonus_points: parseInt(e.target.value) || 0 } : x))} className="input-field text-xs py-2 pl-7" />
                                </div>
                                <div className="col-span-1 text-center">
                                    <button onClick={() => setStreaks(streaks.filter((_, j) => i !== j))} className="text-zinc-400 hover:text-red-500"><X className="h-4 w-4 mx-auto" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button onClick={() => setView('list')} className="px-6 py-3 font-bold uppercase text-xs text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#FF5E00] text-white px-8 py-3 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editingProgramId ? 'Save Changes' : 'Create Draft'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {view === 'list' ? renderList() : renderForm()}
        </div>
    );
}
