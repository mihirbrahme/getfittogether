'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Trophy, Medal, Crown, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SquadMember {
    id: string;
    display_name: string | null;
    full_name: string | null;
    total_points: number;
}

export default function SquadPage() {
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<SquadMember[]>([]);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [squadName, setSquadName] = useState<string>('Squad');

    useEffect(() => {
        const fetchSquadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user.id);

            // 1. Get User's Group ID
            const { data: membership } = await supabase
                .from('group_members')
                .select('group_id, groups(name)')
                .eq('user_id', user.id)
                .single();

            if (membership) {
                // @ts-ignore
                setSquadName(membership.groups?.name || 'Squad');

                // 2. Fetch all members of this group with their profiles
                const { data: squadMembers, error } = await supabase
                    .from('group_members')
                    .select(`
                        user_id,
                        profiles (
                            id,
                            display_name,
                            full_name,
                            total_points
                        )
                    `)
                    .eq('group_id', membership.group_id);

                if (squadMembers) {
                    // flatten and sort
                    const formattedMembers = squadMembers.map((m: any) => ({
                        id: m.profiles.id,
                        display_name: m.profiles.display_name,
                        full_name: m.profiles.full_name,
                        total_points: m.profiles.total_points || 0
                    })).sort((a, b) => b.total_points - a.total_points);

                    setMembers(formattedMembers);
                }
            }
            setLoading(false);
        };
        fetchSquadData();
    }, []);

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black italic uppercase text-zinc-900">{squadName}</h1>
                    <p className="text-zinc-500 font-medium text-xs tracking-widest uppercase">Leaderboard</p>
                </div>
                <div className="h-12 w-12 bg-[#FF5E00]/10 rounded-2xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-[#FF5E00]" />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="p-4 pl-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest w-16">Rank</th>
                                <th className="p-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Soldier</th>
                                <th className="p-4 pr-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {members.map((member, index) => {
                                const isMe = member.id === currentUser;
                                const rank = index + 1;

                                return (
                                    <tr key={member.id} className={cn("transition-colors", isMe ? "bg-orange-50/50" : "hover:bg-zinc-50/50")}>
                                        <td className="p-4 pl-6">
                                            {rank === 1 ? (
                                                <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                                            ) : rank === 2 ? (
                                                <Medal className="h-6 w-6 text-zinc-400 fill-zinc-400" />
                                            ) : rank === 3 ? (
                                                <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />
                                            ) : (
                                                <span className="text-sm font-bold text-zinc-400 w-6 text-center inline-block">{rank}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border", isMe ? "bg-[#FF5E00] border-[#FF5E00] text-white" : "bg-white border-zinc-200 text-zinc-400")}>
                                                    <span className="text-xs font-black">{member.display_name?.[0] || member.full_name?.[0] || 'U'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={cn("text-sm font-bold uppercase", isMe ? "text-[#FF5E00]" : "text-zinc-900")}>
                                                        {member.display_name || member.full_name || 'Unknown Soldier'}
                                                        {isMe && <span className="ml-2 text-[9px] bg-[#FF5E00] text-white px-1.5 py-0.5 rounded uppercase">You</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <span className="text-xl font-black italic text-zinc-900 tracking-tighter">{member.total_points}</span>
                                            <span className="text-[9px] font-bold text-zinc-400 ml-1">PTS</span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
