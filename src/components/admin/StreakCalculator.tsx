'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calculator, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StreakCalculator() {
    const [calculating, setCalculating] = useState(false);
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

    const handleCalculate = async () => {
        setCalculating(true);
        setResult(null);

        try {
            const { data, error } = await supabase.rpc('calculate_all_user_streaks');

            if (error) {
                console.error('Error calculating streaks:', error);
                setResult({ success: false, error: error.message });
            } else {
                setResult({ success: true, count: data });
            }
        } catch (err: any) {
            console.error('Unexpected error:', err);
            setResult({ success: false, error: err.message });
        }

        setCalculating(false);
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-black uppercase text-zinc-900">Streak Calculator</h3>
                <p className="text-xs text-zinc-500 mt-1">
                    Calculate streaks and award milestone bonuses for all participants
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-black text-sm text-blue-900 mb-2">How It Works</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Calculates consecutive check-in, workout, and clean eating streaks</li>
                    <li>• Awards bonus points for milestones (3, 7, 14, 21, 28 days)</li>
                    <li>• Updates each user's total_points automatically</li>
                    <li>• Run this daily (ideally at end of day)</li>
                </ul>
            </div>

            <button
                onClick={handleCalculate}
                disabled={calculating}
                className={cn(
                    "w-full py-4 px-6 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all",
                    calculating
                        ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        : "bg-[#FF5E00] text-white hover:bg-orange-600 press-effect"
                )}
            >
                {calculating ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Calculating Streaks...
                    </>
                ) : (
                    <>
                        <Calculator className="h-5 w-5" />
                        Calculate All Streaks
                    </>
                )}
            </button>

            {/* Result Display */}
            {result && (
                <div
                    className={cn(
                        "rounded-xl p-4 flex items-start gap-3 animate-fade-in",
                        result.success
                            ? "bg-emerald-50 border border-emerald-200"
                            : "bg-red-50 border border-red-200"
                    )}
                >
                    {result.success ? (
                        <>
                            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-black text-sm text-emerald-900">Calculation Complete!</h4>
                                <p className="text-xs text-emerald-700 mt-1">
                                    Processed <span className="font-black">{result.count}</span> user{result.count !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-emerald-600 mt-1">
                                    Streaks updated and bonuses awarded where applicable.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-black text-sm text-red-900">Calculation Failed</h4>
                                <p className="text-xs text-red-700 mt-1">{result.error}</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Milestone Reference */}
            <div className="bg-zinc-50 rounded-xl p-4">
                <h4 className="font-black text-xs uppercase text-zinc-700 mb-3">Milestone Bonuses</h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                        <p className="font-bold text-zinc-500 uppercase mb-1">Check-in</p>
                        <div className="space-y-0.5 text-zinc-600">
                            <div>3 days → +5</div>
                            <div>7 days → +10</div>
                            <div>14 days → +15</div>
                            <div>21 days → +20</div>
                            <div>28 days → +25</div>
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-zinc-500 uppercase mb-1">Workout</p>
                        <div className="space-y-0.5 text-zinc-600">
                            <div>5 days → +10</div>
                            <div>10 days → +20</div>
                            <div>20 days → +30</div>
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-zinc-500 uppercase mb-1">Clean Eating</p>
                        <div className="space-y-0.5 text-zinc-600">
                            <div>3 days → +5</div>
                            <div>7 days → +10</div>
                            <div>14 days → +15</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
