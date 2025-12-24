'use client';

import { useState, useEffect } from 'react';
import { Zap, Trophy, Flame, Droplets, Moon, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import CheckInModal, { CheckInData } from '@/components/CheckInModal';
import Leaderboard from '@/components/Leaderboard';
import JoinGroup from '@/components/JoinGroup';
import { supabase } from '@/lib/supabase';

interface WOD {
  id: string;
  title: string;
  description: string;
  type: 'weekday' | 'weekend' | 'event';
  group_id?: string | null;
}

export default function Home() {
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [userId] = useState('00000000-0000-0000-0000-000000000000'); // Mocked user ID
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [todayWOD, setTodayWOD] = useState<WOD | null>(null);

  const [dailyStatus, setDailyStatus] = useState<CheckInData>({
    core: {
      wod: false,
      steps: false,
      hydration: false,
      sleep: false,
      cleanEating: false,
    },
    custom: {
      sugar: false,
      reading: false,
    }
  });

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch Approved Groups
    const { data: groups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    const groupIds = groups?.map(g => g.group_id) || [];
    setUserGroups(groupIds);

    // 2. Fetch WOD (Filtered by Groups)
    // We fetch global WODs (group_id is null) OR WODs specifically for the user's groups
    const { data: wods } = await supabase
      .from('wods')
      .select('*')
      .eq('date', today);

    if (wods) {
      // Filter manually to handle the "OR" logic more reliably with groupIds
      const filteredWods = wods.filter(w => !w.group_id || groupIds.includes(w.group_id));
      // Prioritize group-specific WOD over global if both exist
      const bestWod = filteredWods.find(w => w.group_id !== null) || filteredWods[0];
      setTodayWOD(bestWod || null);
    }

    // 3. Fetch Today's Log
    const { data: log } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (log) {
      setDailyStatus({
        core: {
          wod: log.wod_done,
          steps: log.steps_done,
          hydration: log.water_done,
          sleep: log.sleep_done,
          cleanEating: log.clean_eating_done,
        },
        custom: {
          sugar: false, // Placeholder
          reading: false,
        }
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleCheckInSubmit = async (data: CheckInData) => {
    setDailyStatus(data);
    setIsCheckInOpen(false);

    const today = new Date().toISOString().split('T')[0];

    // Calculate points
    let points = 0;
    if (data.core.wod) points += 25;
    if (data.core.steps) points += 10;
    if (data.core.hydration) points += 6;
    if (data.core.sleep) points += 6;
    if (data.core.cleanEating) points += 10;

    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        date: today,
        wod_done: data.core.wod,
        steps_done: data.core.steps,
        water_done: data.core.hydration,
        sleep_done: data.core.sleep,
        clean_eating_done: data.core.cleanEating,
        daily_points: points
      });

    if (error) {
      console.error('Error saving daily log:', error);
      alert('Failed to save your progress.');
    } else {
      // Update profile total points (simplified)
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_points: profile.total_points + points })
          .eq('id', userId);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSubmit={handleCheckInSubmit}
      />

      {/* Header Section */}
      <header className="mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 glass-card p-1">
            <img
              src="/1756451176073.jpg"
              alt="VYAIAM Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Get Fit <span className="text-primary">Together</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                powered by <span className="text-accent underline decoration-accent/30 underline-offset-4">VYAIAM</span>
              </p>
              <div className="h-1 w-1 rounded-full bg-zinc-800" />
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-2.5 py-0.5">
                <span className="text-[10px] font-black text-primary uppercase">Week 2</span>
                <span className="text-[10px] font-black text-zinc-500 uppercase">Day 12</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="glass flex flex-1 items-center gap-4 rounded-2xl px-6 py-4 lg:flex-none">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Total Points</span>
              <span className="text-2xl font-black text-white group cursor-default">
                1,240 <span className="text-[10px] text-primary align-top">+25</span>
              </span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="h-6 w-6 fill-orange-500/20" />
              <span className="text-xl font-bold">12 Day Streak</span>
            </div>
          </div>
        </div>
      </header>

      {userGroups.length === 0 ? (
        <div className="py-12">
          <JoinGroup userId={userId} onJoinRequested={() => fetchData()} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* WOD Section */}
          <section className="glass relative overflow-hidden rounded-3xl p-8 lg:col-span-8">
            <div className="absolute top-0 right-0 p-4">
              <Zap className="h-12 w-12 text-primary opacity-20" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className={cn(
                "text-[10px] font-black uppercase px-2 py-1 rounded-md border tracking-widest",
                todayWOD?.type === 'weekend' ? "bg-success/20 text-success border-success/30" : "bg-primary/20 text-primary border-primary/30"
              )}>
                {todayWOD?.type || 'Weekday'} WOD
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Workout of the Day</h2>
            {todayWOD ? (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-bold text-primary mb-2 italic uppercase">{todayWOD.title}</h3>
                <p className="text-zinc-300 antialiased">{todayWOD.description}</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-6 mb-6 text-center">
                <p className="text-zinc-500 font-bold uppercase tracking-widest">No workout deployed for today</p>
              </div>
            )}
            <button
              onClick={() => setIsCheckInOpen(true)}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-black font-black py-4 px-10 rounded-2xl transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] italic tracking-tighter text-lg uppercase"
            >
              DAILY LOG (+{dailyStatus.core.wod ? 0 : 25} pts)
            </button>
          </section>

          {/* Stats Section */}
          <section className="space-y-4 lg:col-span-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2 italic">Daily Core Goals</h2>
            {[
              { label: 'Steps', icon: <Footprints className="h-5 w-5 text-accent" />, status: dailyStatus.core.steps, bg: 'bg-accent/10 border-accent/20' },
              { label: 'Hydration', icon: <Droplets className="h-5 w-5 text-blue-400" />, status: dailyStatus.core.hydration, bg: 'bg-blue-400/10 border-blue-400/20' },
              { label: 'Sleep', icon: <Moon className="h-5 w-5 text-indigo-400" />, status: dailyStatus.core.sleep, bg: 'bg-indigo-400/10 border-indigo-400/20' },
            ].map((goal) => (
              <div key={goal.label} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", goal.bg)}>
                    {goal.icon}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-white leading-none">{goal.label}</span>
                    <span className="text-[10px] text-zinc-500 uppercase font-black">Daily Target</span>
                  </div>
                </div>
                {goal.status ? (
                  <div className="flex items-center gap-2 rounded-full bg-success/20 border border-success/30 px-3 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-black text-success uppercase">Done</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-zinc-800/50 border border-white/10 px-3 py-1 opacity-50">
                    <span className="text-[10px] font-black text-zinc-400 uppercase">Pending</span>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Personalized Goals & Events */}
          <section className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-black text-white mb-4 italic tracking-tight">MY CUSTOM TARGETS</h2>
              <div className="space-y-3">
                {[
                  { id: 'sugar', name: 'No Added Sugar', points: 5 },
                  { id: 'reading', name: 'Read for 20 mins', points: 5 },
                ].map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm font-bold text-zinc-300">{goal.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-primary uppercase">+{goal.points} pts</span>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        dailyStatus.custom[goal.id as keyof typeof dailyStatus.custom] ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-700"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 h-24 w-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all" />
              <h2 className="text-xl font-black text-white mb-4 italic tracking-tight uppercase">Upcoming Events</h2>
              <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-accent uppercase tracking-widest">Sunday, Dec 28</span>
                  <span className="text-[10px] font-black text-white bg-accent px-2 py-0.5 rounded-full">BONUS</span>
                </div>
                <h3 className="text-lg font-black text-white italic tracking-tight">Bi-Weekly Trek: Sinhagad</h3>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-widest">Earn +50 XP for participation</p>
              </div>
            </div>
          </section>

          {/* Leaderboard Summary */}
          <Leaderboard />
        </div>
      )}
    </main>
  );
}
