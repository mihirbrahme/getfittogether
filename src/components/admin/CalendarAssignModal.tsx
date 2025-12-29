'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Search, Tag as TagIcon, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Exercise {
    id: string;
    order_index: number;
    exercise_name: string;
    sets: number | null;
    reps: number | null;
    duration_seconds: number | null;
    rest_seconds: number;
    equipment: string;
    video_url: string;
    notes: string;
}

interface WorkoutTemplate {
    id: string;
    name: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
    tags: string[];
    exercises?: Exercise[];
}

interface Group {
    id: string;
    name: string;
}

interface CalendarAssignModalProps {
    date: string;
    onClose: () => void;
    onAssign: () => void;
    editingWorkoutId?: string | null;
}

const PREDEFINED_TAGS = [
    'Beginner', 'Intermediate', 'Advanced',
    'Upper Body', 'Lower Body', 'Core', 'Full Body',
    'Strength', 'Cardio', 'HIIT', 'Recovery', 'Flexibility'
];

export default function CalendarAssignModal({ date, onClose, onAssign, editingWorkoutId }: CalendarAssignModalProps) {
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
    const [selectedSquads, setSelectedSquads] = useState<string[]>([]);
    const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Fetch templates
        const { data: templatesData } = await supabase
            .from('workout_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (templatesData) {
            const templatesWithExercises = await Promise.all(
                templatesData.map(async (template) => {
                    const { data: exercises } = await supabase
                        .from('workout_exercises')
                        .select('*')
                        .eq('template_id', template.id)
                        .order('order_index');

                    return { ...template, exercises: exercises || [] };
                })
            );
            setTemplates(templatesWithExercises);
        }

        // Fetch squads
        const { data: groupsData } = await supabase
            .from('groups')
            .select('id, name')
            .order('name');

        setGroups(groupsData || []);
        setLoading(false);
    };

    const handleAssign = async () => {
        if (!selectedTemplate || selectedSquads.length === 0) {
            alert('Please select a workout and at least one squad');
            return;
        }

        setAssigning(true);

        try {
            // Create scheduled workout
            const { data: scheduledWorkout, error: workoutError } = await supabase
                .from('scheduled_workouts')
                .insert({
                    template_id: selectedTemplate.id,
                    date: date,
                    customized: false
                })
                .select()
                .single();

            if (workoutError) throw workoutError;

            // Assign to squads
            const squadAssignments = selectedSquads.map(squadId => ({
                workout_id: scheduledWorkout.id,
                group_id: squadId
            }));

            const { error: assignError } = await supabase
                .from('scheduled_workout_squads')
                .insert(squadAssignments);

            if (assignError) throw assignError;

            onAssign();
            onClose();
        } catch (error) {
            console.error('Error assigning workout:', error);
            alert('Failed to assign workout');
        } finally {
            setAssigning(false);
        }
    };

    const toggleSquad = (squadId: string) => {
        if (selectedSquads.includes(squadId)) {
            setSelectedSquads(selectedSquads.filter(id => id !== squadId));
        } else {
            setSelectedSquads([...selectedSquads, squadId]);
        }
    };

    const toggleFilterTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // Filter templates
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => template.tags?.includes(tag));
        return matchesSearch && matchesTags;
    });

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-zinc-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase text-zinc-900 tracking-tighter">
                            Assign Workout
                        </h2>
                        <p className="text-sm text-zinc-500 font-semibold mt-1">
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-12 w-12 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-12 w-12 text-[#FF5E00] animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Search & Filter */}
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search workouts..."
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-[#FF5E00] focus:outline-none text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-zinc-500 mb-2 flex items-center gap-2">
                                        <TagIcon className="h-3 w-3" />
                                        Filter by Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PREDEFINED_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleFilterTag(tag)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all",
                                                    selectedTags.includes(tag)
                                                        ? "bg-[#FF5E00] text-white"
                                                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                                )}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Workout List */}
                            <div className="space-y-3">
                                <label className="block text-xs font-black uppercase text-zinc-500">
                                    Select Workout ({filteredTemplates.length} available)
                                </label>
                                {filteredTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        className={cn(
                                            "border-2 rounded-2xl overflow-hidden transition-all cursor-pointer",
                                            selectedTemplate?.id === template.id
                                                ? "border-[#FF5E00] bg-orange-50"
                                                : "border-zinc-200 hover:border-zinc-300"
                                        )}
                                    >
                                        <button
                                            onClick={() => setSelectedTemplate(template)}
                                            className="w-full p-4 text-left flex items-start justify-between"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-black uppercase text-zinc-900 mb-2 text-sm">
                                                    {template.name}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded text-xs font-black uppercase",
                                                        template.type === 'weekday' && "bg-zinc-900 text-white",
                                                        template.type === 'weekend' && "bg-emerald-500 text-white",
                                                        template.type === 'event' && "bg-purple-500 text-white"
                                                    )}>
                                                        {template.type}
                                                    </span>
                                                    {template.tags?.slice(0, 2).map(tag => (
                                                        <span key={tag} className="px-2 py-1 rounded text-xs font-black uppercase bg-zinc-100 text-zinc-600">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    <span className="px-2 py-1 rounded text-xs font-black uppercase bg-blue-50 text-blue-600">
                                                        {template.exercises?.length || 0} exercises
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                {selectedTemplate?.id === template.id && (
                                                    <div className="h-6 w-6 rounded-full bg-[#FF5E00] flex items-center justify-center">
                                                        <Check className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedTemplate(expandedTemplate === template.id ? null : template.id);
                                                    }}
                                                    className="text-zinc-400 hover:text-zinc-600"
                                                >
                                                    {expandedTemplate === template.id ? (
                                                        <ChevronUp className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </button>

                                        {/* Expanded Exercise List */}
                                        {expandedTemplate === template.id && (
                                            <div className="px-4 pb-4 space-y-2 bg-white">
                                                <p className="text-xs font-black uppercase text-zinc-500 mb-2">Exercises:</p>
                                                {template.exercises?.map((ex, idx) => (
                                                    <div key={ex.id} className="flex items-start gap-3 text-xs">
                                                        <span className="font-black text-zinc-400">{idx + 1}.</span>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-zinc-900">{ex.exercise_name}</p>
                                                            <p className="text-zinc-500">
                                                                {ex.sets && `${ex.sets} sets × `}
                                                                {ex.reps ? `${ex.reps} reps` : ex.duration_seconds ? `${ex.duration_seconds}s` : ''}
                                                                {ex.rest_seconds && ` • ${ex.rest_seconds}s rest`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Squad Selection */}
                            <div className="space-y-3">
                                <label className="block text-xs font-black uppercase text-zinc-500">
                                    Assign to Squads *
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {groups.map(group => (
                                        <button
                                            key={group.id}
                                            onClick={() => toggleSquad(group.id)}
                                            className={cn(
                                                "p-4 rounded-xl border-2 text-left font-black uppercase text-sm transition-all flex items-center gap-3",
                                                selectedSquads.includes(group.id)
                                                    ? "border-[#FF5E00] bg-orange-50"
                                                    : "border-zinc-200 hover:border-zinc-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                                                selectedSquads.includes(group.id)
                                                    ? "border-[#FF5E00] bg-[#FF5E00]"
                                                    : "border-zinc-300"
                                            )}>
                                                {selectedSquads.includes(group.id) && (
                                                    <Check className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                            {group.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-zinc-100 flex gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all font-black uppercase text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedTemplate || selectedSquads.length === 0 || assigning}
                        className="flex-1 bg-[#FF5E00] text-white py-4 rounded-xl font-black uppercase text-sm hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {assigning ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            'Assign Workout'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
