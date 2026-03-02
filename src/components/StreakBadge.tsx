'use client';

import { cn } from '@/lib/utils';

interface StreakBadgeProps {
    streak: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function StreakBadge({ streak, className, size = 'md' }: StreakBadgeProps) {
    if (streak <= 0) return null;

    const sizeClasses = {
        sm: 'text-xs px-2 py-1 gap-1',
        md: 'text-sm px-3 py-1.5 gap-1.5',
        lg: 'text-base px-4 py-2 gap-2',
    };

    const iconSizes = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-xl',
    };

    // Milestone animations at 7, 14, 30, 50
    const isMilestone = [7, 14, 30, 50, 70].includes(streak);

    const getFlameEmoji = (days: number) => {
        if (days >= 30) return '🔥✨'; // Glowing neon
        if (days >= 14) return '☄️';   // Blazing red
        return '🔥';                   // Standard
    };

    const getFlameStyle = (days: number) => {
        if (days >= 30) return 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-purple-500/50';
        if (days >= 14) return 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/50';
        return 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-500/30';
    };

    return (
        <div
            className={cn(
                'inline-flex items-center font-black uppercase tracking-wider rounded-full',
                getFlameStyle(streak),
                'text-white shadow-lg transition-all duration-300',
                isMilestone && 'animate-pulse-glow',
                sizeClasses[size],
                className
            )}
        >
            <span className={cn(iconSizes[size], streak >= 7 && 'animate-fire')}>
                {getFlameEmoji(streak)}
            </span>
            <span>{streak}</span>
            <span className="opacity-80 font-bold">
                {streak === 1 ? 'day' : 'days'}
            </span>
        </div>
    );
}
