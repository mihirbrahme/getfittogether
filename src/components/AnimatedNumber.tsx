'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    formatValue?: (value: number) => string;
}

export default function AnimatedNumber({
    value,
    duration = 1000,
    className = '',
    prefix = '',
    suffix = '',
    formatValue,
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const current = Math.round(startValue + (endValue - startValue) * easeOut);
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    const formattedValue = formatValue
        ? formatValue(displayValue)
        : displayValue.toLocaleString();

    return (
        <span className={className}>
            {prefix}{formattedValue}{suffix}
        </span>
    );
}
