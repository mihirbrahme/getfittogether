'use client';

import { useState, useRef } from 'react';
import { Upload, Download, X, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Exercise } from './types';
import { cn } from '@/lib/utils';

interface BulkExerciseImportProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (exercises: Exercise[]) => void;
    startingIndex: number;
}

interface ParsedExercise extends Exercise {
    isValid: boolean;
    errors: string[];
}

export default function BulkExerciseImport({
    isOpen,
    onClose,
    onImport,
    startingIndex
}: BulkExerciseImportProps) {
    const [parsedExercises, setParsedExercises] = useState<ParsedExercise[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/templates/exercise_import_template.csv';
        link.download = 'exercise_import_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parseCSV = (text: string): ParsedExercise[] => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have a header row and at least one data row');
        }

        // Parse header
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredFields = ['exercise_name', 'sets'];
        const missingFields = requiredFields.filter(f => !header.includes(f));

        if (missingFields.length > 0) {
            throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
        }

        // Parse data rows
        const exercises: ParsedExercise[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (handles basic comma separation)
            const values = parseCSVLine(line);
            const row: Record<string, string> = {};

            header.forEach((col, idx) => {
                row[col] = values[idx]?.trim() || '';
            });

            const errors: string[] = [];

            // Validate required fields
            if (!row.exercise_name) {
                errors.push('Missing exercise name');
            }
            if (!row.sets || isNaN(parseInt(row.sets))) {
                errors.push('Invalid sets');
            }

            // Validate reps/duration
            const hasReps = row.reps && !isNaN(parseInt(row.reps));
            const hasDuration = row.duration_seconds && !isNaN(parseInt(row.duration_seconds));

            const exercise: ParsedExercise = {
                order_index: startingIndex + exercises.length + 1,
                exercise_name: row.exercise_name || '',
                sets: parseInt(row.sets) || 3,
                reps: hasReps ? parseInt(row.reps) : null,
                duration_seconds: hasDuration ? parseInt(row.duration_seconds) : null,
                rest_seconds: parseInt(row.rest_seconds) || 60,
                equipment: row.equipment || 'None',
                video_url: row.video_url || '',
                notes: row.notes || '',
                isValid: errors.length === 0,
                errors
            };

            exercises.push(exercise);
        }

        return exercises;
    };

    // Simple CSV line parser that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);

        return result;
    };

    const handleFile = (file: File) => {
        setError(null);
        setParsedExercises([]);

        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const exercises = parseCSV(text);
                setParsedExercises(exercises);
            } catch (err: any) {
                setError(err.message);
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleImport = () => {
        const validExercises = parsedExercises
            .filter(ex => ex.isValid)
            .map(({ isValid, errors, ...ex }) => ex);

        onImport(validExercises);
        onClose();
        setParsedExercises([]);
    };

    const validCount = parsedExercises.filter(ex => ex.isValid).length;
    const invalidCount = parsedExercises.filter(ex => !ex.isValid).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet className="h-6 w-6 text-[#FF5E00]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase text-zinc-900">Import Exercises</h2>
                            <p className="text-xs text-zinc-500 font-medium">Upload a CSV file to bulk import exercises</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-all flex items-center justify-center"
                    >
                        <X className="h-5 w-5 text-zinc-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Download Template */}
                    <div className="flex items-center justify-between bg-blue-50 rounded-2xl p-4">
                        <div>
                            <p className="font-black text-blue-900 text-sm">Need a template?</p>
                            <p className="text-xs text-blue-600">Download our sample CSV with the correct format</p>
                        </div>
                        <button
                            onClick={downloadTemplate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download Template
                        </button>
                    </div>

                    {/* Upload Area */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                            isDragging
                                ? "border-[#FF5E00] bg-orange-50"
                                : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
                        )}
                    >
                        <Upload className={cn(
                            "h-12 w-12 mx-auto mb-4",
                            isDragging ? "text-[#FF5E00]" : "text-zinc-400"
                        )} />
                        <p className="font-black text-zinc-700 mb-1">
                            {isDragging ? 'Drop your file here' : 'Drag & drop your CSV file'}
                        </p>
                        <p className="text-sm text-zinc-500">or click to browse</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-700">Error parsing file</p>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {parsedExercises.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black uppercase text-zinc-700">Preview</h3>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1 text-emerald-600">
                                        <Check className="h-4 w-4" /> {validCount} valid
                                    </span>
                                    {invalidCount > 0 && (
                                        <span className="flex items-center gap-1 text-red-600">
                                            <AlertCircle className="h-4 w-4" /> {invalidCount} invalid
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-black uppercase text-xs text-zinc-600">#</th>
                                            <th className="text-left px-4 py-3 font-black uppercase text-xs text-zinc-600">Exercise</th>
                                            <th className="text-left px-4 py-3 font-black uppercase text-xs text-zinc-600">Sets</th>
                                            <th className="text-left px-4 py-3 font-black uppercase text-xs text-zinc-600">Reps/Time</th>
                                            <th className="text-left px-4 py-3 font-black uppercase text-xs text-zinc-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedExercises.map((ex, idx) => (
                                            <tr key={idx} className={cn(
                                                "border-t border-zinc-100",
                                                !ex.isValid && "bg-red-50"
                                            )}>
                                                <td className="px-4 py-3 font-bold text-zinc-500">{idx + 1}</td>
                                                <td className="px-4 py-3 font-bold text-zinc-900">{ex.exercise_name || '—'}</td>
                                                <td className="px-4 py-3 text-zinc-700">{ex.sets}</td>
                                                <td className="px-4 py-3 text-zinc-700">
                                                    {ex.reps ? `${ex.reps} reps` : ex.duration_seconds ? `${ex.duration_seconds}s` : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {ex.isValid ? (
                                                        <span className="flex items-center gap-1 text-emerald-600">
                                                            <Check className="h-4 w-4" /> Valid
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 text-xs">{ex.errors.join(', ')}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {parsedExercises.length > 0 && (
                    <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl bg-zinc-100 text-zinc-600 font-bold hover:bg-zinc-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={validCount === 0}
                            className="px-6 py-3 rounded-xl bg-[#FF5E00] text-white font-black uppercase hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Upload className="h-5 w-5" />
                            Import {validCount} Exercise{validCount !== 1 ? 's' : ''}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
