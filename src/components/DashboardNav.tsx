'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, CheckCircle, Users, Target, Settings, LogOut, TrendingUp, Calendar, MoreHorizontal, X, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Desktop: All nav items
const allNavItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'WOD', href: '/dashboard/wod', icon: ClipboardList },
    { name: 'Check-In', href: '/dashboard/check-in', icon: CheckCircle },
    { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
    { name: 'History', href: '/dashboard/history', icon: Calendar },
    { name: 'Squad', href: '/dashboard/squad', icon: Users },
    { name: 'Events', href: '/dashboard/events', icon: PartyPopper },
    { name: 'Goals', href: '/dashboard/goals', icon: Target },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

// Mobile: Primary nav items (shown in bottom bar)
const mobileNavItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'WOD', href: '/dashboard/wod', icon: ClipboardList },
    { name: 'Check-In', href: '/dashboard/check-in', icon: CheckCircle },
    { name: 'Squad', href: '/dashboard/squad', icon: Users },
];

// Mobile: Secondary nav items (shown in "More" menu)
const moreMenuItems = [
    { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
    { name: 'History', href: '/dashboard/history', icon: Calendar },
    { name: 'Events', href: '/dashboard/events', icon: PartyPopper },
    { name: 'Goals', href: '/dashboard/goals', icon: Target },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [firstName, setFirstName] = useState('Participant');
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    // Check if current path is in the "More" menu
    const isMoreActive = moreMenuItems.some(item => pathname === item.href);

    useEffect(() => {
        const fetchUserName = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name')
                .eq('id', user.id)
                .single();

            if (profile?.first_name) {
                setFirstName(profile.first_name);
            }
        };
        fetchUserName();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth?mode=login');
    };

    const handleMoreItemClick = (href: string) => {
        setShowMoreMenu(false);
        router.push(href);
    };

    return (
        <>
            {/* Desktop Sidebar - Unchanged, shows all 8 items */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 fixed inset-y-0 z-30">
                <div className="p-6 flex items-center gap-3">
                    <div className="h-8 w-8 bg-[#FF5E00] rounded-lg flex items-center justify-center rotate-3 shadow-md shadow-[#FF5E00]/20">
                        <span className="text-white font-black italic text-sm">GFT</span>
                    </div>
                    <span className="font-black italic text-xl tracking-tighter text-zinc-900 dark:text-zinc-100">DASHBOARD</span>
                </div>

                <nav className="flex-none p-4 space-y-2">
                    {allNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all",
                                    isActive
                                        ? "bg-[#FF5E00]/10 text-[#FF5E00]"
                                        : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-[#FF5E00]" : "text-zinc-300 dark:text-zinc-600")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Spacer with Big Logo */}
                <div className="flex-1 flex flex-col justify-end px-8 pb-6 items-center pointer-events-none">
                    <img
                        src="/1756451176073.jpg"
                        alt="VYAIAM"
                        className="w-full max-w-[120px] object-contain opacity-80 mix-blend-multiply dark:mix-blend-screen grayscale hover:grayscale-0 transition-all duration-500"
                    />
                </div>

                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                            <Users className="h-full w-full p-2 text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100">{firstName}</p>
                            <Link href="/dashboard/settings" className="text-[10px] font-bold text-zinc-400 uppercase hover:text-[#FF5E00]">Settings</Link>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-black py-2 px-4 rounded-lg text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav - Simplified to 5 items */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <nav className="flex items-center justify-around h-16">
                    {mobileNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors press-effect",
                                    isActive ? "text-[#FF5E00]" : "text-zinc-300 dark:text-zinc-600"
                                )}
                            >
                                <item.icon className={cn("h-6 w-6 transition-transform", isActive && "scale-110")} />
                                <span className="text-[10px] font-black uppercase tracking-wider">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors press-effect",
                            isMoreActive ? "text-[#FF5E00]" : "text-zinc-300 dark:text-zinc-600"
                        )}
                    >
                        <MoreHorizontal className={cn("h-6 w-6 transition-transform", isMoreActive && "scale-110")} />
                        <span className="text-[10px] font-black uppercase tracking-wider">More</span>
                    </button>
                </nav>
            </div>

            {/* More Menu Overlay */}
            {showMoreMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
                        onClick={() => setShowMoreMenu(false)}
                    />

                    {/* Slide-up Menu */}
                    <div className="lg:hidden fixed inset-x-0 bottom-0 bg-white dark:bg-zinc-900 rounded-t-[2rem] shadow-2xl z-50 animate-slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-lg font-black italic uppercase text-zinc-900 dark:text-zinc-100">More</h3>
                            <button
                                onClick={() => setShowMoreMenu(false)}
                                className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center press-effect"
                            >
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <nav className="p-4 space-y-2">
                            {moreMenuItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => handleMoreItemClick(item.href)}
                                        className={cn(
                                            "flex items-center gap-4 w-full px-5 py-4 rounded-2xl font-bold uppercase text-sm tracking-wider transition-all press-effect",
                                            isActive
                                                ? "bg-[#FF5E00]/10 text-[#FF5E00]"
                                                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center",
                                            isActive ? "bg-[#FF5E00] text-white" : "bg-zinc-100 dark:bg-zinc-800"
                                        )}>
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <span>{item.name}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* User & Logout */}
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-4 mb-4 px-2">
                                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black uppercase text-zinc-900 dark:text-zinc-100">{firstName}</p>
                                    <p className="text-xs text-zinc-400">Participant</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-black py-4 px-4 rounded-xl text-sm uppercase flex items-center justify-center gap-2 transition-colors press-effect"
                            >
                                <LogOut className="h-5 w-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
