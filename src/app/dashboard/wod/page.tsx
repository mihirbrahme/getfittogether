'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Flame, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';

interface WOD {
    id: string;
    title: string;
    description: string;
    type: string;
}

export default function WodPage() {
    const [loading, setLoading] = useState(true);
    const [wod, setWod] = useState<WOD | null>(null);

    useEffect(() => {
        const fetchWOD = async () => {
            const today = format(new Date(), 'yyyy-MM-dd');

            // Fetch WOD for today
            const { data, error } = await supabase
                .from('wods')
                .select('*')
                .eq('date', today)
                .limit(1)
                .single();

            if (error) {
                console.log('No WOD found or error:', error.message);
            } else {
                setWod(data);
            }
            setLoading(false);
        };
        fetchWOD();
    }, []);

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
        </div>
    );

    if (!wod) return (
        <div>
            <h1 className="text-3xl font-black italic uppercase text-zinc-900 mb-6">Workout of the Day</h1>
            <div className="p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm text-center py-20">
                <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-black italic text-zinc-900 uppercase">Rest Day</h3>
                <p className="text-zinc-400 text-sm mt-2">No mission scheduled for today. Recover active.</p>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black italic uppercase text-zinc-900">Workout of the Day</h1>
                <div className="px-4 py-2 bg-white rounded-xl border border-zinc-100 shadow-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#FF5E00]" />
                    <span className="text-xs font-black uppercase text-zinc-400">{format(new Date(), 'MMM dd, yyyy')}</span>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
                <div className="bg-[#FF5E00] p-8 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Flame className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-orange-100">Daily Mission</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter">{wod.title}</h2>
                </div>

                <div className="p-8 lg:p-12">
                    <div className="prose prose-zinc max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-base lg:text-lg text-zinc-600 leading-relaxed font-medium">
                            {wod.description}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
