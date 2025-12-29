'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Check, X, Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
    id: string;
    goal_name: string;
    active: boolean;
    created_at: string;
}

export default function GoalsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newGoalName, setNewGoalName] = useState('');
    const [editGoalName, setEditGoalName] = useState('');

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth?mode=login');
            return;
        }

        const { data, error } = await supabase
            .from('user_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setGoals(data);
        }
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newGoalName.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('user_goals')
            .insert({
                user_id: user.id,
                goal_name: newGoalName.trim(),
                active: true
            });

        if (!error) {
            setNewGoalName('');
            setIsAdding(false);
            fetchGoals();
        } else {
            alert('Error adding goal: ' + error.message);
        }
    };

    const handleEdit = async (goalId: string) => {
        if (!editGoalName.trim()) return;

        const { error } = await supabase
            .from('user_goals')
            .update({ goal_name: editGoalName.trim() })
            .eq('id', goalId);

        if (!error) {
            setEditingId(null);
            setEditGoalName('');
            fetchGoals();
        } else {
            alert('Error updating goal: ' + error.message);
        }
    };

    const handleToggleActive = async (goalId: string, currentActive: boolean) => {
        const { error } = await supabase
            .from('user_goals')
            .update({ active: !currentActive })
            .eq('id', goalId);

        if (!error) {
            fetchGoals();
        }
    };

    const handleDelete = async (goalId: string) => {
        if (!confirm('Are you sure you want to delete this goal?')) return;

        const { error } = await supabase
            .from('user_goals')
            .delete()
            .eq('id', goalId);

        if (!error) {
            fetchGoals();
        } else {
            alert('Error deleting goal: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
            </div>
        );
    }

    const activeGoals = goals.filter(g => g.active);
    const inactiveGoals = goals.filter(g => !g.active);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">
                        Personal <span className="text-[#FF5E00]">Goals</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        Manage your custom daily targets
                    </p>
                </div>
                <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-[#FF5E00]" />
                </div>
            </div>

            {/* Add New Goal */}
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full bg-gradient-to-br from-[#FF5E00] to-orange-600 text-white p-6 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase tracking-tight text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#FF5E00]/20"
                >
                    <Plus className="h-6 w-6" />
                    Add New Goal
                </button>
            ) : (
                <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-4">NEW GOAL</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="e.g., No Sugar, Read 20 pages, Meditate..."
                            value={newGoalName}
                            onChange={(e) => setNewGoalName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                            autoFocus
                            maxLength={50}
                            className="flex-1 px-6 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#FF5E00] focus:ring-4 focus:ring-[#FF5E00]/10 font-medium"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newGoalName.trim()}
                            className="px-8 py-4 bg-[#FF5E00] text-white rounded-xl font-black uppercase text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setNewGoalName('');
                            }}
                            className="px-8 py-4 bg-zinc-100 text-zinc-600 rounded-xl font-black uppercase text-sm hover:bg-zinc-200 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-3 font-medium">
                        💡 This goal will appear in your daily check-in and is worth <span className="font-black text-[#FF5E00]">+5 points</span>
                    </p>
                </div>
            )}

            {/* Active Goals */}
            {activeGoals.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">ACTIVE GOALS ({activeGoals.length})</h3>
                    {activeGoals.map((goal) => (
                        <div key={goal.id} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:border-zinc-200 transition-colors">
                            {editingId === goal.id ? (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={editGoalName}
                                        onChange={(e) => setEditGoalName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleEdit(goal.id)}
                                        autoFocus
                                        maxLength={50}
                                        className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#FF5E00] font-medium"
                                    />
                                    <button
                                        onClick={() => handleEdit(goal.id)}
                                        className="h-10 w-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                                    >
                                        <Check className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingId(null);
                                            setEditGoalName('');
                                        }}
                                        className="h-10 w-10 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center hover:bg-zinc-200 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                            <Check className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-zinc-900 uppercase text-lg">{goal.goal_name}</h4>
                                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                +5 PTS DAILY
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingId(goal.id);
                                                setEditGoalName(goal.goal_name);
                                            }}
                                            className="h-10 w-10 rounded-lg bg-zinc-50 text-zinc-600 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(goal.id, goal.active)}
                                            className="h-10 px-4 rounded-lg bg-zinc-50 text-zinc-600 flex items-center gap-2 hover:bg-zinc-100 transition-colors text-xs font-bold uppercase"
                                            title="Deactivate"
                                        >
                                            Pause
                                        </button>
                                        <button
                                            onClick={() => handleDelete(goal.id)}
                                            className="h-10 w-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Inactive Goals */}
            {inactiveGoals.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">PAUSED GOALS ({inactiveGoals.length})</h3>
                    {inactiveGoals.map((goal) => (
                        <div key={goal.id} className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-200 opacity-60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                        <X className="h-6 w-6 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-600 uppercase">{goal.goal_name}</h4>
                                        <span className="text-xs font-black text-zinc-400">PAUSED</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleActive(goal.id, goal.active)}
                                        className="h-10 px-4 rounded-lg bg-emerald-500 text-white flex items-center gap-2 hover:bg-emerald-600 transition-colors text-xs font-bold uppercase"
                                    >
                                        Activate
                                    </button>
                                    <button
                                        onClick={() => handleDelete(goal.id)}
                                        className="h-10 w-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {goals.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-zinc-200">
                    <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="h-8 w-8 text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-400 uppercase mb-2">No Goals Yet</h3>
                    <p className="text-sm text-zinc-400 font-medium">
                        Click "Add New Goal" to create your first personal target
                    </p>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="text-xs font-black uppercase text-blue-900 mb-2 flex items-center gap-2">
                    <span>ℹ️</span> HOW IT WORKS
                </h4>
                <ul className="text-sm text-blue-800 space-y-2 font-medium">
                    <li>• Each active goal appears in your daily check-in</li>
                    <li>• Successfully completing a goal earns you <span className="font-black">+5 points</span></li>
                    <li>• You can have multiple goals active at once</li>
                    <li>• Pause goals temporarily without deleting them</li>
                    <li>• Edit goal names anytime to keep them relevant</li>
                </ul>
            </div>
        </div>
    );
}
