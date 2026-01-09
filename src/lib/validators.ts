// WOD Validation Utilities
// Sprint 2 Task 5.3: Validation Rules

export interface WODValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface WODFormData {
    date: string;
    title: string;
    description: string;
    type: 'weekday' | 'weekend' | 'event';
    video_url?: string;
}

/**
 * Validates WOD form data before submission
 */
export function validateWOD(data: WODFormData): WODValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Date Validation
    const wodDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureLimit = new Date();
    futureLimit.setDate(futureLimit.getDate() + 90);

    if (wodDate < today) {
        warnings.push('Scheduling WOD for a past date. This may confuse participants.');
    }

    if (wodDate > futureLimit) {
        errors.push('Cannot schedule WOD more than 90 days in the future.');
    }

    // Title Validation
    if (!data.title || data.title.trim().length === 0) {
        errors.push('Title is required.');
    } else if (data.title.length < 5) {
        errors.push('Title must be at least 5 characters long.');
    } else if (data.title.length > 100) {
        errors.push('Title cannot exceed 100 characters.');
    }

    // Description Validation
    if (!data.description || data.description.trim().length === 0) {
        errors.push('Description is required.');
    } else if (data.description.length < 20) {
        errors.push('Description must be at least 20 characters long.');
    } else if (data.description.length > 2000) {
        errors.push('Description cannot exceed 2000 characters.');
    }

    // Video URL Validation (optional)
    if (data.video_url && data.video_url.trim().length > 0) {
        // Comprehensive pattern matching all YouTube URL formats
        const youtubePattern = /(?:(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|(?:https?:\/\/)?youtu\.be\/)([a-zA-Z0-9_-]{11})|^([a-zA-Z0-9_-]{11})$/i;

        if (!youtubePattern.test(data.video_url.trim())) {
            warnings.push('Video URL doesn\'t appear to be a valid YouTube link. It may not display correctly.');
        }
    }

    // Type-specific validations
    if (data.type === 'weekend') {
        const dayOfWeek = wodDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            warnings.push('Weekend WOD is scheduled for a weekday.');
        }
    }

    if (data.type === 'weekday') {
        const dayOfWeek = wodDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            warnings.push('Weekday WOD is scheduled for a weekend.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validates before bulk scheduling
 */
export function validateBulkSchedule(
    startDate: string,
    endDate: string,
    selectedWorkouts: number
): WODValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        errors.push('Start date must be before end date.');
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 30) {
        warnings.push('Scheduling more than 30 days at once. Consider breaking into smaller batches.');
    }

    if (selectedWorkouts === 0) {
        errors.push('Please select at least one workout from the library.');
    }

    if (daysDiff < selectedWorkouts && selectedWorkouts > 1) {
        warnings.push(`You have ${selectedWorkouts} workouts selected for ${daysDiff + 1} days. Some workouts may not be used.`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Checks for duplicate WOD content
 */
export function checkDuplicateWOD(
    title: string,
    description: string,
    existingWods: Array<{ title: string; description: string }>
): string | null {
    const exactMatch = existingWods.find(
        w => w.title.toLowerCase() === title.toLowerCase() &&
            w.description.toLowerCase() === description.toLowerCase()
    );

    if (exactMatch) {
        return 'An identical WOD already exists. Consider using the clone feature instead.';
    }

    const titleMatch = existingWods.find(
        w => w.title.toLowerCase() === title.toLowerCase()
    );

    if (titleMatch) {
        return 'A WOD with the same title already exists.';
    }

    return null;
}
