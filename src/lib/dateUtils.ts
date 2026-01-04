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
 * Parse a YYYY-MM-DD string as local timezone (not UTC)
 * CRITICAL: new Date('YYYY-MM-DD') parses as UTC midnight, which shows as
 * previous day in IST. This function parses as local midnight instead.
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object at local midnight
 */
export function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
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

// =====================================================
// CALENDAR UTILITIES (for admin components)
// =====================================================

/**
 * Get the first day of a month
 */
export function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of a month
 */
export function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get the start of the week (Sunday) for a given date
 */
export function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
}

/**
 * Get the end of the week (Saturday) for a given date
 */
export function endOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day));
    return d;
}

/**
 * Get all days in an interval
 */
export function eachDayOfInterval(interval: { start: Date; end: Date }): Date[] {
    const days: Date[] = [];
    const current = new Date(interval.start);
    while (current <= interval.end) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return days;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

/**
 * Subtract months from a date
 */
export function subMonths(date: Date, months: number): Date {
    return addMonths(date, -months);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

/**
 * Check if a date is in the same month as another date
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

/**
 * Format month and year (e.g., "December 2024")
 */
export function formatMonthYear(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}
