'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, User, Trophy, Zap, Target, Calendar, TrendingUp, Activity, Check, X as XIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';

interface ParticipantDetailsViewProps {
    userId: string;
    userName: string;
    onClose: () => void;
}

interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    height: number | null;
    total_points: number;
    status: string;
    created_at: string;
}

interface CheckInLog {
    id: string;
    date: string;
    wod_done: boolean;
    steps_done: boolean;
    diet_done: boolean;
    sleep_done: boolean;
    hydration_done: boolean;
    goal1_done: boolean;
    goal2_done: boolean;
    points_earned: number;
}

interface BiometricLog {
    id: string;
    logged_at: string;
    weight_kg: number | null;
    body_fat_percentage: number | null;
    muscle_mass_percentage: number | null;
    bmi: number | null;
}

interface GoalAssignment {
    id: string;
    slot: number;
    goal_templates: {
        name: string;
        description: string;
        points: number;
        category: string;
    };
}

interface SquadInfo {
    group_id: string;
    groups: {
        name: string;
        code: string;
    };
}

export default function ParticipantDetailsView({ userId, userName, onClose }: ParticipantDetailsViewProps) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>([]);
    const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>([]);
    const [goals, setGoals] = useState<GoalAssignment[]>([]);
    const [squad, setSquad] = useState<SquadInfo | null>(null);
    const [currentStreak, setCurrentStreak] = useState(0);

    useEffect(() => {
        fetchParticipantData();
    }, [userId]);

    const fetchParticipantData = async () => {
        setLoading(true);

        // Fetch profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileData) setProfile(profileData);

        // Fetch check-in logs (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: logsData } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('date', formatDate(thirtyDaysAgo, 'iso'))
            .order('date', { ascending: false });

        if (logsData) setCheckInLogs(logsData);

        // Calculate streak
        if (logsData && logsData.length > 0) {
            let streak = 0;
            const today = formatDate(new Date(), 'iso');
            const sortedLogs = [...logsData].sort((a, b) => b.date.localeCompare(a.date));

            for (const log of sortedLogs) {
                // Count if at least WOD was done
                if (log.wod_done) {
                    streak++;
                } else {
                    break;
                }
            }
            setCurrentStreak(streak);
        }

        // Fetch biometric logs
        const { data: biometricsData } = await supabase
            .from('biometric_logs')
            .select('*')
            .eq('user_id', userId)
            .order('logged_at', { ascending: false })
            .limit(10);

        if (biometricsData) setBiometricLogs(biometricsData);

        // Fetch goal assignments
        const { data: goalsData } = await supabase
            .from('user_goal_assignments')
            .select(`
                id,
                slot,
                goal_templates (
                    name,
                    description,
                    points,
                    category
                )
            `)
            .eq('user_id', userId);

        if (goalsData) setGoals(goalsData as any);

        // Fetch squad
        const { data: squadData } = await supabase
            .from('group_members')
            .select(`
                group_id,
                groups (
                    name,
                    code
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved')
            .single();

        if (squadData) setSquad(squadData as any);

        setLoading(false);
    };

    // Calculate stats
    const totalCheckIns = checkInLogs.length;
    const wodCompletionRate = totalCheckIns > 0
        ? Math.round((checkInLogs.filter(l => l.wod_done).length / totalCheckIns) * 100)
        : 0;
    const avgPointsPerDay = totalCheckIns > 0
        ? Math.round(checkInLogs.reduce((sum, l) => sum + (l.points_earned || 0), 0) / totalCheckIns)
        : 0;

    // Get latest biometrics
    const latestBiometric = biometricLogs[0];

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-3xl p-12 flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-[#FF5E00] animate-spin" />
                    <p className="text-sm font-black uppercase text-zinc-400 tracking-widest">Loading Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-xl p-8 border-b border-zinc-100 rounded-t-[2.5rem] z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#FF5E00] to-orange-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                                {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic uppercase text-zinc-900 tracking-tight font-heading">
                                    {profile?.full_name || userName}
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    {squad && (
                                        <span className="text-xs font-black uppercase text-[#FF5E00] bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
                                            {squad.groups.name}
                                        </span>
                                    )}
                                    <span className="text-xs font-bold text-zinc-400">
                                        Member since {new Date(profile?.created_at || '').toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-12 w-12 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-[#FF5E00]/10 to-orange-50 rounded-2xl p-5 border border-orange-100">
                            <Trophy className="h-6 w-6 text-[#FF5E00] mb-3" />
                            <p className="text-3xl font-black italic text-zinc-900 font-heading">{profile?.total_points || 0}</p>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total XP</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
                            <Zap className="h-6 w-6 text-emerald-500 mb-3" />
                            <p className="text-3xl font-black italic text-zinc-900 font-heading">{currentStreak}</p>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Day Streak</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                            <Target className="h-6 w-6 text-blue-500 mb-3" />
                            <p className="text-3xl font-black italic text-zinc-900 font-heading">{wodCompletionRate}%</p>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">WOD Rate</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                            <Activity className="h-6 w-6 text-purple-500 mb-3" />
                            <p className="text-3xl font-black italic text-zinc-900 font-heading">{avgPointsPerDay}</p>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Avg XP/Day</p>
                        </div>
                    </div>

                    {/* Personal Goals */}
                    <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                        <h3 className="text-sm font-black uppercase text-zinc-900 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-[#FF5E00]" />
                            Assigned Personal Goals
                        </h3>
                        {goals.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {goals.sort((a, b) => a.slot - b.slot).map((goal) => (
                                    <div key={goal.id} className="bg-white rounded-xl p-4 border border-zinc-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-black uppercase text-[#FF5E00]">Goal {goal.slot}</span>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                +{goal.goal_templates.points} pts
                                            </span>
                                        </div>
                                        <p className="font-bold text-zinc-900">{goal.goal_templates.name}</p>
                                        {goal.goal_templates.description && (
                                            <p className="text-xs text-zinc-500 mt-1">{goal.goal_templates.description}</p>
                                        )}
                                        <span className="text-[10px] font-black uppercase text-zinc-400 mt-2 block">
                                            {goal.goal_templates.category}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-4">No personal goals assigned yet</p>
                        )}
                    </div>

                    {/* Biometrics */}
                    {latestBiometric && (
                        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                            <h3 className="text-sm font-black uppercase text-zinc-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                Latest Biometrics
                                <span className="text-xs font-normal text-zinc-400 ml-2">
                                    ({new Date(latestBiometric.logged_at).toLocaleDateString()})
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {latestBiometric.weight_kg && (
                                    <div className="bg-white rounded-xl p-4 border border-zinc-200 text-center">
                                        <p className="text-2xl font-black text-zinc-900">{latestBiometric.weight_kg}</p>
                                        <p className="text-[10px] font-black uppercase text-zinc-500">Weight (kg)</p>
                                    </div>
                                )}
                                {latestBiometric.bmi && (
                                    <div className="bg-white rounded-xl p-4 border border-zinc-200 text-center">
                                        <p className="text-2xl font-black text-zinc-900">{latestBiometric.bmi.toFixed(1)}</p>
                                        <p className="text-[10px] font-black uppercase text-zinc-500">BMI</p>
                                    </div>
                                )}
                                {latestBiometric.body_fat_percentage && (
                                    <div className="bg-white rounded-xl p-4 border border-zinc-200 text-center">
                                        <p className="text-2xl font-black text-zinc-900">{latestBiometric.body_fat_percentage}%</p>
                                        <p className="text-[10px] font-black uppercase text-zinc-500">Body Fat</p>
                                    </div>
                                )}
                                {latestBiometric.muscle_mass_percentage && (
                                    <div className="bg-white rounded-xl p-4 border border-zinc-200 text-center">
                                        <p className="text-2xl font-black text-zinc-900">{latestBiometric.muscle_mass_percentage}%</p>
                                        <p className="text-[10px] font-black uppercase text-zinc-500">Muscle Mass</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Check-in History */}
                    <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                        <h3 className="text-sm font-black uppercase text-zinc-900 mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Check-in History (Last 30 Days)
                        </h3>
                        {checkInLogs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                                            <th className="text-left py-2 px-3">Date</th>
                                            <th className="text-center py-2 px-2">WOD</th>
                                            <th className="text-center py-2 px-2">Steps</th>
                                            <th className="text-center py-2 px-2">Diet</th>
                                            <th className="text-center py-2 px-2">Sleep</th>
                                            <th className="text-center py-2 px-2">Hydration</th>
                                            <th className="text-center py-2 px-2">Goal 1</th>
                                            <th className="text-center py-2 px-2">Goal 2</th>
                                            <th className="text-right py-2 px-3">XP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {checkInLogs.slice(0, 14).map((log) => (
                                            <tr key={log.id} className="border-t border-zinc-200 bg-white">
                                                <td className="py-3 px-3 font-bold text-zinc-900">
                                                    {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="text-center py-3 px-2">
                                                    {log.wod_done ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <XIcon className="h-4 w-4 text-zinc-300 mx-auto" />}
                                                </td>
                                                <td className="text-center py-3 px-2">
                                                    {log.steps_done ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <XIcon className="h-4 w-4 text-zinc-300 mx-auto" />}
                                                </td>
                                                <td className="text-center py-3 px-2">
                                                    {log.diet_done ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <XIcon className="h-4 w-4 text-zinc-300 mx-auto" />}
                                                </td>
                                                <td className="text-center py-3 px-2">
                                                    {log.sleep_done ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <XIcon className="h-4 w-4 text-zinc-300 mx-auto" />}
                                                </td>
                                                <td className="text-center py-3 px-2">
                                                    {log.hydration_done ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <XIcon className="h-4 w-4 text-zinc-300 mx-auto" />}
                                                </td>
                                                <td className="text-center py-3 px-2">
                                                    {log.goal1_done ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <XIcon className="h-4 w-4 text-zinc-300 mx-auto" />}
                                                </td>
                                                <td className="text-center py-3 px-2">
                                                    {log.goal2_done ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <XIcon className="h-4 w-4 text-zinc-300 mx-auto" />}
                                                </td>
                                                <td className="text-right py-3 px-3 font-black text-[#FF5E00]">
                                                    +{log.points_earned || 0}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {checkInLogs.length > 14 && (
                                    <p className="text-xs text-zinc-400 text-center mt-4">
                                        Showing 14 of {checkInLogs.length} check-ins
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-8">No check-ins recorded yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
