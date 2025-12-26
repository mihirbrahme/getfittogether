'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Participant {
    id: string;
    full_name: string;
    total_points: number;
    rank?: number;
}

export default function Leaderboard() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, total_points')
            .order('total_points', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching leaderboard:', error);
        } else {
            setParticipants(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeaderboard();

        // Subscribe to changes in profiles table for real-time updates
        const channel = supabase
            .channel('public:profiles')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    fetchLeaderboard();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return (
            <div className="glass rounded-3xl p-8 animate-pulse">
                <div className="h-8 w-48 bg-white/10 rounded-lg mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-white/5 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="premium-card rounded-[3.5rem] p-10 lg:col-span-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5E00]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-[#FF5E00]/10 transition-colors duration-1000" />

            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#FF5E00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF5E00]/20">
                        <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter uppercase font-heading leading-none mb-1">
                            TOP <span className="text-[#FF5E00]">PERFORMERS</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Global Community Rankings</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Updates Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {participants.map((user, index) => {
                    const rank = index + 1;

                    return (
                        <div
                            key={user.id}
                            className={cn(
                                "flex items-center justify-between p-6 rounded-[2.5rem] transition-all duration-500 border relative group/item",
                                rank === 1 ? "bg-white border-amber-400 shadow-[0_20px_50px_rgba(251,191,36,0.15)] scale-[1.02]" :
                                    rank === 2 ? "bg-white border-zinc-200 shadow-xl shadow-zinc-100 scale-[1.01]" :
                                        rank === 3 ? "bg-white border-orange-200 shadow-xl shadow-orange-50 scale-[1.01]" :
                                            "bg-zinc-50/50 border-zinc-100 hover:bg-white hover:border-zinc-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-zinc-100"
                            )}
                        >
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-black italic text-xl shadow-inner border transition-transform duration-500 group-hover/item:rotate-3",
                                    rank === 1 ? "bg-amber-400 text-white border-amber-500 shadow-amber-200" :
                                        rank === 2 ? "bg-zinc-100 text-zinc-400 border-zinc-200" :
                                            rank === 3 ? "bg-orange-300 text-white border-orange-400 shadow-orange-100" :
                                                "bg-white text-zinc-300 border-zinc-100"
                                )}>
                                    {rank}
                                    {rank === 1 && (
                                        <div className="absolute -top-3 -right-3">
                                            <div className="relative">
                                                <Star className="h-8 w-8 fill-amber-400 text-white animate-pulse" />
                                                <div className="absolute inset-0 bg-amber-400 blur-lg opacity-50 animate-pulse" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className={cn(
                                        "font-heading font-black italic uppercase tracking-tight text-lg leading-none mb-1",
                                        rank === 1 ? "text-amber-600" : "text-zinc-900"
                                    )}>{user.full_name || 'Anonymous'}</span>
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{rank <= 3 ? 'ELITE MEMBER' : 'ACTIVE MEMBER'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={cn(
                                    "text-2xl font-black italic tracking-tighter leading-none mb-1",
                                    rank === 1 ? "text-amber-500" : "text-[#FF5E00]"
                                )}>
                                    {user.total_points.toLocaleString()}
                                </span>
                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">TOTAL POINTS</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {participants.length === 0 && (
                <div className="text-center py-24 bg-zinc-50/50 rounded-[3rem] border border-dashed border-zinc-200">
                    <p className="text-zinc-300 font-black uppercase tracking-[0.3em] text-[10px]">Awaiting First Data Check-In...</p>
                </div>
            )}
        </section>
    );
}
