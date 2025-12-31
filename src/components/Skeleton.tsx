'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
    return (
        <div
            className={cn(
                'skeleton',
                {
                    'h-4 w-full': variant === 'text',
                    'rounded-full aspect-square': variant === 'circular',
                    'rounded-[2rem] h-full': variant === 'card',
                },
                className
            )}
        />
    );
}

// Pre-built skeleton patterns
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn('premium-card rounded-[2rem] p-6 space-y-4', className)}>
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-3 w-1/2" variant="text" />
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="premium-card rounded-[2rem] p-6 flex flex-col items-center">
                <Skeleton className="h-12 w-20 mb-2" />
                <Skeleton className="h-3 w-16" variant="text" />
            </div>
            <div className="premium-card rounded-[2rem] p-6 flex flex-col items-center">
                <Skeleton className="h-12 w-20 mb-2" />
                <Skeleton className="h-3 w-16" variant="text" />
            </div>
        </div>
    );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="premium-card rounded-[2rem] p-6 flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" variant="text" />
                        <Skeleton className="h-3 w-1/2" variant="text" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonWeeklyStatus() {
    return (
        <div className="premium-card rounded-[2.5rem] p-6">
            <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-32" variant="text" />
            </div>
            <div className="flex justify-between">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" variant="circular" />
                        <Skeleton className="h-3 w-8" variant="text" />
                    </div>
                ))}
            </div>
        </div>
    );
}
