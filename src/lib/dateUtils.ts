// Native date formatting utilities
// Replaces date-fns with native Intl.DateTimeFormat for smaller bundle size

/**
 * Format a date in various styles
 * @param date - Date to format
 * @param style - 'full' | 'long' | 'short' | 'iso'
 * @returns Formatted date string
 */
export function formatDate(date: Date, style: 'full' | 'long' | 'short' | 'iso' = 'full'): string {
    if (style === 'iso') {
        return date.toISOString().split('T')[0];
    }

    const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    };

    if (style === 'full') {
        options.weekday = 'long';
    } else if (style === 'short') {
        options.month = 'short';
    }

    return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format time (e.g., "2:30 PM")
 * @param date - Date to extract time from
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

/**
 * Get relative time description (e.g., "2 days ago")
 * @param date - Date to compare against now
 * @returns Relative time string
 */
export function formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return formatDate(date, 'short');
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * @returns ISO date string for today
 */
export function getToday(): string {
    return formatDate(new Date(), 'iso');
}

/**
 * Format date with weekday for WOD display
 * @param date - Date to format
 * @returns Formatted string like "Monday, December 30"
 */
export function formatWodDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

/**
 * Calculate difference in days between two dates
 * @param later - Later date
 * @param earlier - Earlier date
 * @returns Number of days difference
 */
export function differenceInDays(later: Date, earlier: Date): number {
    const diffMs = later.getTime() - earlier.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Subtract days from a date
 * @param date - Starting date
 * @param days - Number of days to subtract
 * @returns New date
 */
export function subDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}

/**
 * Add days to a date
 * @param date - Starting date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Get short weekday name (Mon, Tue, etc.)
 * @param date - Date to format
 * @returns Short weekday string
 */
export function formatShortWeekday(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}
