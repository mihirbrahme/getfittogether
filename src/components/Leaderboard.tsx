'use client';

import { useEffect, useState, useRef } from 'react';
import { Trophy, Star, User } from 'lucide-react';
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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const userRowRef = useRef<HTMLDivElement>(null);

    const fetchLeaderboard = async () => {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
        }

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

    // Scroll to user's position when loaded
    useEffect(() => {
        if (!loading && userRowRef.current) {
            userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [loading, participants]);

    if (loading) {
        return (
            <div className="premium-card rounded-[3rem] p-8 animate-pulse">
                <div className="h-8 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="premium-card rounded-[3rem] p-8 lg:p-10 lg:col-span-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5E00]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-[#FF5E00]/10 transition-colors duration-1000" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#FF5E00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF5E00]/20">
                        <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-100 italic tracking-tighter uppercase font-heading leading-none mb-1">
                            TOP <span className="text-[#FF5E00]">PERFORMERS</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Global Community Rankings</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Live Updates</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 animate-stagger">
                {participants.map((user, index) => {
                    const rank = index + 1;
                    const isCurrentUser = user.id === currentUserId;

                    return (
                        <div
                            key={user.id}
                            ref={isCurrentUser ? userRowRef : null}
                            className={cn(
                                "flex items-center justify-between p-5 rounded-[2rem] transition-all duration-500 border relative group/item",
                                // Current user highlight
                                isCurrentUser && "ring-2 ring-[#FF5E00] ring-offset-2 dark:ring-offset-zinc-900",
                                // Rank-based styling
                                rank === 1 ? "bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/10 dark:to-zinc-900 border-amber-400 shadow-[0_15px_40px_rgba(251,191,36,0.15)] scale-[1.02]" :
                                    rank === 2 ? "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 shadow-lg shadow-zinc-100 dark:shadow-none scale-[1.01]" :
                                        rank === 3 ? "bg-gradient-to-r from-orange-50 to-white dark:from-orange-500/10 dark:to-zinc-900 border-orange-200 dark:border-orange-500/30 shadow-lg shadow-orange-50 dark:shadow-none scale-[1.01]" :
                                            "bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-600 hover:scale-[1.02] hover:shadow-lg"
                            )}
                        >
                            {/* "YOU" indicator */}
                            {isCurrentUser && (
                                <div className="absolute -top-2 -right-2 bg-[#FF5E00] text-white text-[9px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    YOU
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-black italic text-lg shadow-inner border transition-transform duration-500 group-hover/item:rotate-3",
                                    rank === 1 ? "bg-amber-400 text-white border-amber-500 shadow-amber-200" :
                                        rank === 2 ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600" :
                                            rank === 3 ? "bg-orange-300 text-white border-orange-400 shadow-orange-100" :
                                                "bg-white dark:bg-zinc-800 text-zinc-300 dark:text-zinc-500 border-zinc-100 dark:border-zinc-700"
                                )}>
                                    {rank}
                                    {rank === 1 && (
                                        <div className="absolute -top-2 -right-2">
                                            <div className="relative">
                                                <Star className="h-6 w-6 fill-amber-400 text-white animate-pulse" />
                                                <div className="absolute inset-0 bg-amber-400 blur-lg opacity-50 animate-pulse" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                        "font-heading font-black italic uppercase tracking-tight text-base leading-none mb-1 truncate",
                                        rank === 1 ? "text-amber-600 dark:text-amber-400" :
                                            isCurrentUser ? "text-[#FF5E00]" : "text-zinc-900 dark:text-zinc-100"
                                    )}>{user.full_name || 'Anonymous'}</span>
                                    <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                        {rank <= 3 ? 'ELITE MEMBER' : 'ACTIVE MEMBER'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={cn(
                                    "text-xl font-black italic tracking-tighter leading-none mb-1",
                                    rank === 1 ? "text-amber-500" : "text-[#FF5E00]"
                                )}>
                                    {user.total_points.toLocaleString()}
                                </span>
                                <span className="text-[8px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">POINTS</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {participants.length === 0 && (
                <div className="text-center py-20 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-zinc-300 dark:text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px]">Awaiting First Check-In...</p>
                </div>
            )}
        </section>
    );
}
