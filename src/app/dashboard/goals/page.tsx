'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Target, Loader2, Info } from 'lucide-react';

interface AssignedGoal {
    slot: number;
    assigned_at: string;
    goal_templates: {
        id: string;
        name: string;
        description: string;
        points: number;
    };
}

export default function GoalsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [assignedGoals, setAssignedGoals] = useState<AssignedGoal[]>([]);

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
            .from('user_goal_assignments')
            .select(`
                slot,
                assigned_at,
                goal_templates (
                    id,
                    name,
                    description,
                    points
                )
            `)
            .eq('user_id', user.id)
            .order('slot');

        if (data) {
            setAssignedGoals(data as any);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">
                        Your <span className="text-[#FF5E00]">Goals</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        Set by admin
                    </p>
                </div>
                <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-[#FF5E00]" />
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="text-xs font-black uppercase text-blue-900 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    HOW IT WORKS
                </h4>
                <ul className="text-sm text-blue-800 space-y-2 font-medium">
                    <li>• Goals set by your admin</li>
                    <li>• Track in daily check-in</li>
                    <li>• Earn points shown below</li>
                    <li>• Can't edit or remove goals</li>
                </ul>
            </div>

            {/* Assigned Goals */}
            {assignedGoals.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">
                        ACTIVE ({assignedGoals.length})
                    </h3>
                    {assignedGoals.map((goal) => (
                        <div key={goal.slot} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-[#FF5E00]/10 border border-[#FF5E00]/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl font-black text-[#FF5E00]">{goal.slot}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-xl text-zinc-900 uppercase mb-1">
                                        {goal.goal_templates.name}
                                    </h4>
                                    {goal.goal_templates.description && (
                                        <p className="text-sm text-zinc-500 mb-3">
                                            {goal.goal_templates.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                            +{goal.goal_templates.points} PTS DAILY
                                        </span>
                                        <span className="text-xs text-zinc-400 font-medium">
                                            Assigned {new Date(goal.assigned_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-zinc-200">
                    <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="h-8 w-8 text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-400 uppercase mb-2">No Goals Yet</h3>
                    <p className="text-sm text-zinc-400 font-medium max-w-md mx-auto">
                        Check back soon
                    </p>
                </div>
            )}

            {/* Admin Note */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <h4 className="text-xs font-black uppercase text-orange-900 mb-2">
                    NEED CHANGES?
                </h4>
                <p className="text-sm text-orange-800 font-medium">
                    Contact admin to modify goals
                </p>
            </div>
        </div>
    );
}
