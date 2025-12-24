'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Calendar, Users, Activity, LogOut, LayoutDashboard, Database, ShieldAlert, Loader2 } from 'lucide-react';
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
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profile?.role === 'admin') {
                setAuthorized(true);
            } else {
                router.push('/');
            }
            setLoading(false);
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
        <div className="flex min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col fixed inset-y-0 z-50">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary group transition-all hover:scale-110">
                            <Settings className="h-6 w-6 group-hover:rotate-45 transition-transform" />
                        </div>
                        <h1 className="text-lg font-black italic tracking-tighter leading-none uppercase">Admin<br /><span className="text-primary">Control</span></h1>
                    </div>

                    <nav className="space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group font-black uppercase tracking-widest text-[10px]",
                                    activeTab === tab.id
                                        ? "bg-primary text-black"
                                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-black" : "group-hover:text-primary")} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-white/5">
                    <button
                        onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                        className="w-full flex items-center gap-4 px-4 py-3 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 rounded-xl transition-all group"
                    >
                        <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Exit Portal
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-12">
                <div className="max-w-6xl mx-auto space-y-12">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-2">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                Live System Management
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border border-white/5">
                                <div className="h-2 w-2 rounded-full bg-success" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Database Healthy</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in duration-500">
                        {activeTab === 'events' && <EventScheduler />}
                        {activeTab === 'wods' && <WODManager />}
                        {activeTab === 'groups' && <GroupManager />}
                        {activeTab === 'library' && <LibraryManager />}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Active Participants', value: '42', delta: '+12%', icon: Users },
                                    { label: 'Total XP Earned', value: '4.2k', delta: '+8%', icon: Trophy },
                                    { label: 'Completion Rate', value: '78%', delta: '-2%', icon: Activity },
                                    { label: 'Live Squads', value: '5', delta: '0', icon: Database },
                                ].map((stat, i) => (
                                    <div key={i} className="glass rounded-3xl p-6 border border-white/5 hover:border-primary/20 transition-all group cursor-default">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                                                stat.delta.startsWith('+') ? "bg-success/20 text-success" : (stat.delta === '0' ? "bg-zinc-800 text-zinc-500" : "bg-red-500/20 text-red-500")
                                            )}>
                                                {stat.delta}
                                            </span>
                                        </div>
                                        <span className="text-3xl font-black text-white italic block mb-1">{stat.value}</span>
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                ))}

                                <div className="col-span-full py-12 text-center glass rounded-3xl border border-dashed border-white/10">
                                    <h3 className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs">More analytics coming soon</h3>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
