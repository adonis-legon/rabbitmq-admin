/**
 * Timestamp utility functions for handling UTC to local timezone conversions
 * and consistent date/time formatting across the audit interface.
 */

export interface TimestampFormatOptions {
    /** Whether to include seconds in the time display */
    includeSeconds?: boolean;
    /** Whether to include timezone information */
    includeTimezone?: boolean;
    /** Whether to use 12-hour format (AM/PM) instead of 24-hour */
    use12Hour?: boolean;
    /** Custom locale for formatting (defaults to user's locale) */
    locale?: string;
}

export interface TimestampDisplayMode {
    /** Whether to show local time or UTC */
    showLocal: boolean;
    /** Label to display for the current mode */
    label: string;
}

/**
 * Default formatting options for audit timestamps
 */
export const DEFAULT_TIMESTAMP_OPTIONS: TimestampFormatOptions = {
    includeSeconds: true,
    includeTimezone: true,
    use12Hour: false,
    locale: undefined, // Use browser default
};

/**
 * Converts a UTC timestamp string to a Date object
 * @param utcTimestamp - UTC timestamp string (ISO 8601 format)
 * @returns Date object or null if invalid
 */
export const parseUtcTimestamp = (utcTimestamp: string): Date | null => {
    try {
        const date = new Date(utcTimestamp);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    } catch (error) {
        return null;
    }
};

/**
 * Formats a UTC timestamp to local time with customizable options
 * @param utcTimestamp - UTC timestamp string
 * @param options - Formatting options
 * @returns Formatted timestamp string
 */
export const formatTimestampToLocal = (
    utcTimestamp: string,
    options: TimestampFormatOptions = DEFAULT_TIMESTAMP_OPTIONS
): string => {
    const date = parseUtcTimestamp(utcTimestamp);
    if (!date) {
        return utcTimestamp; // Return original if parsing fails
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: options.use12Hour || false,
    };

    if (options.includeSeconds) {
        formatOptions.second = '2-digit';
    }

    if (options.includeTimezone) {
        formatOptions.timeZoneName = 'short';
    }

    try {
        return date.toLocaleString(options.locale, formatOptions);
    } catch (error) {
        // Fallback to ISO string if locale formatting fails
        return date.toLocaleString();
    }
};

/**
 * Formats a UTC timestamp to UTC display format
 * @param utcTimestamp - UTC timestamp string
 * @param options - Formatting options
 * @returns Formatted UTC timestamp string
 */
export const formatTimestampToUtc = (
    utcTimestamp: string,
    options: TimestampFormatOptions = DEFAULT_TIMESTAMP_OPTIONS
): string => {
    const date = parseUtcTimestamp(utcTimestamp);
    if (!date) {
        return utcTimestamp; // Return original if parsing fails
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: options.use12Hour || false,
        timeZone: 'UTC',
    };

    if (options.includeSeconds) {
        formatOptions.second = '2-digit';
    }

    if (options.includeTimezone) {
        formatOptions.timeZoneName = 'short';
    }

    try {
        return date.toLocaleString(options.locale, formatOptions);
    } catch (error) {
        // Fallback to ISO string if locale formatting fails
        return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
    }
};

/**
 * Formats a timestamp based on the display mode (local or UTC)
 * @param utcTimestamp - UTC timestamp string
 * @param showLocal - Whether to show local time (true) or UTC (false)
 * @param options - Formatting options
 * @returns Formatted timestamp string
 */
export const formatTimestamp = (
    utcTimestamp: string,
    showLocal: boolean = true,
    options: TimestampFormatOptions = DEFAULT_TIMESTAMP_OPTIONS
): string => {
    return showLocal
        ? formatTimestampToLocal(utcTimestamp, options)
        : formatTimestampToUtc(utcTimestamp, options);
};

/**
 * Gets the user's current timezone name
 * @returns Timezone name (e.g., "America/New_York", "UTC")
 */
export const getUserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        return 'UTC';
    }
};

/**
 * Gets the timezone offset in minutes for a given date
 * @param date - Date object (defaults to current date)
 * @returns Timezone offset in minutes
 */
export const getTimezoneOffset = (date: Date = new Date()): number => {
    return date.getTimezoneOffset();
};

/**
 * Gets a human-readable timezone offset string
 * @param date - Date object (defaults to current date)
 * @returns Timezone offset string (e.g., "+05:30", "-08:00")
 */
export const getTimezoneOffsetString = (date: Date = new Date()): string => {
    const offset = getTimezoneOffset(date);
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';

    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Creates display modes for timestamp toggle
 * @returns Array of timestamp display modes
 */
export const getTimestampDisplayModes = (): TimestampDisplayMode[] => {
    const userTimezone = getUserTimezone();
    const offsetString = getTimezoneOffsetString();

    return [
        {
            showLocal: true,
            label: `Local (${userTimezone} ${offsetString})`,
        },
        {
            showLocal: false,
            label: 'UTC',
        },
    ];
};

/**
 * Formats a timestamp for table display with date and time on separate lines
 * @param utcTimestamp - UTC timestamp string
 * @param showLocal - Whether to show local time
 * @param options - Formatting options
 * @returns Object with date and time strings
 */
export const formatTimestampForTable = (
    utcTimestamp: string,
    showLocal: boolean = true,
    options: TimestampFormatOptions = DEFAULT_TIMESTAMP_OPTIONS
): { date: string; time: string; full: string } => {
    const date = parseUtcTimestamp(utcTimestamp);
    if (!date) {
        return { date: utcTimestamp, time: '', full: utcTimestamp };
    }

    const timeZone = showLocal ? undefined : 'UTC';

    const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone,
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: options.use12Hour || false,
        timeZone,
    };

    if (options.includeSeconds) {
        timeOptions.second = '2-digit';
    }

    try {
        const dateStr = date.toLocaleDateString(options.locale, dateOptions);
        const timeStr = date.toLocaleTimeString(options.locale, timeOptions);
        const fullStr = formatTimestamp(utcTimestamp, showLocal, options);

        return {
            date: dateStr,
            time: timeStr,
            full: fullStr,
        };
    } catch (error) {
        const fallback = formatTimestamp(utcTimestamp, showLocal, options);
        const parts = fallback.split(' ');
        return {
            date: parts[0] || fallback,
            time: parts.slice(1).join(' ') || '',
            full: fallback,
        };
    }
};

/**
 * Validates if a timestamp string is in valid ISO 8601 format
 * @param timestamp - Timestamp string to validate
 * @returns True if valid, false otherwise
 */
export const isValidTimestamp = (timestamp: string): boolean => {
    const date = parseUtcTimestamp(timestamp);
    return date !== null;
};

/**
 * Gets relative time string (e.g., "2 hours ago", "in 5 minutes")
 * @param utcTimestamp - UTC timestamp string
 * @param referenceTime - Reference time (defaults to current time)
 * @returns Relative time string
 */
export const getRelativeTime = (
    utcTimestamp: string,
    referenceTime: Date = new Date()
): string => {
    const date = parseUtcTimestamp(utcTimestamp);
    if (!date) {
        return 'Invalid date';
    }

    const diffMs = referenceTime.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffSeconds) < 60) {
        return diffSeconds >= 0 ? 'Just now' : 'In a moment';
    } else if (Math.abs(diffMinutes) < 60) {
        const minutes = Math.abs(diffMinutes);
        return diffMinutes >= 0
            ? `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
            : `In ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (Math.abs(diffHours) < 24) {
        const hours = Math.abs(diffHours);
        return diffHours >= 0
            ? `${hours} hour${hours !== 1 ? 's' : ''} ago`
            : `In ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
        const days = Math.abs(diffDays);
        return diffDays >= 0
            ? `${days} day${days !== 1 ? 's' : ''} ago`
            : `In ${days} day${days !== 1 ? 's' : ''}`;
    }
};