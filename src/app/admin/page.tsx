'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Calendar, Users, Activity, LogOut, LayoutDashboard, Database, ShieldAlert, Loader2, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import EventScheduler from '@/components/admin/EventScheduler';
import WODManager from '@/components/admin/WODManager';
import GroupManager from '@/components/admin/GroupManager';
import LibraryManager from '@/components/admin/LibraryManager';
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
        { id: 'wods', label: 'WOD ENGINE', icon: Activity },
        { id: 'library', label: 'LIBRARY', icon: Database },
        { id: 'groups', label: 'SQUADS', icon: Users },
        { id: 'events', label: 'EVENTS', icon: Calendar },
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
                    {/* Page Header */}
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
                                <ShieldAlert className="h-5 w-5 text-[#FF5E00]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tier 1 Clearance Granted</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'events' && <EventScheduler />}
                        {activeTab === 'wods' && <WODManager />}
                        {activeTab === 'groups' && <GroupManager />}
                        {activeTab === 'library' && <LibraryManager />}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    { label: 'Active Participants', value: '42', delta: '+12%', icon: Users },
                                    { label: 'Total XP Earned', value: '4.2k', delta: '+8%', icon: Trophy },
                                    { label: 'Completion Rate', value: '78%', delta: '-2%', icon: Activity },
                                    { label: 'Live Squads', value: '5', delta: '0', icon: Database },
                                ].map((stat, i) => (
                                    <div key={i} className="premium-card rounded-[3rem] p-8 group cursor-default relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5E00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-[#FF5E00]/10 transition-colors" />

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="h-12 w-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-[#FF5E00] group-hover:bg-white group-hover:shadow-md transition-all duration-500">
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase px-3 py-1 rounded-full",
                                                stat.delta.startsWith('+') ? "bg-emerald-50 text-emerald-600" : (stat.delta === '0' ? "bg-zinc-100 text-zinc-400" : "bg-red-50 text-red-500")
                                            )}>
                                                {stat.delta}
                                            </span>
                                        </div>
                                        <span className="text-4xl font-black text-zinc-900 italic block mb-2 font-heading tracking-tighter">{stat.value}</span>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                ))}

                                <div className="col-span-full py-20 text-center rounded-[3.5rem] border-2 border-dashed border-zinc-100 bg-zinc-50/50">
                                    <h3 className="text-zinc-300 font-black uppercase tracking-[0.5em] text-[10px]">Neural Analytics Engine Standby</h3>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
