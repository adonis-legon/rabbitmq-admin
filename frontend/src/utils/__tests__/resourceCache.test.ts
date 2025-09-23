import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ResourceCache } from '../resourceCache';

describe('ResourceCache', () => {
    let cache: ResourceCache<any>;

    beforeEach(() => {
        cache = new ResourceCache({ ttl: 1000, maxSize: 3 });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('basic operations', () => {
        it('should store and retrieve data', () => {
            const data = { test: 'data' };
            const clusterId = 'cluster1';
            const resourceType = 'queues';
            const params = { page: 0 };

            cache.set(clusterId, resourceType, data, params);
            const retrieved = cache.get(clusterId, resourceType, params);

            expect(retrieved).toEqual(data);
        });

        it('should return null for non-existent data', () => {
            const result = cache.get('nonexistent', 'queues', {});
            expect(result).toBeNull();
        });

        it('should handle different parameter combinations', () => {
            const data1 = { test: 'data1' };
            const data2 = { test: 'data2' };
            const clusterId = 'cluster1';
            const resourceType = 'queues';

            cache.set(clusterId, resourceType, data1, { page: 0 });
            cache.set(clusterId, resourceType, data2, { page: 1 });

            expect(cache.get(clusterId, resourceType, { page: 0 })).toEqual(data1);
            expect(cache.get(clusterId, resourceType, { page: 1 })).toEqual(data2);
        });
    });

    describe('TTL (Time To Live)', () => {
        it('should return data within TTL', () => {
            const data = { test: 'data' };
            cache.set('cluster1', 'queues', data, {});

            // Advance time by 500ms (within TTL of 1000ms)
            vi.advanceTimersByTime(500);

            expect(cache.get('cluster1', 'queues', {})).toEqual(data);
        });

        it('should return null for expired data', () => {
            const data = { test: 'data' };
            cache.set('cluster1', 'queues', data, {});

            // Advance time by 1500ms (beyond TTL of 1000ms)
            vi.advanceTimersByTime(1500);

            expect(cache.get('cluster1', 'queues', {})).toBeNull();
        });

        it('should use custom TTL when provided', () => {
            const data = { test: 'data' };
            const customTTL = 2000;

            cache.set('cluster1', 'queues', data, {}, customTTL);

            // Advance time by 1500ms (within custom TTL of 2000ms)
            vi.advanceTimersByTime(1500);

            expect(cache.get('cluster1', 'queues', {})).toEqual(data);

            // Advance time by another 1000ms (beyond custom TTL)
            vi.advanceTimersByTime(1000);

            expect(cache.get('cluster1', 'queues', {})).toBeNull();
        });
    });

    describe('cache size management', () => {
        it('should enforce max size by removing oldest entries', () => {
            const data1 = { test: 'data1' };
            const data2 = { test: 'data2' };
            const data3 = { test: 'data3' };
            const data4 = { test: 'data4' };

            // Add 3 entries (at max size)
            cache.set('cluster1', 'queues', data1, { page: 0 });
            vi.advanceTimersByTime(10);
            cache.set('cluster1', 'queues', data2, { page: 1 });
            vi.advanceTimersByTime(10);
            cache.set('cluster1', 'queues', data3, { page: 2 });

            // All should be present
            expect(cache.get('cluster1', 'queues', { page: 0 })).toEqual(data1);
            expect(cache.get('cluster1', 'queues', { page: 1 })).toEqual(data2);
            expect(cache.get('cluster1', 'queues', { page: 2 })).toEqual(data3);

            // Add 4th entry (should remove oldest)
            vi.advanceTimersByTime(10);
            cache.set('cluster1', 'queues', data4, { page: 3 });

            // Oldest entry should be removed
            expect(cache.get('cluster1', 'queues', { page: 0 })).toBeNull();
            expect(cache.get('cluster1', 'queues', { page: 1 })).toEqual(data2);
            expect(cache.get('cluster1', 'queues', { page: 2 })).toEqual(data3);
            expect(cache.get('cluster1', 'queues', { page: 3 })).toEqual(data4);
        });
    });

    describe('cache invalidation', () => {
        it('should invalidate entries for specific cluster and resource type', () => {
            const data1 = { test: 'data1' };
            const data2 = { test: 'data2' };
            const data3 = { test: 'data3' };

            cache.set('cluster1', 'queues', data1, { page: 0 });
            cache.set('cluster1', 'exchanges', data2, { page: 0 });
            cache.set('cluster2', 'queues', data3, { page: 0 });

            // Invalidate cluster1 queues
            cache.invalidate('cluster1', 'queues');

            expect(cache.get('cluster1', 'queues', { page: 0 })).toBeNull();
            expect(cache.get('cluster1', 'exchanges', { page: 0 })).toEqual(data2);
            expect(cache.get('cluster2', 'queues', { page: 0 })).toEqual(data3);
        });

        it('should invalidate all entries for a cluster when resource type is not specified', () => {
            const data1 = { test: 'data1' };
            const data2 = { test: 'data2' };
            const data3 = { test: 'data3' };

            cache.set('cluster1', 'queues', data1, { page: 0 });
            cache.set('cluster1', 'exchanges', data2, { page: 0 });
            cache.set('cluster2', 'queues', data3, { page: 0 });

            // Invalidate all cluster1 entries
            cache.invalidate('cluster1');

            expect(cache.get('cluster1', 'queues', { page: 0 })).toBeNull();
            expect(cache.get('cluster1', 'exchanges', { page: 0 })).toBeNull();
            expect(cache.get('cluster2', 'queues', { page: 0 })).toEqual(data3);
        });
    });

    describe('cache clearing', () => {
        it('should clear all cache entries', () => {
            const data1 = { test: 'data1' };
            const data2 = { test: 'data2' };

            cache.set('cluster1', 'queues', data1, { page: 0 });
            cache.set('cluster2', 'exchanges', data2, { page: 0 });

            cache.clear();

            expect(cache.get('cluster1', 'queues', { page: 0 })).toBeNull();
            expect(cache.get('cluster2', 'exchanges', { page: 0 })).toBeNull();
        });
    });

    describe('cache statistics', () => {
        it('should provide accurate cache statistics', () => {
            const data1 = { test: 'data1' };
            const data2 = { test: 'data2' };

            // Add some data
            cache.set('cluster1', 'queues', data1, { page: 0 });
            cache.set('cluster1', 'queues', data2, { page: 1 });

            const stats = cache.getStats();

            expect(stats.size).toBe(2);
            expect(stats.maxSize).toBe(3);
            expect(stats.validEntries).toBe(2);
            expect(stats.expiredEntries).toBe(0);
        });

        it('should count expired entries correctly', () => {
            const data1 = { test: 'data1' };
            const data2 = { test: 'data2' };

            cache.set('cluster1', 'queues', data1, { page: 0 });
            cache.set('cluster1', 'queues', data2, { page: 1 });

            // Advance time to expire first entry
            vi.advanceTimersByTime(1500);

            const stats = cache.getStats();

            expect(stats.size).toBe(2); // Still in cache but expired
            expect(stats.validEntries).toBe(0); // Both expired
            expect(stats.expiredEntries).toBe(2);
        });
    });

    describe('key generation', () => {
        it('should generate consistent keys for same parameters', () => {
            const data = { test: 'data' };
            const params = { page: 1, size: 50, filter: 'test' };

            cache.set('cluster1', 'queues', data, params);

            // Should retrieve with same params in different order
            const reorderedParams = { filter: 'test', size: 50, page: 1 };
            expect(cache.get('cluster1', 'queues', reorderedParams)).toEqual(data);
        });

        it('should generate different keys for different parameters', () => {
            const data1 = { test: 'data1' };
            const data2 = { test: 'data2' };

            cache.set('cluster1', 'queues', data1, { page: 0 });
            cache.set('cluster1', 'queues', data2, { page: 1 });

            expect(cache.get('cluster1', 'queues', { page: 0 })).toEqual(data1);
            expect(cache.get('cluster1', 'queues', { page: 1 })).toEqual(data2);
        });
    });
});