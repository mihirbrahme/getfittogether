'use client';

import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
}

export default function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [pulling, setPulling] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);

    const THRESHOLD = 80; // Pixels to pull before triggering refresh
    const MAX_PULL = 120; // Max pull distance

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only enable if scrolled to top
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            setPulling(true);
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!pulling || refreshing) return;

        currentY.current = e.touches[0].clientY;
        const distance = Math.max(0, currentY.current - startY.current);

        // Apply resistance for smoother feel
        const resistedDistance = Math.min(distance * 0.5, MAX_PULL);
        setPullDistance(resistedDistance);

        // Prevent default scrolling when pulling
        if (resistedDistance > 0) {
            e.preventDefault();
        }
    }, [pulling, refreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!pulling) return;

        setPulling(false);

        if (pullDistance >= THRESHOLD && !refreshing) {
            setRefreshing(true);
            setPullDistance(60); // Hold at indicator position

            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [pulling, pullDistance, refreshing, onRefresh]);

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-auto", className)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: pullDistance > 0 ? 'none' : 'auto' }}
        >
            {/* Refresh Indicator */}
            <div
                className={cn(
                    "absolute left-1/2 -translate-x-1/2 z-10 transition-all duration-200",
                    refreshing ? "opacity-100" : pullDistance > 0 ? "opacity-100" : "opacity-0"
                )}
                style={{
                    top: Math.max(0, pullDistance - 48),
                    transform: `translateX(-50%) rotate(${pullDistance * 3}deg)`
                }}
            >
                <div className={cn(
                    "h-10 w-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg flex items-center justify-center border border-zinc-100 dark:border-zinc-700",
                    refreshing && "animate-pulse"
                )}>
                    <Loader2 className={cn(
                        "h-5 w-5 text-[#FF5E00]",
                        refreshing && "animate-spin"
                    )} />
                </div>
            </div>

            {/* Content with pull offset */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transitionDuration: pulling ? '0ms' : '200ms'
                }}
            >
                {children}
            </div>
        </div>
    );
}
