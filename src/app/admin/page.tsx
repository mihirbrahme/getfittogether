'use client';

import { useState } from 'react';
import { Settings, Calendar, Users, Activity, LogOut, LayoutDashboard, Database } from 'lucide-react';
import EventScheduler from '@/components/admin/EventScheduler';
import WODManager from '@/components/admin/WODManager';
import GroupManager from '@/components/admin/GroupManager';
import LibraryManager from '@/components/admin/LibraryManager';
import { cn } from '@/lib/utils';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
        { id: 'wods', label: 'WOD ENGINE', icon: Activity },
        { id: 'library', label: 'LIBRARY', icon: Database },
        { id: 'groups', label: 'SQUADS', icon: Users },
        { id: 'events', label: 'EVENTS', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Admin Sidebar */}
            <div className="flex">
                <aside className="w-64 min-h-screen glass border-r border-white/5 p-6 space-y-8 sticky top-0">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-black">
                            <Settings className="h-6 w-6 stroke-[3px]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black italic tracking-tighter">VYAIAM</h1>
                            <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] leading-none">Admin Panel</span>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                                    activeTab === tab.id
                                        ? "bg-primary/20 text-primary border border-primary/20"
                                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <tab.icon className="h-5 w-5" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-8 border-t border-white/5">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-400/10 transition-all">
                            <LogOut className="h-5 w-5" />
                            EXIT ADMIN
                        </button>
                    </div>
                </aside>

                {/* Admin Content Area */}
                <main className="flex-1 p-10 max-w-6xl mx-auto">
                    <div className="mb-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Managing the Get Fit Together Engine</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="glass px-6 py-4 rounded-2xl border border-white/5">
                                <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Challengers</span>
                                <span className="text-2xl font-black italic">42</span>
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
                                    { label: 'Total Points Logged', value: '12,840', color: 'text-primary' },
                                    { label: 'WOD Completion Rate', value: '84%', color: 'text-success' },
                                    { label: 'Pending Approvals', value: '3', color: 'text-warning' },
                                    { label: 'Green Day Average', value: '4.2', color: 'text-accent' },
                                ].map((stat) => (
                                    <div key={stat.label} className="glass-card rounded-3xl p-6 border border-white/5">
                                        <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{stat.label}</span>
                                        <span className={cn("text-3xl font-black italic", stat.color)}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab !== 'events' && activeTab !== 'overview' && (
                            <div className="glass rounded-3xl p-20 text-center border border-dashed border-white/10">
                                <Settings className="h-16 w-16 text-zinc-800 mx-auto mb-6 animate-spin-slow" />
                                <h3 className="text-xl font-bold text-zinc-400 uppercase tracking-widest italic">Under Construction</h3>
                                <p className="text-zinc-600 mt-2 font-medium">This module is coming in the next deployment phase.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
