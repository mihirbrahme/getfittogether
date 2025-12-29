'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GripVertical, Plus, RotateCcw, Save, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckInActivity {
    id: string;
    squad_id: string;
    activity_name: string;
    activity_type: 'wod' | 'core_habit' | 'custom';
    activity_key: string;
    points: number;
    enabled: boolean;
    display_order: number;
    icon: string;
    description: string;
}

interface ActivityConfigProps {
    squadId: string;
    squadName: string;
}

const ICON_OPTIONS = [
    'Dumbbell', 'Footprints', 'Apple', 'Moon', 'Droplet', 'Heart',
    'Flame', 'Zap', 'Target', 'TrendingUp', 'Activity', 'CheckCircle'
];

export default function ActivityConfiguration({ squadId, squadName }: ActivityConfigProps) {
    const [activities, setActivities] = useState<CheckInActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customActivity, setCustomActivity] = useState({
        activity_name: '',
        activity_key: '',
        points: 10,
        icon: 'CheckCircle',
        description: ''
    });

    useEffect(() => {
        fetchActivities();
    }, [squadId]);

    const fetchActivities = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('squad_checkin_activities')
            .select('*')
            .eq('squad_id', squadId)
            .order('display_order');

        setActivities(data || []);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update all activities
            const updates = activities.map((activity, index) => ({
                ...activity,
                display_order: index + 1
            }));

            for (const activity of updates) {
                await supabase
                    .from('squad_checkin_activities')
                    .update({
                        activity_name: activity.activity_name,
                        points: activity.points,
                        enabled: activity.enabled,
                        display_order: activity.display_order,
                        icon: activity.icon,
                        description: activity.description
                    })
                    .eq('id', activity.id);
            }

            alert('Activities saved successfully!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Failed to save activities');
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefaults = async () => {
        if (!confirm('Reset all activities to global defaults? This will remove custom activities.')) return;

        try {
            // Delete current activities
            await supabase
                .from('squad_checkin_activities')
                .delete()
                .eq('squad_id', squadId);

            // Copy from global defaults
            const { data: defaults } = await supabase
                .from('squad_checkin_activities')
                .select('*')
                .is('squad_id', null);

            if (defaults) {
                const newActivities = defaults.map(def => ({
                    squad_id: squadId,
                    activity_name: def.activity_name,
                    activity_type: def.activity_type,
                    activity_key: def.activity_key,
                    points: def.points,
                    enabled: def.enabled,
                    display_order: def.display_order,
                    icon: def.icon,
                    description: def.description
                }));

                await supabase
                    .from('squad_checkin_activities')
                    .insert(newActivities);
            }

            fetchActivities();
            alert('Reset to defaults complete!');
        } catch (error) {
            console.error('Error resetting:', error);
            alert('Failed to reset');
        }
    };

    const handleAddCustom = async () => {
        if (!customActivity.activity_name || !customActivity.activity_key) {
            alert('Please fill in activity name and key');
            return;
        }

        try {
            await supabase
                .from('squad_checkin_activities')
                .insert({
                    squad_id: squadId,
                    activity_name: customActivity.activity_name,
                    activity_type: 'custom',
                    activity_key: customActivity.activity_key.toLowerCase().replace(/\s+/g, '_'),
                    points: customActivity.points,
                    enabled: true,
                    display_order: activities.length + 1,
                    icon: customActivity.icon,
                    description: customActivity.description
                });

            setIsAddingCustom(false);
            setCustomActivity({
                activity_name: '',
                activity_key: '',
                points: 10,
                icon: 'CheckCircle',
                description: ''
            });
            fetchActivities();
        } catch (error) {
            console.error('Error adding custom activity:', error);
            alert('Failed to add activity');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this activity?')) return;

        await supabase
            .from('squad_checkin_activities')
            .delete()
            .eq('id', id);

        fetchActivities();
    };

    const updateActivity = (index: number, field: keyof CheckInActivity, value: any) => {
        const updated = [...activities];
        updated[index] = { ...updated[index], [field]: value };
        setActivities(updated);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const items = [...activities];
        const draggedItem = items[draggedIndex];
        items.splice(draggedIndex, 1);
        items.splice(index, 0, draggedItem);

        setActivities(items);
        setDraggedIndex(index);
    };

    if (loading) {
        return <div className="text-center py-8 text-zinc-400">Loading activities...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black uppercase text-zinc-900">Check-In Activities</h3>
                    <p className="text-xs text-zinc-500">Configure daily activities and points for {squadName}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleResetToDefaults}
                        className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all font-bold text-xs uppercase flex items-center gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-[#FF5E00] text-white hover:bg-orange-600 transition-all font-bold text-xs uppercase flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Activities List */}
            <div className="space-y-3">
                {activities.map((activity, index) => (
                    <div
                        key={activity.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={() => setDraggedIndex(null)}
                        className="bg-white border-2 border-zinc-200 rounded-xl p-4 cursor-move hover:border-[#FF5E00] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-zinc-400" />

                            <button
                                onClick={() => updateActivity(index, 'enabled', !activity.enabled)}
                                className={cn(
                                    "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                    activity.enabled
                                        ? "bg-emerald-500 border-emerald-500"
                                        : "border-zinc-300"
                                )}
                            >
                                {activity.enabled && <CheckCircle className="h-4 w-4 text-white" />}
                            </button>

                            <div className="flex-1 grid grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    value={activity.activity_name}
                                    onChange={(e) => updateActivity(index, 'activity_name', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm font-semibold"
                                    placeholder="Activity name"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={activity.points}
                                        onChange={(e) => updateActivity(index, 'points', parseInt(e.target.value))}
                                        className="w-20 px-3 py-2 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm font-bold text-center"
                                    />
                                    <span className="text-xs font-bold text-zinc-500">POINTS</span>
                                </div>
                                <select
                                    value={activity.icon}
                                    onChange={(e) => updateActivity(index, 'icon', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm"
                                >
                                    {ICON_OPTIONS.map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                </select>
                            </div>

                            {activity.activity_type === 'custom' && (
                                <button
                                    onClick={() => handleDelete(activity.id)}
                                    className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center justify-center"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Custom Activity */}
            {isAddingCustom ? (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="font-black text-sm uppercase text-blue-900 mb-3">New Custom Activity</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            value={customActivity.activity_name}
                            onChange={(e) => setCustomActivity({ ...customActivity, activity_name: e.target.value })}
                            placeholder="Activity name (e.g., Meditation)"
                            className="px-3 py-2 rounded-lg border border-blue-300 focus:border-blue-500 focus:outline-none text-sm"
                        />
                        <input
                            type="text"
                            value={customActivity.activity_key}
                            onChange={(e) => setCustomActivity({ ...customActivity, activity_key: e.target.value })}
                            placeholder="Key (e.g., meditation)"
                            className="px-3 py-2 rounded-lg border border-blue-300 focus:border-blue-500 focus:outline-none text-sm"
                        />
                        <input
                            type="number"
                            value={customActivity.points}
                            onChange={(e) => setCustomActivity({ ...customActivity, points: parseInt(e.target.value) })}
                            className="px-3 py-2 rounded-lg border border-blue-300 focus:border-blue-500 focus:outline-none text-sm"
                        />
                        <select
                            value={customActivity.icon}
                            onChange={(e) => setCustomActivity({ ...customActivity, icon: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-blue-300 focus:border-blue-500 focus:outline-none text-sm"
                        >
                            {ICON_OPTIONS.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddCustom}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-blue-700"
                        >
                            Add Activity
                        </button>
                        <button
                            onClick={() => setIsAddingCustom(false)}
                            className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg font-bold text-xs uppercase hover:bg-zinc-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAddingCustom(true)}
                    className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-500 hover:border-[#FF5E00] hover:text-[#FF5E00] transition-all font-bold text-sm uppercase flex items-center justify-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Add Custom Activity
                </button>
            )}
        </div>
    );
}
