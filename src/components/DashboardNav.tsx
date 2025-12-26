'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, CheckCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'WOD', href: '/dashboard/wod', icon: ClipboardList },
    { name: 'Check-In', href: '/dashboard/check-in', icon: CheckCircle },
    { name: 'Squad', href: '/dashboard/squad', icon: Users },
];

export default function DashboardNav() {
    const pathname = usePathname();

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

                <div className="p-6 border-t border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden">
                            {/* Placeholder for user avatar, could be fetched from profile */}
                            <Users className="h-full w-full p-2 text-zinc-300" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-zinc-900">Soldier</p>
                            <Link href="/dashboard/profile" className="text-[10px] font-bold text-zinc-400 uppercase hover:text-[#FF5E00]">View Profile</Link>
                        </div>
                    </div>
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
