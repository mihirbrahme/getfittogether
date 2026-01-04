'use client';

import { useState } from 'react';
import { Camera, X, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from '@/lib/dateUtils';

interface ProgressPromptProps {
    currentDay: number;
    lastBiometricDate?: string | null;
    onDismiss: () => void;
    onLogProgress: () => void;
}

export default function ProgressPrompt({
    currentDay,
    lastBiometricDate,
    onDismiss,
    onLogProgress
}: ProgressPromptProps) {
    const [isVisible, setIsVisible] = useState(true);

    // Check if we should show the prompt
    // Show every 14 days OR if no biometrics logged yet
    const daysSinceLastLog = lastBiometricDate
        ? differenceInDays(new Date(), new Date(lastBiometricDate))
        : currentDay;

    const shouldShowPrompt = daysSinceLastLog >= 14 || !lastBiometricDate;

    // Determine which checkpoint we're at
    let checkpointLabel = 'Initial Baseline';
    if (currentDay >= 14 && currentDay < 28) checkpointLabel = 'Week 2 Check-In';
    else if (currentDay >= 28 && currentDay < 42) checkpointLabel = 'Week 4 Check-In';
    else if (currentDay >= 42 && currentDay < 56) checkpointLabel = 'Week 6 Check-In';
    else if (currentDay >= 56) checkpointLabel = 'Final Measurements';

    if (!shouldShowPrompt || !isVisible) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss();
    };

    return (
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />

            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors z-10"
            >
                <X className="h-4 w-4 text-white" />
            </button>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">{checkpointLabel}</span>
                        <h3 className="text-white font-black text-lg uppercase tracking-tight">Time for Progress Check!</h3>
                    </div>
                </div>

                <p className="text-white/80 text-sm mb-4">
                    It's been {daysSinceLastLog} days since your last measurements. Log your biometrics to track your transformation!
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onLogProgress}
                        className="flex-1 bg-white text-blue-600 font-black py-3 px-4 rounded-xl text-sm uppercase flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors press-effect"
                    >
                        <Camera className="h-4 w-4" />
                        Log Progress
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="bg-white/20 text-white font-black py-3 px-4 rounded-xl text-sm uppercase hover:bg-white/30 transition-colors"
                    >
                        Later
                    </button>
                </div>
            </div>
        </div>
    );
}
