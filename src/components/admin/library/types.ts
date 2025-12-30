'use client';

// Shared types for workout library components
export interface Exercise {
    id?: string;
    order_index: number;
    exercise_name: string;
    sets: number | null;
    reps: number | null;
    duration_seconds: number | null;
    rest_seconds: number;
    equipment: string;
    video_url: string;
    notes: string;
}

export interface WorkoutTemplate {
    id?: string;
    name: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
    tags: string[];
    exercises?: Exercise[];
}

export const PREDEFINED_TAGS = [
    'Beginner', 'Intermediate', 'Advanced',
    'Upper Body', 'Lower Body', 'Core', 'Full Body',
    'Strength', 'Cardio', 'HIIT', 'Recovery', 'Flexibility'
];
