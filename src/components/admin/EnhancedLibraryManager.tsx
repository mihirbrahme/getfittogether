'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, X, Trash2, Save, Edit2, Copy, Tag as TagIcon, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Exercise, WorkoutTemplate, PREDEFINED_TAGS } from './library/types';
import ExerciseFormRow from './library/ExerciseFormRow';
import BulkExerciseImport from './library/BulkExerciseImport';

export default function EnhancedLibraryManager() {
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [showBulkImport, setShowBulkImport] = useState(false);

    const [formData, setFormData] = useState<WorkoutTemplate>({
        name: '',
        description: '',
        type: 'weekday',
        tags: [],
        exercises: []
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data: templatesData } = await supabase
            .from('workout_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (templatesData) {
            // Fetch exercises for each template
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
        setLoading(false);
    };

    const handleSaveTemplate = async () => {
        if (!formData.name.trim() || formData.exercises!.length === 0) {
            alert('Please add a workout name and at least one exercise');
            return;
        }

        try {
            if (editingTemplate?.id) {
                // Update existing template
                const { error: templateError } = await supabase
                    .from('workout_templates')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        type: formData.type,
                        tags: formData.tags
                    })
                    .eq('id', editingTemplate.id);

                if (templateError) throw templateError;

                // Delete old exercises
                await supabase
                    .from('workout_exercises')
                    .delete()
                    .eq('template_id', editingTemplate.id);

                // Insert new exercises
                const exercisesToInsert = formData.exercises!.map((ex, index) => ({
                    template_id: editingTemplate.id,
                    order_index: index + 1,
                    exercise_name: ex.exercise_name,
                    sets: ex.sets,
                    reps: ex.reps,
                    duration_seconds: ex.duration_seconds,
                    rest_seconds: ex.rest_seconds,
                    equipment: ex.equipment,
                    video_url: ex.video_url,
                    notes: ex.notes
                }));

                const { error: exercisesError } = await supabase
                    .from('workout_exercises')
                    .insert(exercisesToInsert);

                if (exercisesError) throw exercisesError;

            } else {
                // Create new template
                const { data: newTemplate, error: templateError } = await supabase
                    .from('workout_templates')
                    .insert({
                        name: formData.name,
                        description: formData.description,
                        type: formData.type,
                        tags: formData.tags
                    })
                    .select()
                    .single();

                if (templateError) throw templateError;

                // Insert exercises
                const exercisesToInsert = formData.exercises!.map((ex, index) => ({
                    template_id: newTemplate.id,
                    order_index: index + 1,
                    exercise_name: ex.exercise_name,
                    sets: ex.sets,
                    reps: ex.reps,
                    duration_seconds: ex.duration_seconds,
                    rest_seconds: ex.rest_seconds,
                    equipment: ex.equipment,
                    video_url: ex.video_url,
                    notes: ex.notes
                }));

                const { error: exercisesError } = await supabase
                    .from('workout_exercises')
                    .insert(exercisesToInsert);

                if (exercisesError) throw exercisesError;
            }

            // Reset form and refresh
            resetForm();
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save workout template');
        }
    };

    const handleEditTemplate = (template: WorkoutTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description,
            type: template.type,
            tags: template.tags || [],
            exercises: template.exercises || []
        });
        setIsEditing(true);
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workout template?')) return;

        const { error } = await supabase
            .from('workout_templates')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchTemplates();
        }
    };

    const handleDuplicateTemplate = (template: WorkoutTemplate) => {
        setFormData({
            name: `${template.name} (Copy)`,
            description: template.description,
            type: template.type,
            tags: template.tags || [],
            exercises: template.exercises || []
        });
        setEditingTemplate(null);
        setIsEditing(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'weekday',
            tags: [],
            exercises: []
        });
        setIsEditing(false);
        setEditingTemplate(null);
    };

    const addExercise = () => {
        setFormData({
            ...formData,
            exercises: [
                ...(formData.exercises || []),
                {
                    order_index: (formData.exercises?.length || 0) + 1,
                    exercise_name: '',
                    sets: 3,
                    reps: 10,
                    duration_seconds: null,
                    rest_seconds: 60,
                    equipment: '',
                    video_url: '',
                    notes: ''
                }
            ]
        });
    };

    const updateExercise = (index: number, field: keyof Exercise, value: any) => {
        const updatedExercises = [...(formData.exercises || [])];
        updatedExercises[index] = { ...updatedExercises[index], [field]: value };
        setFormData({ ...formData, exercises: updatedExercises });
    };

    const deleteExercise = (index: number) => {
        const updatedExercises = formData.exercises!.filter((_, i) => i !== index);
        setFormData({ ...formData, exercises: updatedExercises });
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const exercises = [...formData.exercises!];
        const draggedExercise = exercises[draggedIndex];
        exercises.splice(draggedIndex, 1);
        exercises.splice(index, 0, draggedExercise);

        setFormData({ ...formData, exercises });
        setDraggedIndex(index);
    };

    const toggleTag = (tag: string) => {
        if (formData.tags.includes(tag)) {
            setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
        } else {
            setFormData({ ...formData, tags: [...formData.tags, tag] });
        }
    };

    const handleBulkImport = (exercises: Exercise[]) => {
        setFormData({
            ...formData,
            exercises: [...(formData.exercises || []), ...exercises]
        });
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-[#FF5E00] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">
                        WOD <span className="text-[#FF5E00]">Library</span>
                    </h2>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mt-1">
                        Create & Manage Workout Templates
                    </p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 bg-[#FF5E00] text-white rounded-xl font-black uppercase text-sm hover:bg-orange-600 transition-all flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Create Workout
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Filters & Search */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="premium-card rounded-[2rem] p-6">
                            <h3 className="text-sm font-black uppercase text-zinc-600 mb-4">Search</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Find workout..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-[#FF5E00] focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="premium-card rounded-[2rem] p-6">
                            <h3 className="text-sm font-black uppercase text-zinc-600 mb-4 flex items-center gap-2">
                                <TagIcon className="h-4 w-4" />
                                Filter by Tags
                            </h3>
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

                    {/* Right: Workout List */}
                    <div className="lg:col-span-2 space-y-4">
                        {filteredTemplates.length === 0 ? (
                            <div className="premium-card rounded-[2rem] p-12 text-center">
                                <p className="text-zinc-400 font-black uppercase text-sm">
                                    {searchQuery || selectedTags.length > 0
                                        ? 'No workouts match your filters'
                                        : 'No workouts yet. Create your first workout!'}
                                </p>
                            </div>
                        ) : (
                            filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="premium-card rounded-[2rem] p-6 hover:scale-[1.02] transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h4 className="text-xl font-black uppercase text-zinc-900 mb-2">
                                                {template.name}
                                            </h4>
                                            {template.description && (
                                                <p className="text-sm text-zinc-600 mb-3">{template.description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-xs font-black uppercase",
                                                    template.type === 'weekday' && "bg-zinc-900 text-white",
                                                    template.type === 'weekend' && "bg-emerald-500 text-white",
                                                    template.type === 'event' && "bg-purple-500 text-white"
                                                )}>
                                                    {template.type}
                                                </span>
                                                {template.tags?.map(tag => (
                                                    <span key={tag} className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-orange-50 text-orange-600">
                                                        {tag}
                                                    </span>
                                                ))}
                                                <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-blue-50 text-blue-600">
                                                    {template.exercises?.length || 0} Exercises
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEditTemplate(template)}
                                                className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center"
                                                title="Edit"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicateTemplate(template)}
                                                className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center"
                                                title="Duplicate"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id!)}
                                                className="h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center justify-center"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                // Exercise Builder View
                <div className="premium-card rounded-[3rem] p-10">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black italic uppercase text-zinc-900">
                            {editingTemplate ? 'Edit' : 'Create'} Workout
                        </h3>
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all font-black uppercase text-xs flex items-center gap-2"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Workout Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-zinc-600 mb-2">
                                    Workout Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Day 1: Full Body Blast"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-[#FF5E00] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-zinc-600 mb-2">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-[#FF5E00] focus:outline-none"
                                >
                                    <option value="weekday">Weekday</option>
                                    <option value="weekend">Weekend</option>
                                    <option value="event">Event</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-zinc-600 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the workout..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-[#FF5E00] focus:outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-zinc-600 mb-3">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PREDEFINED_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all",
                                            formData.tags.includes(tag)
                                                ? "bg-[#FF5E00] text-white"
                                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Exercises */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-black uppercase text-zinc-600">
                                    Exercises ({formData.exercises?.length || 0})
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowBulkImport(true)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl font-black uppercase text-xs hover:bg-blue-600 transition-all flex items-center gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Import Exercises
                                    </button>
                                    <button
                                        onClick={addExercise}
                                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs hover:bg-emerald-600 transition-all flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Exercise
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {formData.exercises?.map((exercise, index) => (
                                    <ExerciseFormRow
                                        key={index}
                                        exercise={exercise}
                                        index={index}
                                        onUpdate={updateExercise}
                                        onDelete={deleteExercise}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDragEnd={() => setDraggedIndex(null)}
                                    />
                                ))}

                                {formData.exercises?.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-2xl">
                                        <p className="text-zinc-400 font-black uppercase text-sm">
                                            No exercises yet. Click "Add Exercise" to begin.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex gap-4 pt-6 border-t border-zinc-200">
                            <button
                                onClick={handleSaveTemplate}
                                className="flex-1 bg-[#FF5E00] text-white py-4 rounded-xl font-black uppercase text-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="h-5 w-5" />
                                Save Workout Template
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-8 py-4 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all font-black uppercase text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Exercise Import Modal */}
            <BulkExerciseImport
                isOpen={showBulkImport}
                onClose={() => setShowBulkImport(false)}
                onImport={handleBulkImport}
                startingIndex={formData.exercises?.length || 0}
            />
        </div>
    );
}
