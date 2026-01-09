'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, Users, Save, ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantPoints {
    user_id: string;
    full_name: string;
    display_name: string | null;
    total_points: number;
    weekly_points: {
        consistency_points: number;
        effort_points: number;
        community_points: number;
        notes: string | null;
    } | null;
}

interface WeeklyAward {
    user_id: string;
    consistency: number;
    effort: number;
    community: number;
    notes: string;
}

function getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    // Use local date components instead of UTC (toISOString)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayOfMonth}`;
}

function formatWeekRange(weekStart: string): string {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

export default function AdminPointsAwarder() {
    const [participants, setParticipants] = useState<ParticipantPoints[]>([]);
    const [awards, setAwards] = useState<Record<string, WeeklyAward>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));

    useEffect(() => {
        fetchParticipants();
    }, [weekStart]);

    const fetchParticipants = async () => {
        setLoading(true);
        setSaved(false);

        // Try RPC first, fallback to manual query
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_squad_members_for_admin', {
            p_week_start: weekStart
        });

        if (rpcError || !rpcData) {
            // Fallback: manual query
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, display_name, total_points')
                .neq('role', 'admin')
                .order('full_name');

            const { data: existingAwards } = await supabase
                .from('admin_weekly_points')
                .select('*')
                .eq('week_start', weekStart);

            if (profiles) {
                const participantList: ParticipantPoints[] = profiles.map(p => ({
                    user_id: p.id,
                    full_name: p.full_name || 'Unknown',
                    display_name: p.display_name,
                    total_points: p.total_points || 0,
                    weekly_points: existingAwards?.find(a => a.user_id === p.id) || null
                }));
                setParticipants(participantList);
                initializeAwards(participantList);
            }
        } else {
            setParticipants(rpcData);
            initializeAwards(rpcData);
        }

        setLoading(false);
    };

    const initializeAwards = (data: ParticipantPoints[]) => {
        const initial: Record<string, WeeklyAward> = {};
        data.forEach(p => {
            initial[p.user_id] = {
                user_id: p.user_id,
                consistency: p.weekly_points?.consistency_points || 0,
                effort: p.weekly_points?.effort_points || 0,
                community: p.weekly_points?.community_points || 0,
                notes: p.weekly_points?.notes || ''
            };
        });
        setAwards(initial);
    };

    // Validate points to ensure they're within 0-10 range (SECURITY)
    const validatePoints = (value: number): number => {
        return Math.max(0, Math.min(10, Math.floor(value)));
    };

    const updateAward = (userId: string, field: 'consistency' | 'effort' | 'community' | 'notes', value: number | string) => {
        setAwards(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [field]: field === 'notes' ? value : validatePoints(value as number)
            }
        }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Not authenticated');
            }

            // Validate all awards before saving
            const validatedAwards = Object.entries(awards).map(([userId, award]) => ({
                user_id: userId,
                week_start: weekStart,
                consistency_points: validatePoints(award.consistency),
                effort_points: validatePoints(award.effort),
                community_points: validatePoints(award.community),
                notes: award.notes || null,
                awarded_by: user.id,
                updated_at: new Date().toISOString()
            }));

            // Batch upsert with error handling
            for (const validatedAward of validatedAwards) {
                const { error } = await supabase
                    .from('admin_weekly_points')
                    .upsert(validatedAward, {
                        onConflict: 'user_id,week_start'
                    });

                if (error) {
                    throw new Error(`Failed to save award for user: ${error.message}`);
                }
            }

            setSaved(true);

        } catch (error: any) {
            console.error('Error saving awards:', error);
            alert(`Failed to save awards: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const current = new Date(weekStart);
        current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
        setWeekStart(getWeekStart(current));
    };

    const isCurrentWeek = weekStart === getWeekStart(new Date());

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase text-zinc-900 flex items-center gap-3">
                        <Award className="h-7 w-7 text-[#FF5E00]" />
                        Weekly Points
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Award 0-10 points per category (max 30/week per participant)
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "px-6 py-3 rounded-xl font-black text-sm uppercase flex items-center gap-2 transition-all",
                        saved
                            ? "bg-emerald-500 text-white"
                            : "bg-[#FF5E00] text-white hover:bg-orange-600",
                        saving && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : saved ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
                </button>
            </div>

            {/* Week Selector */}
            <div className="flex items-center justify-center gap-4 bg-zinc-50 rounded-2xl p-4">
                <button
                    onClick={() => navigateWeek('prev')}
                    className="p-2 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                    <ChevronLeft className="h-6 w-6 text-zinc-600" />
                </button>
                <div className="text-center">
                    <p className="text-lg font-black text-zinc-900">{formatWeekRange(weekStart)}</p>
                    {isCurrentWeek && (
                        <span className="text-xs font-bold text-[#FF5E00] uppercase">Current Week</span>
                    )}
                </div>
                <button
                    onClick={() => navigateWeek('next')}
                    disabled={isCurrentWeek}
                    className={cn(
                        "p-2 rounded-xl transition-colors",
                        isCurrentWeek ? "opacity-30 cursor-not-allowed" : "hover:bg-zinc-200"
                    )}
                >
                    <ChevronRight className="h-6 w-6 text-zinc-600" />
                </button>
            </div>

            {/* Participants List */}
            <div className="space-y-4">
                {participants.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 rounded-2xl">
                        <Users className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                        <p className="text-zinc-500 font-medium">No participants found</p>
                    </div>
                ) : (
                    participants.map((participant) => {
                        const award = awards[participant.user_id] || { consistency: 0, effort: 0, community: 0, notes: '' };
                        const total = award.consistency + award.effort + award.community;

                        return (
                            <div
                                key={participant.user_id}
                                className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-[#FF5E00]/30 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-[#FF5E00]/10 flex items-center justify-center">
                                            <span className="text-lg font-black text-[#FF5E00]">
                                                {(participant.display_name || participant.full_name)?.[0]?.toUpperCase() || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-zinc-900">
                                                {participant.display_name || participant.full_name}
                                            </h3>
                                            <p className="text-xs text-zinc-500">
                                                Total: {participant.total_points} pts
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn(
                                            "text-2xl font-black",
                                            total > 0 ? "text-[#FF5E00]" : "text-zinc-300"
                                        )}>
                                            +{total}
                                        </span>
                                        <p className="text-xs text-zinc-500 uppercase font-bold">This Week</p>
                                    </div>
                                </div>

                                {/* Point Sliders */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {/* Consistency */}
                                    <div>
                                        <label className="block text-xs font-black uppercase text-zinc-500 mb-2">
                                            Consistency
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                value={award.consistency}
                                                onChange={(e) => updateAward(participant.user_id, 'consistency', parseInt(e.target.value))}
                                                className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#FF5E00]"
                                            />
                                            <span className="w-8 text-center font-black text-zinc-900">{award.consistency}</span>
                                        </div>
                                    </div>

                                    {/* Effort */}
                                    <div>
                                        <label className="block text-xs font-black uppercase text-zinc-500 mb-2">
                                            Effort
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                value={award.effort}
                                                onChange={(e) => updateAward(participant.user_id, 'effort', parseInt(e.target.value))}
                                                className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                            />
                                            <span className="w-8 text-center font-black text-zinc-900">{award.effort}</span>
                                        </div>
                                    </div>

                                    {/* Community */}
                                    <div>
                                        <label className="block text-xs font-black uppercase text-zinc-500 mb-2">
                                            Community
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                value={award.community}
                                                onChange={(e) => updateAward(participant.user_id, 'community', parseInt(e.target.value))}
                                                className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                            <span className="w-8 text-center font-black text-zinc-900">{award.community}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <input
                                    type="text"
                                    placeholder="Optional notes..."
                                    value={award.notes}
                                    onChange={(e) => updateAward(participant.user_id, 'notes', e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#FF5E00]"
                                />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
