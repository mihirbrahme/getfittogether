'use client';

import { useEffect, useState } from 'react';

interface ProgressRingProps {
    size?: number;
    strokeWidth?: number;
    progress: number; // 0 to 100
    className?: string;
    color?: string;
    bgColor?: string;
    animated?: boolean;
    children?: React.ReactNode;
}

export default function ProgressRing({
    size = 120,
    strokeWidth = 10,
    progress,
    className = '',
    color = 'var(--primary)',
    bgColor = 'var(--border-light)',
    animated = true,
    children,
}: ProgressRingProps) {
    const [animatedProgress, setAnimatedProgress] = useState(0);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

    useEffect(() => {
        if (animated) {
            // Animate the progress
            const timer = setTimeout(() => {
                setAnimatedProgress(progress);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setAnimatedProgress(progress);
        }
    }, [progress, animated]);

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="progress-ring transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 8px ${color})`,
                    }}
                />
            </svg>
            {children && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
}
