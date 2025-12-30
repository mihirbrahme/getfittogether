'use client';

import { GripVertical, Trash2 } from 'lucide-react';
import { Exercise } from './types';

interface ExerciseFormRowProps {
    exercise: Exercise;
    index: number;
    onUpdate: (index: number, field: keyof Exercise, value: any) => void;
    onDelete: (index: number) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
}

export default function ExerciseFormRow({
    exercise,
    index,
    onUpdate,
    onDelete,
    onDragStart,
    onDragOver,
    onDragEnd
}: ExerciseFormRowProps) {
    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            className="bg-white border-2 border-zinc-200 rounded-2xl p-6 cursor-move hover:border-[#FF5E00] transition-all"
        >
            <div className="flex items-start gap-4">
                <div className="flex items-center gap-3 shrink-0">
                    <GripVertical className="h-5 w-5 text-zinc-400" />
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black">
                        {index + 1}
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={exercise.exercise_name}
                            onChange={(e) => onUpdate(index, 'exercise_name', e.target.value)}
                            placeholder="Exercise name (e.g., Push-ups)"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs font-black text-zinc-500 mb-1">Sets/Cycles</label>
                            <input
                                type="number"
                                value={exercise.sets || ''}
                                onChange={(e) => onUpdate(index, 'sets', parseInt(e.target.value) || null)}
                                className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-zinc-500 mb-1">Reps</label>
                            <input
                                type="number"
                                value={exercise.reps || ''}
                                onChange={(e) => onUpdate(index, 'reps', parseInt(e.target.value) || null)}
                                disabled={!!exercise.duration_seconds}
                                className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm disabled:bg-zinc-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-zinc-500 mb-1">Time (s)</label>
                            <input
                                type="number"
                                value={exercise.duration_seconds || ''}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || null;
                                    onUpdate(index, 'duration_seconds', val);
                                    if (val) onUpdate(index, 'reps', null);
                                }}
                                disabled={!!exercise.reps}
                                className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm disabled:bg-zinc-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-black text-zinc-500 mb-1">Rest (s)</label>
                            <input
                                type="number"
                                value={exercise.rest_seconds}
                                onChange={(e) => onUpdate(index, 'rest_seconds', parseInt(e.target.value))}
                                className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-zinc-500 mb-1">Equipment</label>
                            <input
                                type="text"
                                value={exercise.equipment}
                                onChange={(e) => onUpdate(index, 'equipment', e.target.value)}
                                placeholder="None"
                                className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-black text-zinc-500 mb-1">Video URL (optional)</label>
                        <input
                            type="text"
                            value={exercise.video_url}
                            onChange={(e) => onUpdate(index, 'video_url', e.target.value)}
                            placeholder="YouTube link..."
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-black text-zinc-500 mb-1">Notes</label>
                        <textarea
                            value={exercise.notes}
                            onChange={(e) => onUpdate(index, 'notes', e.target.value)}
                            placeholder="Form cues, modifications..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-[#FF5E00] focus:outline-none text-sm resize-none"
                        />
                    </div>
                </div>

                <button
                    onClick={() => onDelete(index)}
                    className="shrink-0 h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center justify-center"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
