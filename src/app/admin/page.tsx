'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Calendar, Users, Activity, LogOut, LayoutDashboard, Database, ShieldAlert, Loader2, Trophy, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import EventScheduler from '@/components/admin/EventScheduler';
import WODManager from '@/components/admin/WODManager';
import GroupManager from '@/components/admin/GroupManager';
import EnhancedLibraryManager from '@/components/admin/EnhancedLibraryManager';
import BulkWODScheduler from '@/components/admin/BulkWODScheduler';
import WODCalendar from '@/components/admin/WODCalendar';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import OverviewDashboard from '@/components/admin/OverviewDashboard';
import AdminPointsAwarder from '@/components/admin/AdminPointsAwarder';
import StreakCalculator from '@/components/admin/StreakCalculator';
import { cn } from '@/lib/utils';

export default function AdminPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log("Admin Check - Session:", session?.user?.id);

                if (!session) {
                    console.log("No session found, redirecting...");
                    router.push('/');
                    return;
                }

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                console.log("Admin Check - Profile:", profile, "Error:", error);

                if (profile?.role === 'admin') {
                    setAuthorized(true);
                } else {
                    console.log("Not an admin, redirecting. Role found:", profile?.role);
                    router.push('/');
                }
            } catch (err) {
                console.error("Admin Auth Error:", err);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const tabs = [
        { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
        { id: 'analytics', label: 'ANALYTICS', icon: TrendingUp },
        { id: 'library', label: 'WOD LIBRARY', icon: Database },
        { id: 'calendar', label: 'CALENDAR', icon: Calendar },
        { id: 'groups', label: 'SQUADS', icon: Users },
        { id: 'events', label: 'EVENTS', icon: Activity },
        { id: 'points', label: 'AWARD POINTS', icon: Trophy },
        { id: 'streaks', label: 'STREAKS', icon: Zap },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Verifying Clearance</p>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="flex min-h-screen bg-white text-zinc-900 selection:bg-[#FF5E00]/10 font-body">
            {/* Sidebar Navigation */}
            <aside className="w-80 border-r border-zinc-100 bg-zinc-50/50 flex flex-col fixed inset-y-0 z-50">
                <div className="p-10 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-16">
                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-200/50 border border-zinc-100 group transition-all hover:scale-110">
                            <Settings className="h-7 w-7 text-[#FF5E00] group-hover:rotate-45 transition-transform" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter leading-none uppercase font-heading">
                                HQ <span className="text-[#FF5E00]">OS</span>
                            </h1>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Command Central v2.4</p>
                        </div>
                    </div>

                    <nav className="space-y-3 flex-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-300 group font-black uppercase tracking-widest text-[10px] relative overflow-hidden",
                                    activeTab === tab.id
                                        ? "bg-white text-[#FF5E00] shadow-xl shadow-zinc-200/50 border border-zinc-100"
                                        : "text-zinc-400 hover:text-zinc-900 hover:bg-white/50"
                                )}
                            >
                                <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-[#FF5E00]" : "group-hover:text-[#FF5E00] transition-colors")} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute right-6 h-1 w-1 rounded-full bg-[#FF5E00] shadow-[0_0_8px_#FF5E00]" />
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-10 border-t border-zinc-100">
                        <button
                            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                            className="w-full flex items-center gap-4 px-6 py-5 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-red-500 hover:bg-red-50 rounded-[1.5rem] transition-all group"
                        >
                            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            Terminate Session
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-80 p-16">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Operational Status: Active</span>
                            </div>
                            <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none font-heading">
                                {tabs.find(t => t.id === activeTab)?.label.split(' ')[0]} <span className="text-[#FF5E00]">{tabs.find(t => t.id === activeTab)?.label.split(' ')[1] || ''}</span>
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="bg-zinc-50 px-6 py-3 rounded-2xl flex items-center gap-4 border border-zinc-100 shadow-sm">
                                {/* Additional content or controls can go here */}
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'overview' && <OverviewDashboard onNavigate={setActiveTab} />}
                        {activeTab === 'analytics' && <AnalyticsDashboard />}
                        {activeTab === 'library' && <EnhancedLibraryManager />}
                        {activeTab === 'calendar' && <WODCalendar />}
                        {activeTab === 'events' && <EventScheduler />}
                        {activeTab === 'groups' && <GroupManager />}
                        {activeTab === 'points' && <AdminPointsAwarder />}
                        {activeTab === 'streaks' && <StreakCalculator />}
                    </div>
                </div>
            </main>
        </div>
    );
}
