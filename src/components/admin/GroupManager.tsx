'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Check, X, Shield, Lock, Clipboard, UserPlus, Settings, Target } from 'lucide-react';
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

export default function GroupManager() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedSquad, setSelectedSquad] = useState<string | null>(null);
    const [configTab, setConfigTab] = useState<'activities' | 'goals'>('activities');
    const [editingDates, setEditingDates] = useState<string | null>(null);
    const [tempDates, setTempDates] = useState<{ start: string, end: string }>({ start: '', end: '' });

    const fetchGroups = async () => {
        // In a real app, we'd use a more complex query or multiple calls to get counts
        // For now, let's just get the groups
        const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('*')
            .order('created_at', { ascending: false });

        if (!groupsError) {
            // Get counts for each group
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

        // Fetch pending members for the approval queue
        const { data: pendingData, error: pendingError } = await supabase
            .from('group_members')
            .select(`
                id,
                user_id,
                group_id,
                status,
                created_at,
                profiles (
                    first_name,
                    last_name,
                    full_name
                ),
                groups ( name )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (!pendingError) setPendingMembers(pendingData as any || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const createGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return alert('You must be logged in to create a group');

        const { error } = await supabase.from('groups').insert([{
            name: newGroupName,
            code: code,
            admin_id: user.id
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
            // Get the user_id from the group_member record
            const { data: memberData } = await supabase
                .from('group_members')
                .select('user_id')
                .eq('id', memberId)
                .single();

            if (!memberData) return;

            // Update both group_members and profile status
            const { error: memberError } = await supabase
                .from('group_members')
                .update({ status: 'approved' })
                .eq('id', memberId);

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ status: 'approved' })
                .eq('id', memberData.user_id);

            if (!memberError && !profileError) {
                fetchGroups();
            } else {
                alert('Error approving member: ' + (memberError?.message || profileError?.message));
            }
        } else {
            // Reject: delete group membership
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('id', memberId);

            if (!error) fetchGroups();
        }
    };

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
                                SQUAD <span className="text-[#FF5E00]">REGISTRY</span>
                            </h2>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Unit Identification & Access Control</p>
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
                        <button
                            type="submit"
                            className="bg-zinc-900 text-white font-black italic px-10 py-4 rounded-[1.25rem] hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] font-heading"
                        >
                            CREATE
                        </button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {groups.map((group) => (
                        <div key={group.id} className="bg-zinc-50/50 p-8 rounded-[2.5rem] border border-zinc-100 hover:border-[#FF5E00]/30 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-500 space-y-6 group/card">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-zinc-900 italic tracking-tight uppercase font-heading group-hover/card:text-[#FF5E00] transition-colors">{group.name}</h3>
                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-[#FF5E00] shadow-sm border border-zinc-100 group-hover/card:scale-110 transition-transform">
                                    <Shield className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm group-hover/card:border-[#FF5E00]/20 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">ACCESS TOKEN</span>
                                    <span className="text-lg font-black text-[#FF5E00] font-mono tracking-[0.2em]">{group.code}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(group.code);
                                        // Simplified alert or toast would be better but keeping consistency
                                    }}
                                    className="h-10 w-10 flex items-center justify-center text-zinc-300 hover:text-zinc-900 bg-zinc-50 rounded-xl transition-colors hover:bg-zinc-100"
                                >
                                    <Clipboard className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Programme Dates */}
                            {editingDates === group.id ? (
                                <div className="space-y-3 p-4 bg-white rounded-xl border border-zinc-200">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={tempDates.start}
                                            onChange={(e) => setTempDates({ ...tempDates, start: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">End Date (56 days)</label>
                                        <input
                                            type="date"
                                            value={tempDates.end}
                                            onChange={(e) => setTempDates({ ...tempDates, end: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm font-medium"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                const { error } = await supabase
                                                    .from('groups')
                                                    .update({
                                                        start_date: tempDates.start || null,
                                                        end_date: tempDates.end || null
                                                    })
                                                    .eq('id', group.id);
                                                if (!error) {
                                                    setEditingDates(null);
                                                    fetchGroups();
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 text-white font-bold text-xs uppercase hover:bg-emerald-600 transition-all"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingDates(null)}
                                            className="px-3 py-2 rounded-lg bg-zinc-100 text-zinc-600 font-bold text-xs uppercase hover:bg-zinc-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-400 font-bold uppercase">Programme:</span>
                                        <button
                                            onClick={() => {
                                                setEditingDates(group.id);
                                                setTempDates({
                                                    start: group.start_date || '',
                                                    end: group.end_date || ''
                                                });
                                            }}
                                            className="text-blue-600 hover:text-blue-700 font-bold uppercase"
                                        >
                                            {group.start_date ? 'Edit' : 'Set Dates'}
                                        </button>
                                    </div>
                                    {group.start_date && (
                                        <div className="text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Start:</span>
                                                <span className="font-mono font-bold">{new Date(group.start_date).toLocaleDateString()}</span>
                                            </div>
                                            {group.end_date && (
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">End:</span>
                                                    <span className="font-mono font-bold">{new Date(group.end_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedSquad(group.id)}
                                    className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all font-black uppercase text-xs flex items-center gap-2"
                                    title="Configure Activities & Goals"
                                >
                                    <Settings className="h-4 w-4" />
                                    Config
                                </button>
                                {group.pending_count! > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FF5E00]/10 border border-[#FF5E00]/20 shadow-sm animate-pulse">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF5E00]" />
                                        <span className="text-[10px] font-black text-[#FF5E00] uppercase tracking-widest">{group.pending_count} PENDING</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Approval Queue */}
            <section className="premium-card rounded-[3.5rem] p-12 relative overflow-hidden group">
                <div className="flex items-center gap-5 mb-10">
                    <div className="h-14 w-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm">
                        <UserPlus className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                            APPROVAL <span className="text-emerald-500">QUEUE</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Waiting for Approval</p>
                    </div>
                </div>

                {pendingMembers.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50/50 rounded-[3rem] border border-dashed border-zinc-200">
                        <Lock className="h-12 w-12 text-zinc-200 mx-auto mb-6" />
                        <h3 className="text-zinc-300 font-black uppercase tracking-[0.5em] text-[10px]">Queue Status: All Synchronized</h3>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pendingMembers.map((member) => (
                            <div key={member.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 rounded-[2.5rem] bg-zinc-50/50 border border-zinc-100 hover:border-zinc-200 transition-all group/item">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-emerald-500 shadow-sm group-hover/item:scale-110 transition-transform">
                                        <UserPlus className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black italic uppercase font-heading leading-none text-zinc-900 mb-2">
                                            {member.profiles.first_name} {member.profiles.last_name || ''}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">WANTS TO JOIN </span>
                                            <span className="text-[10px] font-black text-[#FF5E00] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{member.groups.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-6 md:mt-0">
                                    <button
                                        onClick={() => moderateMember(member.id, true)}
                                        className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-emerald-100"
                                    >
                                        <Check className="h-7 w-7" />
                                    </button>
                                    <button
                                        onClick={() => moderateMember(member.id, false)}
                                        className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-red-100"
                                    >
                                        <X className="h-7 w-7" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Squad Configuration Modal */}
            {selectedSquad && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSquad(null)}>
                    <div className="bg-white rounded-[3rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white p-8 border-b border-zinc-100 rounded-t-[3rem] z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase text-zinc-900">
                                        {groups.find(g => g.id === selectedSquad)?.name} Config
                                    </h3>
                                    <p className="text-sm text-zinc-500">Configure activities and goals</p>
                                </div>
                                <button
                                    onClick={() => setSelectedSquad(null)}
                                    className="h-12 w-12 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setConfigTab('activities')}
                                    className={cn(
                                        "px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-2",
                                        configTab === 'activities' ? "bg-[#FF5E00] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                    )}
                                >
                                    <Settings className="h-4 w-4" />
                                    Activities
                                </button>
                                <button
                                    onClick={() => setConfigTab('goals')}
                                    className={cn(
                                        "px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-2",
                                        configTab === 'goals' ? "bg-[#FF5E00] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                    )}
                                >
                                    <Target className="h-4 w-4" />
                                    Goals
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            {configTab === 'activities' && (
                                <ActivityConfiguration squadId={selectedSquad} squadName={groups.find(g => g.id === selectedSquad)?.name || ''} />
                            )}
                            {configTab === 'goals' && (
                                <MemberGoalAssignment squadId={selectedSquad} squadName={groups.find(g => g.id === selectedSquad)?.name || ''} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
