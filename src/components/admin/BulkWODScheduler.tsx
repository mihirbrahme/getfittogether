'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Sparkles, AlertTriangle, CheckCircle2, X, Plus, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, addDays, eachDayOfInterval } from '@/lib/dateUtils';

interface LibraryWorkout {
    id: string;
    title: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
    video_url?: string;
}

interface Group {
    id: string;
    name: string;
}

interface SchedulePreview {
    date: string;
    workout: LibraryWorkout;
    exists: boolean;
    group_id: string | null;
}

type AssignmentStrategy = 'sequential' | 'random' | 'round-robin';

export default function BulkWODScheduler() {
    const [library, setLibrary] = useState<LibraryWorkout[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(formatDate(new Date(), 'iso'));
    const [endDate, setEndDate] = useState(formatDate(addDays(new Date(), 7), 'iso'));
    const [strategy, setStrategy] = useState<AssignmentStrategy>('sequential');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [preview, setPreview] = useState<SchedulePreview[]>([]);
    const [loading, setLoading] = useState(false);
    const [scheduling, setScheduling] = useState(false);

    useEffect(() => {
        // Fetch library workouts and groups
        const fetchData = async () => {
            const { data: libData } = await supabase.from('workout_library').select('*').order('title');
            const { data: groupsData } = await supabase.from('groups').select('id, name');
            setLibrary(libData || []);
            setGroups(groupsData || []);
        };
        fetchData();
    }, []);

    const handleWorkoutToggle = (workoutId: string) => {
        setSelectedWorkouts(prev =>
            prev.includes(workoutId)
                ? prev.filter(id => id !== workoutId)
                : [...prev, workoutId]
        );
    };

    const generatePreview = async () => {
        if (selectedWorkouts.length === 0) {
            alert('Please select at least one workout');
            return;
        }

        setLoading(true);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateRange = eachDayOfInterval({ start, end });

        // Get existing WODs for conflict detection
        const { data: existingWods } = await supabase
            .from('wods')
            .select('date')
            .gte('date', startDate)
            .lte('date', endDate);

        const existingDates = new Set((existingWods || []).map(w => w.date));

        // Generate schedule based on strategy
        const schedule: SchedulePreview[] = [];
        const selectedWorkoutObjects = library.filter(w => selectedWorkouts.includes(w.id));

        dateRange.forEach((date, index) => {
            const dateStr = formatDate(date, 'iso');
            let workout: LibraryWorkout;

            switch (strategy) {
                case 'sequential':
                    workout = selectedWorkoutObjects[index % selectedWorkoutObjects.length];
                    break;
                case 'random':
                    workout = selectedWorkoutObjects[Math.floor(Math.random() * selectedWorkoutObjects.length)];
                    break;
                case 'round-robin':
                    workout = selectedWorkoutObjects[index % selectedWorkoutObjects.length];
                    break;
                default:
                    workout = selectedWorkoutObjects[0];
            }

            schedule.push({
                date: dateStr,
                workout,
                exists: existingDates.has(dateStr),
                group_id: selectedGroup,
            });
        });

        setPreview(schedule);
        setLoading(false);
    };

    const handleBulkSchedule = async (overwrite: boolean = false) => {
        setScheduling(true);

        const toSchedule = overwrite ? preview : preview.filter(p => !p.exists);

        const wodEntries = toSchedule.map(p => ({
            date: p.date,
            title: p.workout.title,
            description: p.workout.description,
            type: p.workout.type,
            group_id: p.group_id,
            video_url: p.workout.video_url || null,
        }));

        const { error } = await supabase.from('wods').upsert(wodEntries, {
            onConflict: overwrite ? 'date,group_id' : undefined,
        });

        if (error) {
            alert('Error scheduling WODs: ' + error.message);
        } else {
            alert(`Successfully scheduled ${toSchedule.length} WODs!`);
            setPreview([]);
            setSelectedWorkouts([]);
        }

        setScheduling(false);
    };

    const conflictCount = preview.filter(p => p.exists).length;

    return (
        <section className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2 -z-10 group-hover:bg-purple-500/10 transition-colors duration-1000" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Sparkles className="h-7 w-7 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                            BULK <span className="text-purple-500">SCHEDULER</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Schedule Multiple Workouts</p>
                    </div>
                </div>
            </div>

            {/* Configuration Section */}
            <div className="bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] p-10 space-y-8 mb-8">
                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-6 py-4 text-zinc-900 font-black focus:outline-none focus:border-purple-500/30 focus:ring-8 focus:ring-purple-500/5 transition-all shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-6 py-4 text-zinc-900 font-black focus:outline-none focus:border-purple-500/30 focus:ring-8 focus:ring-purple-500/5 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Strategy & Group Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">How to Assign</label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value as AssignmentStrategy)}
                            className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-6 py-4 text-zinc-900 font-black uppercase text-xs focus:outline-none focus:border-purple-500/30 focus:ring-8 focus:ring-purple-500/5 appearance-none transition-all shadow-sm"
                        >
                            <option value="sequential">In Order (1,2,3...)</option>
                            <option value="random">Mix It Up (Random)</option>
                            <option value="round-robin">Rotate (1,2,3,1,2,3...)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Show to Squad</label>
                        <select
                            value={selectedGroup || ''}
                            onChange={(e) => setSelectedGroup(e.target.value || null)}
                            className="w-full bg-white border border-zinc-100 rounded-[1.25rem] px-6 py-4 text-zinc-900 font-black uppercase text-xs focus:outline-none focus:border-purple-500/30 focus:ring-8 focus:ring-purple-500/5 appearance-none transition-all shadow-sm"
                        >
                            <option value="">All Squads</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Workout Selection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Choose Workouts ({selectedWorkouts.length})</label>
                        {selectedWorkouts.length > 0 && (
                            <button
                                onClick={() => setSelectedWorkouts([])}
                                className="text-xs font-black text-red-500 hover:text-red-600 uppercase tracking-wider"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                        {library.map(workout => (
                            <button
                                key={workout.id}
                                onClick={() => handleWorkoutToggle(workout.id)}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left",
                                    selectedWorkouts.includes(workout.id)
                                        ? "bg-purple-50 border-purple-500 shadow-lg"
                                        : "bg-white border-zinc-100 hover:border-purple-200"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className="text-sm font-black text-zinc-900 uppercase leading-tight">{workout.title}</span>
                                    {selectedWorkouts.includes(workout.id) && (
                                        <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-black uppercase px-2 py-1 rounded-lg",
                                    workout.type === 'weekday' ? "bg-zinc-900 text-white" :
                                        workout.type === 'weekend' ? "bg-emerald-50 text-emerald-600" :
                                            "bg-purple-500 text-white"
                                )}>
                                    {workout.type}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Preview Button */}
                <button
                    onClick={generatePreview}
                    disabled={loading || selectedWorkouts.length === 0}
                    className="w-full bg-purple-600 text-white font-black italic text-xl py-6 rounded-[1.5rem] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-purple-500/20 font-heading uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    <Calendar className="h-6 w-6" />
                    {loading ? 'Generating...' : 'Preview Schedule'}
                </button>
            </div>

            {/* Preview Section */}
            {preview.length > 0 && (
                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase text-zinc-900 font-heading">Schedule Preview</h3>
                            <p className="text-xs text-zinc-400 font-black uppercase tracking-widest mt-1">
                                {preview.length} WODs • {conflictCount} Conflicts
                            </p>
                        </div>
                        <button
                            onClick={() => setPreview([])}
                            className="h-12 w-12 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {conflictCount > 0 && (
                        <div className="p-6 rounded-2xl bg-orange-50 border border-orange-200 flex items-start gap-4">
                            <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-black text-orange-900 uppercase text-sm mb-1">Dates Already Have Workouts</h4>
                                <p className="text-xs text-orange-700 font-medium">
                                    {conflictCount} date(s) already have workouts. Choose to skip or overwrite them.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                        {preview.map((item, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "p-4 rounded-2xl border flex items-center justify-between",
                                    item.exists ? "bg-orange-50 border-orange-200" : "bg-zinc-50 border-zinc-100"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center">
                                        <span className="text-xs font-black text-purple-600">{new Date(item.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black text-zinc-600">{formatDate(new Date(item.date), 'short')}</span>
                                            {item.exists && (
                                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-orange-200 text-orange-700">EXISTS</span>
                                            )}
                                        </div>
                                        <span className="text-base font-black uppercase text-zinc-900">{item.workout.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleBulkSchedule(false)}
                            disabled={scheduling || preview.every(p => p.exists)}
                            className="flex-1 bg-zinc-900 text-white font-black italic text-lg py-6 rounded-[1.5rem] hover:bg-black transition-all font-heading uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {scheduling ? 'SCHEDULING...' : `SCHEDULE ${preview.filter(p => !p.exists).length} NEW WODs`}
                        </button>
                        {conflictCount > 0 && (
                            <button
                                onClick={() => handleBulkSchedule(true)}
                                disabled={scheduling}
                                className="flex-1 bg-orange-600 text-white font-black italic text-lg py-6 rounded-[1.5rem] hover:bg-orange-700 transition-all font-heading uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {scheduling ? 'OVERWRITING...' : `OVERWRITE ALL ${preview.length}`}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
