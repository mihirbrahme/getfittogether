'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Trophy, AlertCircle, CheckCircle, Activity, Plus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats {
    totalParticipants: number;
    squadCount: number;
    pendingApprovals: number;
    todayWodExists: boolean;
    todayCheckIns: number;
}

interface OverviewDashboardProps {
    onNavigate: (tab: string) => void;
}

export default function OverviewDashboard({ onNavigate }: OverviewDashboardProps) {
    const [stats, setStats] = useState<Stats>({
        totalParticipants: 0,
        squadCount: 0,
        pendingApprovals: 0,
        todayWodExists: false,
        todayCheckIns: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        try {
            // 1. Total Participants (approved only)
            const { count: participants } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'participant')
                .eq('status', 'approved');

            // 2. Squad Count
            const { count: squads } = await supabase
                .from('groups')
                .select('*', { count: 'exact', head: true });

            // 3. Pending Approvals
            const { count: pending } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // 4. Today's WOD exists
            const { data: todayWod } = await supabase
                .from('wods')
                .select('id')
                .eq('date', today)
                .limit(1)
                .single();

            // 5. Today's Check-ins
            const { count: checkIns } = await supabase
                .from('daily_logs')
                .select('*', { count: 'exact', head: true })
                .eq('date', today);

            setStats({
                totalParticipants: participants || 0,
                squadCount: squads || 0,
                pendingApprovals: pending || 0,
                todayWodExists: !!todayWod,
                todayCheckIns: checkIns || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Members',
            value: stats.totalParticipants,
            icon: Users,
            color: 'blue',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            iconColor: 'text-blue-500',
        },
        {
            label: 'Squads',
            value: stats.squadCount,
            icon: Trophy,
            color: 'purple',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            iconColor: 'text-purple-500',
        },
        {
            label: 'Pending Approvals',
            value: stats.pendingApprovals,
            icon: AlertCircle,
            color: 'orange',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600',
            iconColor: 'text-orange-500',
            alert: stats.pendingApprovals > 0,
        },
        {
            label: "Today's WOD",
            value: stats.todayWodExists ? '✓ Created' : '✗ Missing',
            icon: Activity,
            color: stats.todayWodExists ? 'emerald' : 'red',
            bgColor: stats.todayWodExists ? 'bg-emerald-50' : 'bg-red-50',
            textColor: stats.todayWodExists ? 'text-emerald-600' : 'text-red-600',
            iconColor: stats.todayWodExists ? 'text-emerald-500' : 'text-red-500',
            alert: !stats.todayWodExists,
        },
        {
            label: "Today's Check-ins",
            value: stats.todayCheckIns,
            icon: CheckCircle,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            iconColor: 'text-emerald-500',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-[#FF5E00] to-orange-600 rounded-[3rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <h2 className="text-4xl font-black italic uppercase mb-3 tracking-tighter">
                        Welcome Back! 👋
                    </h2>
                    <p className="text-orange-100 font-medium text-lg">
                        Here's your fitness program snapshot for today
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className={cn(
                            "premium-card rounded-[2rem] p-6 relative overflow-hidden transition-all hover:scale-105",
                            stat.alert && "ring-2 ring-offset-2",
                            stat.alert && stat.color === 'orange' && "ring-orange-400",
                            stat.alert && stat.color === 'red' && "ring-red-400"
                        )}
                    >
                        <div className={cn("absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20", stat.bgColor)} />

                        <div className="relative z-10">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", stat.bgColor)}>
                                <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                            </div>

                            <div className="text-3xl font-black italic text-zinc-900 mb-1">
                                {typeof stat.value === 'number' ? stat.value : stat.value}
                            </div>

                            <div className="text-xs font-black uppercase text-zinc-400 tracking-widest">
                                {stat.label}
                            </div>

                            {stat.alert && (
                                <div className={cn("absolute top-4 right-4 h-3 w-3 rounded-full animate-pulse",
                                    stat.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                                )} />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[3rem] p-10 border border-zinc-100 shadow-sm">
                <h3 className="text-2xl font-black italic uppercase text-zinc-900 mb-6 tracking-tighter">
                    Quick Actions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Add Today's WOD */}
                    <button
                        onClick={() => onNavigate('wods')}
                        className={cn(
                            "group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all hover:scale-[1.02]",
                            stats.todayWodExists
                                ? "bg-emerald-50 border-2 border-emerald-200"
                                : "bg-orange-50 border-2 border-orange-300 animate-pulse"
                        )}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "h-14 w-14 rounded-xl flex items-center justify-center",
                                stats.todayWodExists ? "bg-emerald-100" : "bg-orange-200"
                            )}>
                                <Plus className={cn(
                                    "h-7 w-7 group-hover:rotate-90 transition-transform",
                                    stats.todayWodExists ? "text-emerald-600" : "text-orange-600"
                                )} />
                            </div>
                            {!stats.todayWodExists && (
                                <span className="text-xs font-black uppercase bg-red-500 text-white px-3 py-1 rounded-full">
                                    Action Needed
                                </span>
                            )}
                        </div>

                        <h4 className="text-xl font-black uppercase text-zinc-900 mb-2">
                            {stats.todayWodExists ? "Edit Today's WOD" : "Add Today's WOD"}
                        </h4>
                        <p className="text-sm text-zinc-600 font-medium">
                            {stats.todayWodExists
                                ? "Workout already scheduled. Click to edit or view."
                                : "No workout scheduled for today. Add one now!"}
                        </p>
                    </button>

                    {/* Approve Pending Members */}
                    <button
                        onClick={() => onNavigate('groups')}
                        className={cn(
                            "group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all hover:scale-[1.02]",
                            stats.pendingApprovals > 0
                                ? "bg-purple-50 border-2 border-purple-300 animate-pulse"
                                : "bg-zinc-50 border-2 border-zinc-200"
                        )}
                        disabled={stats.pendingApprovals === 0}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "h-14 w-14 rounded-xl flex items-center justify-center",
                                stats.pendingApprovals > 0 ? "bg-purple-200" : "bg-zinc-100"
                            )}>
                                <UserCheck className={cn(
                                    "h-7 w-7",
                                    stats.pendingApprovals > 0 ? "text-purple-600" : "text-zinc-400"
                                )} />
                            </div>
                            {stats.pendingApprovals > 0 && (
                                <span className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-black">
                                    {stats.pendingApprovals}
                                </span>
                            )}
                        </div>

                        <h4 className="text-xl font-black uppercase text-zinc-900 mb-2">
                            Approve Members
                        </h4>
                        <p className="text-sm text-zinc-600 font-medium">
                            {stats.pendingApprovals > 0
                                ? `${stats.pendingApprovals} member${stats.pendingApprovals > 1 ? 's' : ''} waiting for approval`
                                : "No pending approvals. All caught up!"}
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}
