import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCacheStats } from '../useCacheStats';
import {
    connectionsCache,
    channelsCache,
    exchangesCache,
    queuesCache,
    bindingsCache
} from '../../utils/resourceCache';

// Mock the cache modules
vi.mock('../../utils/resourceCache', () => {
    const mockStats = {
        size: 5,
        maxSize: 50,
        hitRate: 0.8,
        validEntries: 4,
        expiredEntries: 1,
    };

    return {
        connectionsCache: {
            getStats: vi.fn(() => mockStats),
            clear: vi.fn(),
            invalidate: vi.fn(),
        },
        channelsCache: {
            getStats: vi.fn(() => mockStats),
            clear: vi.fn(),
            invalidate: vi.fn(),
        },
        exchangesCache: {
            getStats: vi.fn(() => mockStats),
            clear: vi.fn(),
            invalidate: vi.fn(),
        },
        queuesCache: {
            getStats: vi.fn(() => mockStats),
            clear: vi.fn(),
            invalidate: vi.fn(),
        },
        bindingsCache: {
            getStats: vi.fn(() => mockStats),
            clear: vi.fn(),
            invalidate: vi.fn(),
        },
    };
});

describe('useCacheStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return cache statistics', () => {
        const { result } = renderHook(() => useCacheStats(100)); // Short interval for testing

        expect(result.current.stats).toBeDefined();
        expect(result.current.stats?.total.size).toBe(25); // 5 caches * 5 items each
        expect(result.current.stats?.total.validEntries).toBe(20); // 5 caches * 4 valid each
    });

    it('should provide cache management functions', () => {
        const { result } = renderHook(() => useCacheStats());

        expect(typeof result.current.clearAllCaches).toBe('function');
        expect(typeof result.current.invalidateClusterCaches).toBe('function');
    });

    it('should clear all caches when clearAllCaches is called', () => {
        const { result } = renderHook(() => useCacheStats());

        act(() => {
            result.current.clearAllCaches();
        });

        expect(connectionsCache.clear).toHaveBeenCalled();
        expect(channelsCache.clear).toHaveBeenCalled();
        expect(exchangesCache.clear).toHaveBeenCalled();
        expect(queuesCache.clear).toHaveBeenCalled();
        expect(bindingsCache.clear).toHaveBeenCalled();
    });

    it('should invalidate cluster caches when invalidateClusterCaches is called', () => {
        const { result } = renderHook(() => useCacheStats());
        const clusterId = 'test-cluster';

        act(() => {
            result.current.invalidateClusterCaches(clusterId);
        });

        expect(connectionsCache.invalidate).toHaveBeenCalledWith(clusterId);
        expect(channelsCache.invalidate).toHaveBeenCalledWith(clusterId);
        expect(exchangesCache.invalidate).toHaveBeenCalledWith(clusterId);
        expect(queuesCache.invalidate).toHaveBeenCalledWith(clusterId);
        expect(bindingsCache.invalidate).toHaveBeenCalledWith(clusterId);
    });
});