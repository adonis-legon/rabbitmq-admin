import { vi } from 'vitest';
import {
    parseUtcTimestamp,
    formatTimestampToLocal,
    formatTimestampToUtc,
    formatTimestamp,
    getUserTimezone,
    getTimezoneOffset,
    getTimezoneOffsetString,
    getTimestampDisplayModes,
    formatTimestampForTable,
    isValidTimestamp,
    getRelativeTime,
    DEFAULT_TIMESTAMP_OPTIONS,
} from '../timestampUtils';

// Mock Date to ensure consistent test results
const MOCK_DATE = '2024-01-15T10:30:45.123Z';
const MOCK_DATE_OBJECT = new Date(MOCK_DATE);

describe('timestampUtils', () => {
    beforeEach(() => {
        // Mock the current date for consistent testing
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_DATE_OBJECT);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('parseUtcTimestamp', () => {
        it('should parse valid ISO 8601 timestamp', () => {
            const result = parseUtcTimestamp(MOCK_DATE);
            expect(result).toBeInstanceOf(Date);
            expect(result?.getTime()).toBe(MOCK_DATE_OBJECT.getTime());
        });

        it('should parse valid timestamp with different formats', () => {
            const timestamps = [
                '2024-01-15T10:30:45Z',
                '2024-01-15T10:30:45.000Z',
                '2024-01-15 10:30:45',
            ];

            timestamps.forEach(timestamp => {
                const result = parseUtcTimestamp(timestamp);
                expect(result).toBeInstanceOf(Date);
            });
        });

        it('should return null for invalid timestamps', () => {
            const invalidTimestamps = [
                'invalid-date',
                '',
                '2024-13-45T25:70:90Z',
                'not-a-date',
            ];

            invalidTimestamps.forEach(timestamp => {
                const result = parseUtcTimestamp(timestamp);
                expect(result).toBeNull();
            });
        });
    });

    describe('formatTimestampToLocal', () => {
        it('should format timestamp to local time with default options', () => {
            const result = formatTimestampToLocal(MOCK_DATE);
            expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Should contain date
            expect(result).toMatch(/\d{2}:\d{2}:\d{2}/); // Should contain time with seconds
        });

        it('should format timestamp without seconds when specified', () => {
            const result = formatTimestampToLocal(MOCK_DATE, {
                includeSeconds: false,
            });
            expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Should contain date
            expect(result).toMatch(/\d{2}:\d{2}/); // Should contain time without seconds
            expect(result).not.toMatch(/\d{2}:\d{2}:\d{2}/); // Should not contain seconds
        });

        it('should format timestamp without timezone when specified', () => {
            const result = formatTimestampToLocal(MOCK_DATE, {
                includeTimezone: false,
            });
            expect(result).not.toMatch(/[A-Z]{3,4}/); // Should not contain timezone abbreviation
        });

        it('should use 12-hour format when specified', () => {
            const result = formatTimestampToLocal(MOCK_DATE, {
                use12Hour: true,
            });
            expect(result).toMatch(/[AP]M/); // Should contain AM or PM
        });

        it('should return original timestamp for invalid input', () => {
            const invalidTimestamp = 'invalid-date';
            const result = formatTimestampToLocal(invalidTimestamp);
            expect(result).toBe(invalidTimestamp);
        });
    });

    describe('formatTimestampToUtc', () => {
        it('should format timestamp to UTC with default options', () => {
            const result = formatTimestampToUtc(MOCK_DATE);
            expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Should contain date
            expect(result).toMatch(/\d{2}:\d{2}:\d{2}/); // Should contain time with seconds
            expect(result).toMatch(/UTC/); // Should contain UTC indicator
        });

        it('should return original timestamp for invalid input', () => {
            const invalidTimestamp = 'invalid-date';
            const result = formatTimestampToUtc(invalidTimestamp);
            expect(result).toBe(invalidTimestamp);
        });
    });

    describe('formatTimestamp', () => {
        it('should format to local time when showLocal is true', () => {
            const result = formatTimestamp(MOCK_DATE, true);
            // Should not contain UTC (unless user is in UTC timezone)
            expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
        });

        it('should format to UTC when showLocal is false', () => {
            const result = formatTimestamp(MOCK_DATE, false);
            expect(result).toMatch(/UTC/);
        });

        it('should use default options when not specified', () => {
            const result = formatTimestamp(MOCK_DATE);
            expect(result).toMatch(/\d{2}:\d{2}:\d{2}/); // Should include seconds by default
        });
    });

    describe('getUserTimezone', () => {
        it('should return a valid timezone string', () => {
            const timezone = getUserTimezone();
            expect(typeof timezone).toBe('string');
            expect(timezone.length).toBeGreaterThan(0);
        });

        it('should return UTC as fallback when Intl is not available', () => {
            const originalIntl = global.Intl;
            // @ts-ignore
            global.Intl = undefined;

            const timezone = getUserTimezone();
            expect(timezone).toBe('UTC');

            global.Intl = originalIntl;
        });
    });

    describe('getTimezoneOffset', () => {
        it('should return timezone offset in minutes', () => {
            const offset = getTimezoneOffset();
            expect(typeof offset).toBe('number');
            expect(offset).toBeGreaterThanOrEqual(-12 * 60); // -12 hours
            expect(offset).toBeLessThanOrEqual(14 * 60); // +14 hours
        });

        it('should accept custom date parameter', () => {
            const customDate = new Date('2024-06-15T12:00:00Z'); // Summer date
            const offset = getTimezoneOffset(customDate);
            expect(typeof offset).toBe('number');
        });
    });

    describe('getTimezoneOffsetString', () => {
        it('should return formatted timezone offset string', () => {
            const offsetString = getTimezoneOffsetString();
            expect(offsetString).toMatch(/^[+-]\d{2}:\d{2}$/);
        });

        it('should handle positive and negative offsets correctly', () => {
            // Mock different timezone offsets
            const mockDate = new Date();
            vi.spyOn(mockDate, 'getTimezoneOffset').mockReturnValue(-300); // +5:00

            const offsetString = getTimezoneOffsetString(mockDate);
            expect(offsetString).toBe('+05:00');
        });
    });

    describe('getTimestampDisplayModes', () => {
        it('should return array with local and UTC modes', () => {
            const modes = getTimestampDisplayModes();
            expect(modes).toHaveLength(2);
            expect(modes[0].showLocal).toBe(true);
            expect(modes[1].showLocal).toBe(false);
            expect(modes[0].label).toContain('Local');
            expect(modes[1].label).toBe('UTC');
        });
    });

    describe('formatTimestampForTable', () => {
        it('should return object with date, time, and full properties', () => {
            const result = formatTimestampForTable(MOCK_DATE);
            expect(result).toHaveProperty('date');
            expect(result).toHaveProperty('time');
            expect(result).toHaveProperty('full');
            expect(typeof result.date).toBe('string');
            expect(typeof result.time).toBe('string');
            expect(typeof result.full).toBe('string');
        });

        it('should format for local time when showLocal is true', () => {
            const result = formatTimestampForTable(MOCK_DATE, true);
            expect(result.date).toMatch(/\d{2}\/\d{2}\/\d{4}/);
            expect(result.time).toMatch(/\d{2}:\d{2}/);
        });

        it('should format for UTC when showLocal is false', () => {
            const result = formatTimestampForTable(MOCK_DATE, false);
            expect(result.full).toMatch(/UTC/);
        });

        it('should handle invalid timestamps gracefully', () => {
            const invalidTimestamp = 'invalid-date';
            const result = formatTimestampForTable(invalidTimestamp);
            expect(result.date).toBe(invalidTimestamp);
            expect(result.time).toBe('');
            expect(result.full).toBe(invalidTimestamp);
        });
    });

    describe('isValidTimestamp', () => {
        it('should return true for valid timestamps', () => {
            const validTimestamps = [
                MOCK_DATE,
                '2024-01-15T10:30:45Z',
                '2024-01-15T10:30:45.000Z',
            ];

            validTimestamps.forEach(timestamp => {
                expect(isValidTimestamp(timestamp)).toBe(true);
            });
        });

        it('should return false for invalid timestamps', () => {
            const invalidTimestamps = [
                'invalid-date',
                '',
                '2024-13-45T25:70:90Z',
                'not-a-date',
            ];

            invalidTimestamps.forEach(timestamp => {
                expect(isValidTimestamp(timestamp)).toBe(false);
            });
        });
    });

    describe('getRelativeTime', () => {
        it('should return "Just now" for very recent timestamps', () => {
            const recentTimestamp = new Date(Date.now() - 30 * 1000).toISOString(); // 30 seconds ago
            const result = getRelativeTime(recentTimestamp);
            expect(result).toBe('Just now');
        });

        it('should return minutes ago for timestamps within an hour', () => {
            const timestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
            const result = getRelativeTime(timestamp);
            expect(result).toBe('5 minutes ago');
        });

        it('should return hours ago for timestamps within a day', () => {
            const timestamp = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
            const result = getRelativeTime(timestamp);
            expect(result).toBe('3 hours ago');
        });

        it('should return days ago for older timestamps', () => {
            const timestamp = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
            const result = getRelativeTime(timestamp);
            expect(result).toBe('2 days ago');
        });

        it('should handle future timestamps', () => {
            const futureTimestamp = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
            const result = getRelativeTime(futureTimestamp);
            expect(result).toBe('In 5 minutes');
        });

        it('should handle singular forms correctly', () => {
            const timestamp1 = new Date(Date.now() - 1 * 60 * 1000).toISOString(); // 1 minute ago
            const result1 = getRelativeTime(timestamp1);
            expect(result1).toBe('1 minute ago');

            const timestamp2 = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
            const result2 = getRelativeTime(timestamp2);
            expect(result2).toBe('1 hour ago');

            const timestamp3 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
            const result3 = getRelativeTime(timestamp3);
            expect(result3).toBe('1 day ago');
        });

        it('should return "Invalid date" for invalid timestamps', () => {
            const result = getRelativeTime('invalid-date');
            expect(result).toBe('Invalid date');
        });

        it('should accept custom reference time', () => {
            const referenceTime = new Date('2024-01-15T12:00:00Z');
            const timestamp = new Date('2024-01-15T11:00:00Z').toISOString(); // 1 hour before reference
            const result = getRelativeTime(timestamp, referenceTime);
            expect(result).toBe('1 hour ago');
        });
    });

    describe('DEFAULT_TIMESTAMP_OPTIONS', () => {
        it('should have expected default values', () => {
            expect(DEFAULT_TIMESTAMP_OPTIONS).toEqual({
                includeSeconds: true,
                includeTimezone: true,
                use12Hour: false,
                locale: undefined,
            });
        });
    });
});