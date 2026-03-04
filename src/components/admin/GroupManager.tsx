'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Check, X, Shield, Lock, Clipboard, UserPlus, ArrowLeft, Activity, Target, ChevronRight, Trash2, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import ActivityConfiguration from './ActivityConfiguration';
import MemberGoalAssignment from './MemberGoalAssignment';

interface Group {
    id: string;
    name: string;
    code: string;
    admin_id: string;
    created_at: string;
    start_date?: string | null;
    end_date?: string | null;
    member_count?: number;
    pending_count?: number;
}

interface PendingMember {
    id: string;
    user_id: string;
    group_id: string;
    status: string;
    created_at: string;
    profiles: {
        first_name: string;
        last_name: string;
        full_name: string;
    };
    groups: {
        name: string;
    };
}

interface RosterMember {
    membership_id: string;
    user_id: string;
    full_name: string;
    display_name: string;
    total_points: number;
    created_at: string;
}

type SquadSubTab = 'roster' | 'activities' | 'goals' | 'pending';

export default function GroupManager() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newGroupName, setNewGroupName] = useState('');

    // Squad detail view
    const [selectedSquad, setSelectedSquad] = useState<Group | null>(null);
    const [squadSubTab, setSquadSubTab] = useState<SquadSubTab>('roster');
    const [rosterMembers, setRosterMembers] = useState<RosterMember[]>([]);
    const [rosterLoading, setRosterLoading] = useState(false);

    const fetchGroups = async () => {
        const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('*')
            .order('created_at', { ascending: false });

        if (!groupsError) {
            const groupsWithCounts = await Promise.all((groupsData || []).map(async (group) => {
                const { count: memberCount } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id)
                    .eq('status', 'approved');

                const { count: pendingCount } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id)
                    .eq('status', 'pending');

                return { ...group, member_count: memberCount || 0, pending_count: pendingCount || 0 };
            }));
            setGroups(groupsWithCounts);
        }

        // Fetch all pending members
        const { data: pendingData, error: pendingError } = await supabase
            .from('group_members')
            .select(`
                id, user_id, group_id, status, created_at,
                profiles ( first_name, last_name, full_name ),
                groups ( name )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (!pendingError) setPendingMembers(pendingData as any || []);
        setLoading(false);
    };

    const fetchRoster = async (groupId: string) => {
        setRosterLoading(true);
        const { data } = await supabase
            .from('group_members')
            .select(`
                id,
                user_id,
                created_at,
                profiles!inner (
                    id, full_name, display_name, total_points
                )
            `)
            .eq('group_id', groupId)
            .eq('status', 'approved')
            .order('created_at', { ascending: true });

        if (data) {
            setRosterMembers(data.map((m: any) => ({
                membership_id: m.id,
                user_id: m.user_id,
                full_name: m.profiles.full_name || 'Unknown',
                display_name: m.profiles.display_name || m.profiles.full_name || 'Unknown',
                total_points: m.profiles.total_points || 0,
                created_at: m.created_at
            })));
        }
        setRosterLoading(false);
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        if (selectedSquad) {
            fetchRoster(selectedSquad.id);
        }
    }, [selectedSquad]);

    const createGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert('You must be logged in to create a group');

        const { error } = await supabase.from('groups').insert([{
            name: newGroupName, code, admin_id: user.id
        }]);

        if (!error) {
            setIsAdding(false);
            setNewGroupName('');
            fetchGroups();
        } else {
            alert('Error creating group: ' + error.message);
        }
    };

    const moderateMember = async (memberId: string, approve: boolean) => {
        if (approve) {
            const { data: memberData } = await supabase
                .from('group_members')
                .select('user_id')
                .eq('id', memberId)
                .single();
            if (!memberData) return;

            const { error: memberError } = await supabase
                .from('group_members')
                .update({ status: 'approved' })
                .eq('id', memberId);

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    status: 'approved',
                    total_points: 0,
                    streak_bonus_points: 0,
                    current_checkin_streak: 0,
                    current_workout_streak: 0,
                    current_clean_streak: 0,
                    longest_checkin_streak: 0,
                    longest_workout_streak: 0,
                    longest_clean_streak: 0,
                    last_streak_calculation: null
                })
                .eq('id', memberData.user_id);

            if (!memberError && !profileError) {
                fetchGroups();
                if (selectedSquad) fetchRoster(selectedSquad.id);
            } else {
                alert('Error approving member: ' + (memberError?.message || profileError?.message));
            }
        } else {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('id', memberId);
            if (!error) fetchGroups();
        }
    };

    const removeMember = async (membershipId: string, userId: string, name: string) => {
        if (!confirm(`Remove ${name} from ${selectedSquad?.name}? This cannot be undone.`)) return;

        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('id', membershipId);

        if (!error) {
            // Also set profile status back to pending
            await supabase
                .from('profiles')
                .update({ status: 'pending' })
                .eq('id', userId);

            fetchGroups();
            if (selectedSquad) fetchRoster(selectedSquad.id);
        } else {
            alert('Error removing member: ' + error.message);
        }
    };

    const openSquadDetail = (group: Group) => {
        setSelectedSquad(group);
        setSquadSubTab('roster');
    };

    // ─── SQUAD DETAIL VIEW ──────────────────────────────────
    if (selectedSquad) {
        const squadPending = pendingMembers.filter(m => m.group_id === selectedSquad.id);

        const subTabs: { id: SquadSubTab; label: string; icon: typeof Users; count?: number }[] = [
            { id: 'roster', label: 'Roster', icon: Users, count: rosterMembers.length },
            { id: 'activities', label: 'Activities', icon: Activity },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'pending', label: 'Pending', icon: UserPlus, count: squadPending.length },
        ];

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Back + Header */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setSelectedSquad(null)}
                        className="h-12 w-12 bg-zinc-100 hover:bg-zinc-200 rounded-2xl flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-zinc-600" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 font-heading leading-none">
                            {selectedSquad.name} <span className="text-[#FF5E00]">HQ</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-1">
                            Code: {selectedSquad.code} • {rosterMembers.length} members
                        </p>
                    </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-3">
                    {subTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSquadSubTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-300",
                                squadSubTab === tab.id
                                    ? "bg-zinc-900 text-white shadow-lg"
                                    : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 border border-zinc-100"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={cn(
                                    "ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black",
                                    squadSubTab === tab.id
                                        ? "bg-[#FF5E00] text-white"
                                        : tab.id === 'pending' ? "bg-[#FF5E00]/10 text-[#FF5E00]" : "bg-zinc-200 text-zinc-500"
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Sub-tab Content */}
                <div className="animate-in fade-in duration-300">
                    {/* ─── ROSTER TAB ─── */}
                    {squadSubTab === 'roster' && (
                        <div className="premium-card rounded-[2.5rem] p-8">
                            <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 mb-6 flex items-center gap-3">
                                <Users className="h-5 w-5 text-[#FF5E00]" />
                                Active Members
                            </h3>

                            {rosterLoading ? (
                                <div className="text-center py-12">
                                    <div className="h-8 w-8 border-3 border-[#FF5E00] border-t-transparent rounded-full animate-spin mx-auto" />
                                </div>
                            ) : rosterMembers.length === 0 ? (
                                <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                                    <Users className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
                                    <p className="text-zinc-400 font-bold text-sm">No approved members yet</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-zinc-100">
                                    <table className="w-full">
                                        <thead className="bg-zinc-50 border-b border-zinc-100">
                                            <tr>
                                                <th className="text-left p-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">#</th>
                                                <th className="text-left p-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Member</th>
                                                <th className="text-right p-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Points</th>
                                                <th className="text-right p-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Joined</th>
                                                <th className="text-right p-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-50">
                                            {rosterMembers
                                                .sort((a, b) => b.total_points - a.total_points)
                                                .map((member, idx) => (
                                                    <tr key={member.membership_id} className="hover:bg-zinc-50/50 transition-colors">
                                                        <td className="p-4">
                                                            {idx === 0 ? (
                                                                <Trophy className="h-5 w-5 text-yellow-500" />
                                                            ) : (
                                                                <span className="text-sm font-bold text-zinc-400">{idx + 1}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                                                                    <span className="text-xs font-black text-zinc-500">
                                                                        {member.display_name?.[0] || 'U'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-zinc-900">{member.full_name}</p>
                                                                    {member.display_name !== member.full_name && (
                                                                        <p className="text-[10px] text-zinc-400 font-medium">{member.display_name}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="font-black text-[#FF5E00]">{member.total_points}</span>
                                                            <span className="text-[9px] text-zinc-400 ml-1">PTS</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="text-xs text-zinc-400 font-medium">
                                                                {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => removeMember(member.membership_id, member.user_id, member.full_name)}
                                                                className="h-8 w-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                                                title="Remove member"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── ACTIVITIES TAB ─── */}
                    {squadSubTab === 'activities' && (
                        <ActivityConfiguration squadId={selectedSquad.id} squadName={selectedSquad.name} />
                    )}

                    {/* ─── GOALS TAB ─── */}
                    {squadSubTab === 'goals' && (
                        <MemberGoalAssignment squadId={selectedSquad.id} squadName={selectedSquad.name} />
                    )}

                    {/* ─── PENDING TAB ─── */}
                    {squadSubTab === 'pending' && (
                        <div className="premium-card rounded-[2.5rem] p-8">
                            <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 mb-6 flex items-center gap-3">
                                <UserPlus className="h-5 w-5 text-emerald-500" />
                                Pending Approvals
                            </h3>

                            {squadPending.length === 0 ? (
                                <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                                    <Lock className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
                                    <p className="text-zinc-300 font-black uppercase tracking-[0.3em] text-[10px]">No pending requests</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {squadPending.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-6 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-emerald-500 shadow-sm">
                                                    <UserPlus className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black italic uppercase font-heading text-zinc-900">
                                                        {member.profiles.first_name} {member.profiles.last_name || ''}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                        Applied {new Date(member.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => moderateMember(member.id, true)}
                                                    className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center border border-emerald-100"
                                                >
                                                    <Check className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => moderateMember(member.id, false)}
                                                    className="h-12 w-12 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── SQUAD LIST VIEW ──────────────────────────────────
    return (
        <div className="space-y-12">
            {/* Groups Grid */}
            <section className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5E00]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-[#FF5E00]/10 transition-colors duration-1000" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <Users className="h-7 w-7 text-[#FF5E00]" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                                SQUAD <span className="text-[#FF5E00]">COMMAND</span>
                            </h2>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Select a squad to manage roster, activities & goals</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={cn(
                            "primary-glow flex items-center gap-3 font-black px-8 py-4 rounded-[1.5rem] transition-all italic uppercase tracking-tight font-heading group/btn",
                            isAdding ? "bg-zinc-100 text-zinc-500 shadow-none border border-zinc-200" : "bg-[#FF5E00] text-white"
                        )}
                    >
                        {isAdding ? 'Cancel' : <><Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform" /> Create Squad</>}
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={createGroup} className="mb-12 bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] p-8 flex gap-4 animate-in slide-in-from-top-4 duration-500">
                        <input
                            type="text"
                            placeholder="SQUAD IDENTIFIER (e.g., PHANTOM)"
                            required
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="flex-1 bg-white border border-zinc-100 rounded-[1.25rem] px-8 py-4 text-zinc-900 font-black focus:outline-none focus:border-[#FF5E00]/30 focus:ring-8 focus:ring-[#FF5E00]/5 transition-all shadow-sm uppercase tracking-widest text-xs"
                        />
                        <button type="submit" className="bg-zinc-900 text-white font-black italic px-10 py-4 rounded-[1.25rem] hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] font-heading">
                            CREATE
                        </button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {groups.map((group) => (
                        <button
                            key={group.id}
                            onClick={() => openSquadDetail(group)}
                            className="text-left bg-zinc-50/50 p-8 rounded-[2.5rem] border border-zinc-100 hover:border-[#FF5E00]/30 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-500 space-y-6 group/card"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-zinc-900 italic tracking-tight uppercase font-heading group-hover/card:text-[#FF5E00] transition-colors">{group.name}</h3>
                                <ChevronRight className="h-5 w-5 text-zinc-300 group-hover/card:text-[#FF5E00] group-hover/card:translate-x-1 transition-all" />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-zinc-100 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">ACCESS TOKEN</span>
                                    <span className="text-lg font-black text-[#FF5E00] font-mono tracking-[0.2em]">{group.code}</span>
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(group.code);
                                    }}
                                    className="h-10 w-10 flex items-center justify-center text-zinc-300 hover:text-zinc-900 bg-zinc-50 rounded-xl transition-colors hover:bg-zinc-100 cursor-pointer"
                                >
                                    <Clipboard className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-100">
                                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                                    <span className="text-xs font-bold text-zinc-600">{group.member_count} members</span>
                                </div>
                                {group.pending_count! > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF5E00]/10 border border-[#FF5E00]/20 animate-pulse">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF5E00]" />
                                        <span className="text-[10px] font-black text-[#FF5E00] uppercase tracking-widest">{group.pending_count} pending</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Global Approval Queue (for pending from ALL squads) */}
            {pendingMembers.length > 0 && (
                <section className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden">
                    <div className="flex items-center gap-5 mb-10">
                        <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm">
                            <UserPlus className="h-7 w-7 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                                APPROVAL <span className="text-emerald-500">QUEUE</span>
                            </h2>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">{pendingMembers.length} waiting across all squads</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingMembers.map((member) => (
                            <div key={member.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-zinc-50/50 border border-zinc-100 hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-emerald-500 shadow-sm">
                                        <UserPlus className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black italic uppercase font-heading text-zinc-900">
                                            {member.profiles.first_name} {member.profiles.last_name || ''}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Wants to join </span>
                                            <span className="text-[10px] font-black text-[#FF5E00] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{member.groups.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-4 md:mt-0">
                                    <button
                                        onClick={() => moderateMember(member.id, true)}
                                        className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center border border-emerald-100"
                                    >
                                        <Check className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={() => moderateMember(member.id, false)}
                                        className="h-14 w-14 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
