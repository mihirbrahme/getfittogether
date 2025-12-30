'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, TrendingUp, Users, History as HistoryIcon, CheckCircle, X } from 'lucide-react';
import { format, formatDistance } from 'date-fns';
import DateDisplay from '@/components/DateDisplay';

interface CheckInLog {
    id: string;
    date: string;
    daily_points: number;
    custom_logs: Record<string, boolean>;
}

interface SquadCheckInLog {
    id: string;
    date: string;
    daily_points: number;
    profiles: {
        first_name: string;
        last_name: string;
    };
}

export default function HistoryPage() {
    const [myHistory, setMyHistory] = useState<CheckInLog[]>([]);
    const [squadHistory, setSquadHistory] = useState<SquadCheckInLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'squad'>('personal');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch personal history
        const { data: personalLogs } = await supabase
            .from('daily_logs')
            .select('id, date, daily_points, custom_logs')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(30);

        setMyHistory(personalLogs || []);

        // Get user's squad members
        const { data: membership } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .single();

        if (membership) {
            const { data: squadMembers } = await supabase
                .from('group_members')
                .select('user_id')
                .eq('group_id', membership.group_id)
                .eq('status', 'approved');

            if (squadMembers) {
                const memberIds = squadMembers.map(m => m.user_id);

                // Fetch squad history
                const { data: squadLogs } = await supabase
                    .from('daily_logs')
                    .select(`
                        id,
                        date,
                        daily_points,
                        profiles!inner(first_name, last_name)
                    `)
                    .in('user_id', memberIds)
                    .order('date', { ascending: false })
                    .limit(50);

                setSquadHistory(squadLogs as any || []);
            }
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-black uppercase text-zinc-400 tracking-widest">Loading History...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">
                        Check-In <span className="text-[#FF5E00]">History</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        Track your progress and squad activity
                    </p>
                </div>
                <DateDisplay />
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-4 border-b border-zinc-200">
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`pb-4 px-6 font-black uppercase text-sm tracking-wider transition-colors ${activeTab === 'personal'
                            ? 'text-[#FF5E00] border-b-2 border-[#FF5E00]'
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <HistoryIcon className="h-4 w-4" />
                        My History
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('squad')}
                    className={`pb-4 px-6 font-black uppercase text-sm tracking-wider transition-colors ${activeTab === 'squad'
                            ? 'text-[#FF5E00] border-b-2 border-[#FF5E00]'
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Squad Activity
                    </div>
                </button>
            </div>

            {/* Personal History */}
            {activeTab === 'personal' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-black italic uppercase text-zinc-700 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-[#FF5E00]" />
                        Your Check-Ins ({myHistory.length})
                    </h2>

                    {myHistory.length === 0 ? (
                        <div className="text-center py-12 bg-zinc-50 rounded-2xl">
                            <HistoryIcon className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                            <p className="text-zinc-400 font-medium">No check-ins yet. Start today!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myHistory.map((log) => {
                                const completedCount = Object.values(log.custom_logs || {}).filter(v => v === true).length;
                                const totalCount = Object.keys(log.custom_logs || {}).length;

                                return (
                                    <div
                                        key={log.id}
                                        className="bg-white border border-zinc-100 rounded-2xl p-6 hover:border-[#FF5E00] transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                                                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-zinc-900">
                                                        {format(new Date(log.date), 'EEEE, MMMM d, yyyy')}
                                                    </p>
                                                    <p className="text-sm text-zinc-400 font-medium">
                                                        {formatDistance(new Date(log.date), new Date(), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Completed</p>
                                                    <p className="font-black text-zinc-900">{completedCount}/{totalCount}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Points</p>
                                                    <p className="text-2xl font-black text-[#FF5E00]">{log.daily_points}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activities Detail */}
                                        <div className="mt-4 pt-4 border-t border-zinc-100">
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(log.custom_logs || {}).map(([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${value
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-red-50 text-red-600'
                                                            }`}
                                                    >
                                                        {value ? '✓' : '✗'} {key.replace('activity_', '').replace('goal_', 'Goal ')}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Squad History */}
            {activeTab === 'squad' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-black italic uppercase text-zinc-700 flex items-center gap-2">
                        <Users className="h-6 w-6 text-[#FF5E00]" />
                        Squad Activity ({squadHistory.length} entries)
                    </h2>

                    {squadHistory.length === 0 ? (
                        <div className="text-center py-12 bg-zinc-50 rounded-2xl">
                            <Users className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                            <p className="text-zinc-400 font-medium">No squad activity yet</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {squadHistory.map((log) => (
                                <div
                                    key={log.id}
                                    className="bg-white border border-zinc-100 rounded-xl p-5 hover:border-[#FF5E00] transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="font-black text-zinc-900">
                                                {log.profiles.first_name} {log.profiles.last_name}
                                            </p>
                                            <p className="text-xs text-zinc-400 font-medium">
                                                {format(new Date(log.date), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-[#FF5E00]">{log.daily_points}</p>
                                            <p className="text-xs text-zinc-400 uppercase font-bold">Points</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
