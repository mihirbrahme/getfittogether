'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    velocityX: number;
    velocityY: number;
}

interface ConfettiProps {
    active: boolean;
    duration?: number;
    particleCount?: number;
    onComplete?: () => void;
}

const COLORS = [
    '#FF5E00', // Primary orange
    '#FB923C', // Orange 400
    '#FACC15', // Yellow
    '#22C55E', // Green
    '#3B82F6', // Blue
    '#A855F7', // Purple
    '#F472B6', // Pink
];

export default function Confetti({
    active,
    duration = 2000,
    particleCount = 50,
    onComplete
}: ConfettiProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (!active) {
            setPieces([]);
            return;
        }

        // Generate confetti pieces
        const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: -10 - Math.random() * 20,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5,
            velocityX: -2 + Math.random() * 4,
            velocityY: 2 + Math.random() * 4,
        }));

        setPieces(newPieces);

        // Clear after duration
        const timer = setTimeout(() => {
            setPieces([]);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [active, particleCount, duration, onComplete]);

    if (!active || pieces.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute"
                    style={{
                        left: `${piece.x}%`,
                        top: `${piece.y}%`,
                        animation: `confetti-fall ${duration}ms ease-out forwards`,
                        animationDelay: `${Math.random() * 300}ms`,
                    }}
                >
                    <div
                        className="w-3 h-3"
                        style={{
                            backgroundColor: piece.color,
                            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
                            borderRadius: Math.random() > 0.5 ? '50%' : '0',
                        }}
                    />
                </div>
            ))}
        </div>
    );
}
