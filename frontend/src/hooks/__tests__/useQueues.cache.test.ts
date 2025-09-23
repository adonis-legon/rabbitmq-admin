import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useQueues } from '../useQueues';
import { queuesCache } from '../../utils/resourceCache';
import { rabbitmqResourcesApi } from '../../services/api/rabbitmqResourcesApi';

// Mock the API
vi.mock('../../services/api/rabbitmqResourcesApi', () => ({
    rabbitmqResourcesApi: {
        getQueues: vi.fn(),
    },
}));

describe('useQueues with caching', () => {
    const mockQueues = {
        items: [
            {
                name: 'test-queue',
                state: 'running' as const,
                vhost: '/',
                node: 'rabbit@localhost',
                durable: true,
                auto_delete: false,
                exclusive: false,
                arguments: {},
                messages: 10,
                messages_ready: 8,
                messages_unacknowledged: 2,
                consumers: 1,
                memory: 1024,
                message_stats: {
                    publish: 100,
                    publish_details: { rate: 1.5 },
                    deliver_get: 90,
                    deliver_get_details: { rate: 1.2 },
                },
                consumer_utilisation: 0.8,
                consumer_details: [],
            },
        ],
        page: 0,
        pageSize: 50,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        queuesCache.clear();
        vi.mocked(rabbitmqResourcesApi.getQueues).mockResolvedValue(mockQueues);
    });

    afterEach(() => {
        queuesCache.clear();
    });

    it('should use cached data when available', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        // Pre-populate cache
        queuesCache.set(clusterId, 'queues', mockQueues, params);

        const { result } = renderHook(() => useQueues());

        await act(async () => {
            await result.current.loadQueues(clusterId, params);
        });

        // Should not call API since data is cached
        expect(rabbitmqResourcesApi.getQueues).not.toHaveBeenCalled();
        expect(result.current.data).toEqual(mockQueues);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should fetch from API when cache is empty', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        const { result } = renderHook(() => useQueues());

        await act(async () => {
            await result.current.loadQueues(clusterId, params);
        });

        // Should call API since cache is empty
        expect(rabbitmqResourcesApi.getQueues).toHaveBeenCalledWith(clusterId, params);
        expect(result.current.data).toEqual(mockQueues);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should cache API response after successful fetch', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        const { result } = renderHook(() => useQueues());

        await act(async () => {
            await result.current.loadQueues(clusterId, params);
        });

        // Verify data was cached
        const cachedData = queuesCache.get(clusterId, 'queues', params);
        expect(cachedData).toEqual(mockQueues);
    });

    it('should invalidate cache on refresh', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        // Pre-populate cache
        queuesCache.set(clusterId, 'queues', mockQueues, params);

        const { result } = renderHook(() => useQueues());

        // Load initial data (should use cache)
        await act(async () => {
            await result.current.loadQueues(clusterId, params);
        });

        expect(rabbitmqResourcesApi.getQueues).not.toHaveBeenCalled();

        // Refresh should invalidate cache and call API
        await act(async () => {
            await result.current.refreshQueues();
        });

        expect(rabbitmqResourcesApi.getQueues).toHaveBeenCalledWith(clusterId, params);
    });

    it('should provide cache invalidation function', () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        // Pre-populate cache
        queuesCache.set(clusterId, 'queues', mockQueues, params);

        const { result } = renderHook(() => useQueues());

        // Verify cache has data
        expect(queuesCache.get(clusterId, 'queues', params)).toEqual(mockQueues);

        // Invalidate cache
        act(() => {
            result.current.invalidateCache(clusterId);
        });

        // Verify cache is cleared
        expect(queuesCache.get(clusterId, 'queues', params)).toBeNull();
    });

    it('should handle auto-refresh with cache invalidation', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        const { result } = renderHook(() => useQueues({ autoRefresh: true, refreshInterval: 100 }));

        // Load initial data
        await act(async () => {
            await result.current.loadQueues(clusterId, params);
        });

        expect(rabbitmqResourcesApi.getQueues).toHaveBeenCalledTimes(1);

        // Wait for auto-refresh to trigger
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
        });

        // Should have called API again due to auto-refresh
        expect(rabbitmqResourcesApi.getQueues).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully and not cache failed responses', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };
        const error = new Error('API Error');

        vi.mocked(rabbitmqResourcesApi.getQueues).mockRejectedValueOnce(error);

        const { result } = renderHook(() => useQueues());

        await act(async () => {
            await result.current.loadQueues(clusterId, params);
        });

        // Should have error and no cached data
        expect(result.current.error).toBeDefined();
        expect(result.current.data).toBeNull();
        expect(queuesCache.get(clusterId, 'queues', params)).toBeNull();
    });
});