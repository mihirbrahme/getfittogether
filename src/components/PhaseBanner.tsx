'use client';

import { Flame, Zap, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseInfo {
    number: number;
    name: string;
    subtitle: string;
    color: string;
    icon: typeof Flame;
    dayRange: string;
}

const PHASES: PhaseInfo[] = [
    {
        number: 1,
        name: 'Foundation',
        subtitle: 'Build your base habits',
        color: 'from-blue-500 to-cyan-500',
        icon: Target,
        dayRange: 'Days 1-14'
    },
    {
        number: 2,
        name: 'Momentum',
        subtitle: 'Accelerate your progress',
        color: 'from-emerald-500 to-teal-500',
        icon: Zap,
        dayRange: 'Days 15-28'
    },
    {
        number: 3,
        name: 'Intensity + Discipline',
        subtitle: 'Push your limits',
        color: 'from-orange-500 to-red-500',
        icon: Flame,
        dayRange: 'Days 29-56'
    },
    {
        number: 4,
        name: 'Finish Strong',
        subtitle: 'Cross the finish line',
        color: 'from-purple-500 to-pink-500',
        icon: Trophy,
        dayRange: 'Days 57-70'
    }
];

function getPhase(dayNumber: number): PhaseInfo {
    if (dayNumber <= 14) return PHASES[0];
    if (dayNumber <= 28) return PHASES[1];
    if (dayNumber <= 56) return PHASES[2];
    return PHASES[3];
}

interface PhaseBannerProps {
    currentDay: number;
    className?: string;
}

export default function PhaseBanner({ currentDay, className }: PhaseBannerProps) {
    const phase = getPhase(currentDay);
    const PhaseIcon = phase.icon;

    // Calculate progress within current phase
    let phaseStart: number, phaseEnd: number;
    if (phase.number === 1) { phaseStart = 1; phaseEnd = 14; }
    else if (phase.number === 2) { phaseStart = 15; phaseEnd = 28; }
    else if (phase.number === 3) { phaseStart = 29; phaseEnd = 56; }
    else { phaseStart = 57; phaseEnd = 70; }

    const phaseProgress = Math.round(((currentDay - phaseStart) / (phaseEnd - phaseStart)) * 100);

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl p-5",
            className
        )}>
            <div className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-90",
                phase.color
            )} />
            <div className="absolute inset-0 bg-black/10" />

            <div className="relative z-10 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <PhaseIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                            Phase {phase.number}
                        </span>
                        <span className="text-white/50 text-[10px]">•</span>
                        <span className="text-white/70 text-[10px] font-bold">{phase.dayRange}</span>
                    </div>
                    <h3 className="text-white font-black text-lg uppercase tracking-tight">{phase.name}</h3>
                    <p className="text-white/80 text-xs mt-0.5">{phase.subtitle}</p>
                </div>
                <div className="text-right">
                    <span className="text-white text-2xl font-black">{phaseProgress}%</span>
                    <p className="text-white/70 text-[9px] uppercase font-bold">Complete</p>
                </div>
            </div>

            {/* Phase Progress Bar */}
            <div className="relative z-10 mt-4">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${phaseProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export { getPhase, PHASES };
export type { PhaseInfo };
