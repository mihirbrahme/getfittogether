'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Calendar, Check, X, Search, Filter, Users, MessageSquare,
    ChevronLeft, ChevronRight, Loader2, Eye, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';

interface Participant {
    id: string;
    full_name: string;
    display_name: string;
}

interface Activity {
    id: string;
    activity_name: string;
    points: number;
    activity_type: string;
}

interface CheckInLog {
    user_id: string;
    date: string;
    daily_points: number;
    custom_logs: Record<string, boolean>;
    note_to_admin: string | null;
    junk_food: boolean;
    processed_sugar: boolean;
    alcohol_excess: boolean;
}

export default function CheckInOverview() {
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date(), 'iso'));
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [checkIns, setCheckIns] = useState<Map<string, CheckInLog>>(new Map());
    const [filter, setFilter] = useState<'all' | 'checked' | 'missed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);

        // Fetch all approved participants
        const { data: members } = await supabase
            .from('group_members')
            .select(`
                user_id,
                group_id,
                profiles!inner(id, full_name, display_name)
            `)
            .eq('status', 'approved');

        if (members && members.length > 0) {
            const participantList: Participant[] = members.map((m: any) => ({
                id: m.profiles.id,
                full_name: m.profiles.full_name || 'Unknown',
                display_name: m.profiles.display_name || m.profiles.full_name || 'Unknown'
            }));
            // Remove duplicates (in case user is in multiple squads)
            const uniqueParticipants = Array.from(
                new Map(participantList.map(p => [p.id, p])).values()
            );
            setParticipants(uniqueParticipants);

            // Get the first squad's activities (assuming single squad for now)
            const squadId = members[0].group_id;
            const { data: squadActivities } = await supabase
                .from('squad_checkin_activities')
                .select('id, activity_name, points, activity_type')
                .eq('squad_id', squadId)
                .eq('enabled', true)
                .order('display_order');

            if (squadActivities) {
                setActivities(squadActivities);
            }
        }

        // Fetch check-ins for selected date
        const { data: logs } = await supabase
            .from('daily_logs')
            .select('user_id, date, daily_points, custom_logs, note_to_admin, junk_food, processed_sugar, alcohol_excess')
            .eq('date', selectedDate);

        if (logs) {
            const checkInMap = new Map<string, CheckInLog>();
            logs.forEach(log => {
                checkInMap.set(log.user_id, log);
            });
            setCheckIns(checkInMap);
        } else {
            setCheckIns(new Map());
        }

        setLoading(false);
    };

    const changeDate = (delta: number) => {
        const date = new Date(selectedDate + 'T00:00:00'); // Parse as local
        date.setDate(date.getDate() + delta);
        setSelectedDate(formatDate(date, 'iso'));
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Filter participants
    const filteredParticipants = participants.filter(p => {
        // Search filter
        const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.display_name.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const hasCheckedIn = checkIns.has(p.id);
        if (filter === 'checked' && !hasCheckedIn) return false;
        if (filter === 'missed' && hasCheckedIn) return false;

        return matchesSearch;
    });

    const checkedInCount = participants.filter(p => checkIns.has(p.id)).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900">
                    Check-In <span className="text-[#FF5E00]">Overview</span>
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                    View all participants' daily check-in status
                </p>
            </div>

            {/* Date Selector & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => changeDate(-1)}
                        className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span className="font-bold text-zinc-900">{formatDisplayDate(selectedDate)}</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="absolute opacity-0 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => changeDate(1)}
                        className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-700">
                            {checkedInCount}/{participants.length} Checked In
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search participants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/50"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-zinc-400" />
                    <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
                        {(['all', 'checked', 'missed'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold uppercase transition-colors",
                                    filter === f
                                        ? "bg-[#FF5E00] text-white"
                                        : "bg-white text-zinc-600 hover:bg-zinc-50"
                                )}
                            >
                                {f === 'all' ? 'All' : f === 'checked' ? 'Done' : 'Missing'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Participants Grid */}
            <div className="space-y-3">
                {filteredParticipants.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 rounded-2xl">
                        <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                        <p className="text-zinc-500">No participants found</p>
                    </div>
                ) : (
                    filteredParticipants.map(participant => {
                        const checkIn = checkIns.get(participant.id);
                        const hasCheckedIn = !!checkIn;
                        const hasNote = checkIn?.note_to_admin;
                        const isExpanded = expandedParticipant === participant.id;

                        return (
                            <div
                                key={participant.id}
                                className={cn(
                                    "bg-white border rounded-2xl p-4 transition-all",
                                    hasCheckedIn ? "border-green-200" : "border-red-200",
                                    isExpanded && "ring-2 ring-[#FF5E00]/30"
                                )}
                            >
                                {/* Participant Row */}
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedParticipant(isExpanded ? null : participant.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center font-bold text-white",
                                            hasCheckedIn ? "bg-green-500" : "bg-red-400"
                                        )}>
                                            {hasCheckedIn ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-zinc-900">{participant.full_name}</h4>
                                            {hasCheckedIn && (
                                                <p className="text-xs text-zinc-500">
                                                    {checkIn.daily_points} points earned
                                                </p>
                                            )}
                                        </div>
                                        {hasNote && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                                                <MessageSquare className="h-3 w-3 text-blue-500" />
                                                <span className="text-xs font-medium text-blue-600">Note</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Activity Quick View */}
                                        <div className="hidden sm:flex items-center gap-1">
                                            {activities.slice(0, 5).map(activity => {
                                                const completed = checkIn?.custom_logs?.[`activity_${activity.id}`] === true;
                                                return (
                                                    <div
                                                        key={activity.id}
                                                        className={cn(
                                                            "h-6 w-6 rounded-md flex items-center justify-center",
                                                            completed ? "bg-green-100" : "bg-zinc-100"
                                                        )}
                                                        title={activity.activity_name}
                                                    >
                                                        {completed ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <X className="h-3 w-3 text-zinc-400" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <Eye className={cn(
                                            "h-5 w-5 transition-colors",
                                            isExpanded ? "text-[#FF5E00]" : "text-zinc-300"
                                        )} />
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && hasCheckedIn && (
                                    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4">
                                        {/* Activities Breakdown */}
                                        <div>
                                            <h5 className="text-xs font-bold uppercase text-zinc-400 mb-2">Activities</h5>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {activities.map(activity => {
                                                    const completed = checkIn?.custom_logs?.[`activity_${activity.id}`] === true;
                                                    return (
                                                        <div
                                                            key={activity.id}
                                                            className={cn(
                                                                "flex items-center gap-2 p-2 rounded-lg text-sm",
                                                                completed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                                                            )}
                                                        >
                                                            {completed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                            <span className="truncate">{activity.activity_name}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Slip-ups */}
                                        {(checkIn.junk_food || checkIn.processed_sugar || checkIn.alcohol_excess) && (
                                            <div>
                                                <h5 className="text-xs font-bold uppercase text-zinc-400 mb-2">Slip-ups</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {checkIn.junk_food && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs">Junk Food (-5)</span>
                                                    )}
                                                    {checkIn.processed_sugar && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs">Processed Sugar (-5)</span>
                                                    )}
                                                    {checkIn.alcohol_excess && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs">Alcohol Excess (-5)</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Note to Admin */}
                                        {hasNote && (
                                            <div>
                                                <h5 className="text-xs font-bold uppercase text-zinc-400 mb-2">Note from Participant</h5>
                                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                                                    {checkIn.note_to_admin}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Not Checked In Message */}
                                {isExpanded && !hasCheckedIn && (
                                    <div className="mt-4 pt-4 border-t border-zinc-100">
                                        <p className="text-sm text-zinc-500">
                                            This participant has not submitted a check-in for {formatDisplayDate(selectedDate)}.
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
