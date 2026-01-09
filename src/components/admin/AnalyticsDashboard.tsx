'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Users, Target, Calendar, Zap, Trophy, Activity, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import ParticipantDetailsView from './ParticipantDetailsView';
import { formatDate } from '@/lib/dateUtils';

interface CompletionStats {
    totalWods: number;
    totalCompletions: number;
    completionRate: number;
    weekdayRate: number;
    weekendRate: number;
    eventRate: number;
}

interface MemberStats {
    userId: string;
    fullName: string;
    totalPoints: number;
    checkInCount: number;
    wodCompletionRate: number;
}

interface SquadStats {
    groupId: string;
    groupName: string;
    totalMembers: number;
    avgCompletionRate: number;
    totalPoints: number;
    members?: MemberStats[];
}

interface TrendData {
    date: string;
    completions: number;
}

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<CompletionStats | null>(null);
    const [squadStats, setSquadStats] = useState<SquadStats[]>([]);
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
    const [selectedSquad, setSelectedSquad] = useState<string | null>(null);
    const [expandedSquad, setExpandedSquad] = useState<string | null>(null);
    const [selectedParticipant, setSelectedParticipant] = useState<{ userId: string; fullName: string } | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange, selectedSquad]);

    const fetchAnalytics = async () => {
        setLoading(true);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));

        const startStr = formatDate(startDate, 'iso');
        const endStr = formatDate(endDate, 'iso');

        // Fetch WODs in range
        const { data: wods } = await supabase
            .from('wods')
            .select('*')
            .gte('date', startStr)
            .lte('date', endStr);

        // Fetch daily logs in range
        const { data: logs } = await supabase
            .from('daily_logs')
            .select('*')
            .gte('date', startStr)
            .lte('date', endStr);

        // Calculate completion stats
        const totalWods = wods?.length || 0;
        const totalCompletions = logs?.filter(l => l.wod_done).length || 0;

        const weekdayWods = wods?.filter(w => w.type === 'weekday') || [];
        const weekendWods = wods?.filter(w => w.type === 'weekend') || [];
        const eventWods = wods?.filter(w => w.type === 'event') || [];

        const weekdayCompletions = logs?.filter(l => {
            return l.wod_done && wods?.some(w => w.date === l.date && w.type === 'weekday');
        }).length || 0;

        const weekendCompletions = logs?.filter(l => {
            return l.wod_done && wods?.some(w => w.date === l.date && w.type === 'weekend');
        }).length || 0;

        const eventCompletions = logs?.filter(l => {
            return l.wod_done && wods?.some(w => w.date === l.date && w.type === 'event');
        }).length || 0;

        setStats({
            totalWods,
            totalCompletions,
            completionRate: totalWods > 0 ? (totalCompletions / (totalWods * 10)) * 100 : 0, // Assuming ~10 active users
            weekdayRate: weekdayWods.length > 0 ? (weekdayCompletions / (weekdayWods.length * 10)) * 100 : 0,
            weekendRate: weekendWods.length > 0 ? (weekendCompletions / (weekendWods.length * 10)) * 100 : 0,
            eventRate: eventWods.length > 0 ? (eventCompletions / (eventWods.length * 10)) * 100 : 0,
        });

        // Fetch squad stats
        const { data: groups } = await supabase.from('groups').select('id, name');

        if (groups) {
            const squadStatsData: SquadStats[] = [];

            for (const group of groups) {
                const { count: memberCount } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id)
                    .eq('status', 'approved');

                const { data: memberProfiles } = await supabase
                    .from('group_members')
                    .select('user_id')
                    .eq('group_id', group.id)
                    .eq('status', 'approved');

                const userIds = memberProfiles?.map(m => m.user_id) || [];

                let totalPoints = 0;
                if (userIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('total_points')
                        .in('id', userIds);

                    totalPoints = profiles?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0;
                }

                // Fetch member details for drill-down
                const members: MemberStats[] = [];
                if (userIds.length > 0) {
                    const { data: memberDetails } = await supabase
                        .from('profiles')
                        .select('id, full_name, total_points')
                        .in('id', userIds);

                    if (memberDetails) {
                        for (const member of memberDetails) {
                            // Get check-in count for this member
                            const { count: checkIns } = await supabase
                                .from('daily_logs')
                                .select('*', { count: 'exact', head: true })
                                .eq('user_id', member.id)
                                .gte('date', startStr)
                                .lte('date', endStr);

                            members.push({
                                userId: member.id,
                                fullName: member.full_name || 'Unknown',
                                totalPoints: member.total_points || 0,
                                checkInCount: checkIns || 0,
                                wodCompletionRate: 0, // Simplified for now
                            });
                        }
                    }
                }

                squadStatsData.push({
                    groupId: group.id,
                    groupName: group.name,
                    totalMembers: memberCount || 0,
                    avgCompletionRate: 65, // Placeholder - would need complex query
                    totalPoints,
                    members: members.sort((a, b) => b.totalPoints - a.totalPoints),
                });
            }

            setSquadStats(squadStatsData.sort((a, b) => b.totalPoints - a.totalPoints));
        }

        // Generate trend data (simplified)
        const trend: TrendData[] = [];
        for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = formatDate(date, 'iso');

            const completions = logs?.filter(l => l.date === dateStr && l.wod_done).length || 0;
            trend.push({ date: dateStr, completions });
        }
        setTrendData(trend);

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="premium-card rounded-[3.5rem] p-12 flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-black uppercase text-zinc-400 tracking-widest">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    const maxTrend = Math.max(...trendData.map(d => d.completions), 1);

    return (
        <section className="space-y-8">
            {/* Header */}
            <div className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-emerald-500/10 transition-colors duration-1000" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <TrendingUp className="h-7 w-7 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                                PERFORMANCE <span className="text-emerald-500">ANALYTICS</span>
                            </h2>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Intelligence \u0026 Insights Dashboard</p>
                        </div>
                    </div>

                    {/* Squad Filter + Time Range Selector */}
                    <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                        {/* Squad Filter */}
                        <select
                            value={selectedSquad || ''}
                            onChange={(e) => setSelectedSquad(e.target.value || null)}
                            className="px-6 py-3 rounded-xl font-black uppercase text-xs bg-white border-2 border-zinc-200 text-zinc-700 hover:border-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                        >
                            <option value="">All Squads</option>
                            {squadStats.map(squad => (
                                <option key={squad.groupId} value={squad.groupId}>{squad.groupName}</option>
                            ))}
                        </select>

                        {/* Time Range */}
                        <div className="flex gap-2">
                            {(['7', '30', '90'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={cn(
                                        "px-6 py-3 rounded-xl font-black uppercase text-xs transition-all",
                                        timeRange === range
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-900 hover:border-zinc-200"
                                    )}
                                >
                                    {range}D
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total WODs', value: stats?.totalWods || 0, icon: Calendar, color: 'blue' },
                    { label: 'Completions', value: stats?.totalCompletions || 0, icon: Target, color: 'emerald' },
                    { label: 'Avg Completion Rate', value: `${(stats?.completionRate || 0).toFixed(1)}%`, icon: Activity, color: 'purple' },
                    { label: 'Active Squads', value: squadStats.length, icon: Users, color: 'orange' },
                ].map((metric, i) => (
                    <div key={i} className="premium-card rounded-[2.5rem] p-8 group hover:scale-105 transition-all duration-300">
                        <div className="flex items-start justify-between mb-6">
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center",
                                metric.color === 'blue' && "bg-blue-50 text-blue-500",
                                metric.color === 'emerald' && "bg-emerald-50 text-emerald-500",
                                metric.color === 'purple' && "bg-purple-50 text-purple-500",
                                metric.color === 'orange' && "bg-orange-50 text-orange-500"
                            )}>
                                <metric.icon className="h-7 w-7" />
                            </div>
                        </div>
                        <span className="text-4xl font-black text-zinc-900 italic block mb-2 font-heading tracking-tighter">{metric.value}</span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{metric.label}</span>
                    </div>
                ))}
            </div>

            {/* WOD Type Performance */}
            <div className="premium-card rounded-[3.5rem] p-12">
                <h3 className="text-2xl font-black italic uppercase text-zinc-900 font-heading mb-8">WOD Type Performance</h3>

                <div className="space-y-6">
                    {[
                        { type: 'Weekday WODs', rate: stats?.weekdayRate || 0, color: 'zinc' },
                        { type: 'Weekend WODs', rate: stats?.weekendRate || 0, color: 'emerald' },
                        { type: 'Special Events', rate: stats?.eventRate || 0, color: 'purple' },
                    ].map((item, i) => (
                        <div key={i}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-black uppercase text-zinc-700">{item.type}</span>
                                <span className="text-xl font-black italic text-zinc-900 font-heading">{item.rate.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        item.color === 'zinc' && "bg-zinc-900",
                                        item.color === 'emerald' && "bg-emerald-500",
                                        item.color === 'purple' && "bg-purple-500"
                                    )}
                                    style={{ width: `${Math.min(item.rate, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Squad Leaderboard with Drill-Down */}
            <div className="premium-card rounded-[3.5rem] p-12">
                <div className="flex items-center gap-4 mb-8">
                    <Trophy className="h-8 w-8 text-[#FF5E00]" />
                    <h3 className="text-2xl font-black italic uppercase text-zinc-900 font-heading">Squad Leaderboard</h3>
                    {selectedSquad && (
                        <span className="text-xs font-black uppercase text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
                            Filtered
                        </span>
                    )}
                </div>

                <div className="space-y-4">
                    {squadStats.map((squad, index) => (
                        <div key={index} className="border border-zinc-100 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setExpandedSquad(expandedSquad === squad.groupId ? null : squad.groupId)}
                                className="w-full flex items-center gap-6 p-6 bg-gradient-to-r from-zinc-50 to-white hover:from-zinc-100 hover:to-zinc-50 transition-all group"
                            >
                                <div className={cn(
                                    "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-2xl italic font-heading shrink-0",
                                    index === 0 && "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg",
                                    index === 1 && "bg-gradient-to-br from-zinc-300 to-zinc-400 text-white shadow-md",
                                    index === 2 && "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md",
                                    index > 2 && "bg-zinc-100 text-zinc-400"
                                )}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="text-xl font-black uppercase text-zinc-900 mb-1">{squad.groupName}</h4>
                                    <p className="text-xs text-zinc-400 font-black uppercase tracking-wider">{squad.totalMembers} Members</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black italic text-[#FF5E00] font-heading">{squad.totalPoints.toLocaleString()}</span>
                                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Total XP</p>
                                </div>
                                <div className="text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                    {expandedSquad === squad.groupId ? '▼' : '▶'}
                                </div>
                            </button>

                            {/* Expandable Member List */}
                            {expandedSquad === squad.groupId && squad.members && (
                                <div className="bg-zinc-50 p-6 border-t border-zinc-200">
                                    <h5 className="text-sm font-black uppercase text-zinc-600 mb-4">Squad Members</h5>
                                    <div className="space-y-3">
                                        {squad.members.map((member, idx) => (
                                            <div
                                                key={member.userId}
                                                onClick={() => setSelectedParticipant({ userId: member.userId, fullName: member.fullName })}
                                                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-100 hover:border-[#FF5E00]/30 hover:shadow-md transition-all cursor-pointer group/member"
                                            >
                                                <div className="h-10 w-10 bg-zinc-100 rounded-xl flex items-center justify-center text-sm font-black text-zinc-400">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-zinc-900 text-sm group-hover/member:text-[#FF5E00] transition-colors">{member.fullName}</p>
                                                    <p className="text-xs text-zinc-400 font-semibold">{member.checkInCount} check-ins</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-black italic text-emerald-600">{member.totalPoints}</span>
                                                    <p className="text-[8px] font-black uppercase text-zinc-400">XP</p>
                                                </div>
                                                <Eye className="h-5 w-5 text-zinc-300 group-hover/member:text-[#FF5E00] transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Engagement Trend */}
            <div className="premium-card rounded-[3.5rem] p-12">
                <h3 className="text-2xl font-black italic uppercase text-zinc-900 font-heading mb-8">Engagement Trend</h3>

                <div className="h-64 flex items-end gap-2">
                    {trendData.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div
                                className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500 hover:from-emerald-600 hover:to-emerald-500 relative group-hover:scale-105"
                                style={{ height: `${(day.completions / maxTrend) * 100}%`, minHeight: day.completions > 0 ? '8px' : '2px' }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap">
                                    {day.completions} completions
                                </div>
                            </div>
                            <span className="text-[8px] font-black text-zinc-400 uppercase">{new Date(day.date).getDate()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Participant Details Modal */}
            {selectedParticipant && (
                <ParticipantDetailsView
                    userId={selectedParticipant.userId}
                    userName={selectedParticipant.fullName}
                    onClose={() => setSelectedParticipant(null)}
                />
            )}
        </section>
    );
}
