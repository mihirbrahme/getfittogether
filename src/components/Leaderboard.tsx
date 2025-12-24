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
        <section className="glass rounded-3xl p-8 lg:col-span-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 italic tracking-tight">
                <Trophy className="h-6 w-6 text-warning" />
                TOP CHALLENGERS
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {participants.map((user, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;

                    return (
                        <div
                            key={user.id}
                            className={cn(
                                "glass-card flex items-center justify-between p-5 rounded-2xl transition-all hover:scale-[1.02]",
                                rank === 1 && "border-warning/30 bg-warning/5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "relative flex h-10 w-10 items-center justify-center rounded-full font-black italic text-lg",
                                    rank === 1 ? "bg-warning text-black" :
                                        rank === 2 ? "bg-zinc-300 text-black" :
                                            rank === 3 ? "bg-orange-400 text-black" :
                                                "bg-white/10 text-white"
                                )}>
                                    {rank}
                                    {rank === 1 && <Star className="absolute -top-1 -right-1 h-4 w-4 fill-warning text-warning animate-spin-slow" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white tracking-tight">{user.full_name || 'Anonymous'}</span>
                                    {rank === 1 && <span className="text-[10px] text-warning font-black uppercase tracking-widest">Current Leader</span>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xl font-black text-primary italic">
                                    {user.total_points.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter leading-none">PTS</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {participants.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-zinc-500 font-bold uppercase tracking-widest">No challengers yet. Be the first!</p>
                </div>
            )}
        </section>
    );
}
