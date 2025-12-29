'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Plus, Save, Edit2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    points: number;
}

interface Member {
    id: string;
    full_name: string;
    goal1?: string; // template_id
    goal2?: string; // template_id
}

interface MemberGoalAssignmentProps {
    squadId: string;
    squadName: string;
}

export default function MemberGoalAssignment({ squadId, squadName }: MemberGoalAssignmentProps) {
    const [templates, setTemplates] = useState<GoalTemplate[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        category: 'wellness',
        points: 5
    });

    useEffect(() => {
        fetchData();
    }, [squadId]);

    const fetchData = async () => {
        setLoading(true);

        // Fetch goal templates
        const { data: templatesData } = await supabase
            .from('goal_templates')
            .select('*')
            .eq('is_global', true)
            .order('category, name');

        setTemplates(templatesData || []);

        // Fetch squad members
        const { data: membersData } = await supabase
            .from('group_members')
            .select(`
                user_id,
                profiles!inner (
                    id,
                    full_name
                )
            `)
            .eq('group_id', squadId)
            .eq('status', 'approved');

        if (membersData) {
            // Fetch goals for each member
            const membersWithGoals = await Promise.all(
                membersData.map(async (m: any) => {
                    const userId = m.user_id;
                    const { data: goals } = await supabase
                        .from('user_goal_assignments')
                        .select('slot, goal_template_id')
                        .eq('user_id', userId);

                    const goal1 = goals?.find(g => g.slot === 1)?.goal_template_id;
                    const goal2 = goals?.find(g => g.slot === 2)?.goal_template_id;

                    return {
                        id: userId,
                        full_name: m.profiles.full_name,
                        goal1,
                        goal2
                    };
                })
            );

            setMembers(membersWithGoals);
        }

        setLoading(false);
    };

    const handleSaveGoals = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            for (const member of members) {
                // Delete existing assignments
                await supabase
                    .from('user_goal_assignments')
                    .delete()
                    .eq('user_id', member.id);

                // Insert new assignments
                const assignments = [];
                if (member.goal1) {
                    assignments.push({
                        user_id: member.id,
                        goal_template_id: member.goal1,
                        slot: 1,
                        assigned_by: user.id
                    });
                }
                if (member.goal2) {
                    assignments.push({
                        user_id: member.id,
                        goal_template_id: member.goal2,
                        slot: 2,
                        assigned_by: user.id
                    });
                }

                if (assignments.length > 0) {
                    await supabase
                        .from('user_goal_assignments')
                        .insert(assignments);
                }
            }

            alert('Goals saved successfully!');
        } catch (error) {
            console.error('Error saving goals:', error);
            alert('Failed to save goals');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.name) {
            alert('Please enter a goal name');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('goal_templates')
                .insert({
                    name: newTemplate.name,
                    description: newTemplate.description,
                    category: newTemplate.category,
                    points: newTemplate.points,
                    is_global: true,
                    created_by: user.id
                });

            setIsCreatingTemplate(false);
            setNewTemplate({
                name: '',
                description: '',
                category: 'wellness',
                points: 5
            });
            fetchData();
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Failed to create goal template');
        }
    };

    const updateMemberGoal = (memberId: string, slot: 1 | 2, templateId: string) => {
        setMembers(members.map(m =>
            m.id === memberId
                ? { ...m, [slot === 1 ? 'goal1' : 'goal2']: templateId || undefined }
                : m
        ));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-[#FF5E00] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black uppercase text-zinc-900">Member Goals</h3>
                    <p className="text-xs text-zinc-500">Assign 2 personal goals to each member of {squadName}</p>
                </div>
                <button
                    onClick={handleSaveGoals}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-[#FF5E00] text-white hover:bg-orange-600 transition-all font-bold text-xs uppercase flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save All'}
                </button>
            </div>

            {/* Goal Template Creation */}
            {isCreatingTemplate ? (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                    <h4 className="font-black text-sm uppercase text-purple-900 mb-3">Create New Goal Template</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                            placeholder="Goal name (e.g., Daily reading)"
                            className="px-3 py-2 rounded-lg border border-purple-300 focus:border-purple-500 focus:outline-none text-sm"
                        />
                        <select
                            value={newTemplate.category}
                            onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-purple-300 focus:border-purple-500 focus:outline-none text-sm"
                        >
                            <option value="fitness">Fitness</option>
                            <option value="nutrition">Nutrition</option>
                            <option value="wellness">Wellness</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="custom">Custom</option>
                        </select>
                        <input
                            type="text"
                            value={newTemplate.description}
                            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                            placeholder="Description (optional)"
                            className="col-span-2 px-3 py-2 rounded-lg border border-purple-300 focus:border-purple-500 focus:outline-none text-sm"
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={newTemplate.points}
                                onChange={(e) => setNewTemplate({ ...newTemplate, points: parseInt(e.target.value) })}
                                className="w-20 px-3 py-2 rounded-lg border border-purple-300 focus:border-purple-500 focus:outline-none text-sm"
                            />
                            <span className="text-xs font-bold text-zinc-500">POINTS</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateTemplate}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-purple-700"
                        >
                            Create Template
                        </button>
                        <button
                            onClick={() => setIsCreatingTemplate(false)}
                            className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg font-bold text-xs uppercase hover:bg-zinc-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsCreatingTemplate(true)}
                    className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-500 hover:border-purple-500 hover:text-purple-500 transition-all font-bold text-sm uppercase flex items-center justify-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Create Goal Template
                </button>
            )}

            {/* Member Goal Assignments */}
            <div className="space-y-3">
                {members.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 rounded-xl">
                        <p className="text-zinc-400 font-bold text-sm uppercase">No approved members in this squad</p>
                    </div>
                ) : (
                    members.map(member => (
                        <div key={member.id} className="bg-white border-2 border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-black text-sm">
                                    {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-black text-sm text-zinc-900 mb-2">{member.full_name}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-zinc-500 mb-1">Goal 1</label>
                                            <select
                                                value={member.goal1 || ''}
                                                onChange={(e) => updateMemberGoal(member.id, 1, e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm"
                                            >
                                                <option value="">Select goal...</option>
                                                {templates.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.name} ({t.points} pts)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase text-zinc-500 mb-1">Goal 2</label>
                                            <select
                                                value={member.goal2 || ''}
                                                onChange={(e) => updateMemberGoal(member.id, 2, e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm"
                                            >
                                                <option value="">Select goal...</option>
                                                {templates.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.name} ({t.points} pts)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Available Templates Reference */}
            <details className="bg-zinc-50 rounded-xl p-4">
                <summary className="font-black text-xs uppercase text-zinc-600 cursor-pointer">
                    View Available Goal Templates ({templates.length})
                </summary>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white border border-zinc-200 rounded-lg p-2">
                            <p className="text-xs font-bold text-zinc-900">{t.name}</p>
                            <p className="text-xs text-zinc-500">{t.category} • {t.points} pts</p>
                        </div>
                    ))}
                </div>
            </details>
        </div>
    );
}
