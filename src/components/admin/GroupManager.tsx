'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Check, X, Shield, Lock, Clipboard, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Group {
    id: string;
    name: string;
    code: string;
    admin_id: string;
    created_at: string;
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
        id, user_id, group_id, status, created_at,
        profiles ( full_name ),
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
        const { error } = approve
            ? await supabase.from('group_members').update({ status: 'approved' }).eq('id', memberId)
            : await supabase.from('group_members').delete().eq('id', memberId);

        if (!error) fetchGroups();
    };

    return (
        <div className="space-y-8">
            {/* Groups Grid */}
            <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Squad Management</h2>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Create groups & generate join codes</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-primary/20"
                    >
                        {isAdding ? 'CANCEL' : <Plus className="h-5 w-5" />}
                        {!isAdding && 'NEW GROUP'}
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={createGroup} className="mb-10 bg-white/5 border border-white/10 rounded-3xl p-6 flex gap-4 animate-in slide-in-from-top-4 duration-300">
                        <input
                            type="text"
                            placeholder="Enter Squad Name..."
                            required
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                        />
                        <button
                            type="submit"
                            className="bg-white text-black font-black italic px-8 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
                        >
                            CREATE
                        </button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div key={group.id} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-white italic tracking-tight uppercase">{group.name}</h3>
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Shield className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 group">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Join Code</span>
                                    <span className="text-sm font-black text-primary font-mono tracking-widest">{group.code}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(group.code);
                                        alert('Code copied!');
                                    }}
                                    className="p-2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    <Clipboard className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-zinc-500" />
                                    <span className="text-xs font-bold text-white">{group.member_count} Members</span>
                                </div>
                                {group.pending_count! > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning/20 border border-warning/30">
                                        <div className="h-1 w-1 rounded-full bg-warning animate-pulse" />
                                        <span className="text-[10px] font-black text-warning uppercase">{group.pending_count} PENDING</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Approval Queue */}
            <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-6">Approval Queue</h2>
                {pendingMembers.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Lock className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest">Queue is clear</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <UserPlus className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black italic uppercase leading-none mb-1">{member.profiles.full_name || 'Anonymous User'}</h4>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Wants to join <span className="text-primary">{member.groups.name}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => moderateMember(member.id, true)}
                                        className="p-3 bg-success/20 text-success rounded-xl hover:bg-success hover:text-black transition-all"
                                    >
                                        <Check className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => moderateMember(member.id, false)}
                                        className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
