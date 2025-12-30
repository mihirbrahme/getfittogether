'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, CheckCircle, Users, Target, Settings, LogOut, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'WOD', href: '/dashboard/wod', icon: ClipboardList },
    { name: 'Check-In', href: '/dashboard/check-in', icon: CheckCircle },
    { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
    { name: 'History', href: '/dashboard/history', icon: Calendar },
    { name: 'Squad', href: '/dashboard/squad', icon: Users },
    { name: 'Goals', href: '/dashboard/goals', icon: Target },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [firstName, setFirstName] = useState('Participant');

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

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-100 bg-white fixed inset-y-0 z-30">
                <div className="p-6 flex items-center gap-3">
                    <div className="h-8 w-8 bg-[#FF5E00] rounded-lg flex items-center justify-center rotate-3 shadow-md shadow-[#FF5E00]/20">
                        <span className="text-white font-black italic text-sm">GFT</span>
                    </div>
                    <span className="font-black italic text-xl tracking-tighter text-zinc-900">DASHBOARD</span>
                </div>

                <nav className="flex-none p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all",
                                    isActive
                                        ? "bg-[#FF5E00]/10 text-[#FF5E00]"
                                        : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-[#FF5E00]" : "text-zinc-300")} />
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
                        className="w-full max-w-[120px] object-contain opacity-80 mix-blend-multiply grayscale hover:grayscale-0 transition-all duration-500"
                    />
                </div>

                <div className="p-6 border-t border-zinc-100 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden">
                            <Users className="h-full w-full p-2 text-zinc-300" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black uppercase text-zinc-900">{firstName}</p>
                            <Link href="/dashboard/settings" className="text-[10px] font-bold text-zinc-400 uppercase hover:text-[#FF5E00]">Settings</Link>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-2 px-4 rounded-lg text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pb-safe z-30">
                <nav className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                                    isActive ? "text-[#FF5E00]" : "text-zinc-300"
                                )}
                            >
                                <item.icon className={cn("h-6 w-6 transition-transform", isActive && "scale-110")} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
