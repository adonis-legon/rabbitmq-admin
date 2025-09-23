import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useConnections } from '../useConnections';
import { connectionsCache } from '../../utils/resourceCache';
import { rabbitmqResourcesApi } from '../../services/api/rabbitmqResourcesApi';

// Mock the API
vi.mock('../../services/api/rabbitmqResourcesApi', () => ({
    rabbitmqResourcesApi: {
        getConnections: vi.fn(),
    },
}));

// Mock the resource error handler
vi.mock('../useResourceErrorHandler', () => ({
    useResourceOperation: () => ({
        executeOperation: vi.fn((fn) => fn()),
        clearResourceErrors: vi.fn(),
    }),
}));

describe('useConnections with caching', () => {
    const mockConnections = {
        items: [
            {
                name: 'connection-1',
                state: 'running' as const,
                channels: 2,
                user: 'admin',
                vhost: '/',
                protocol: 'AMQP 0-9-1',
                host: 'localhost',
                port: 5672,
                peer_host: '127.0.0.1',
                peer_port: 54321,
                connected_at: Date.now(),
                timeout: 60,
                frame_max: 131072,
                recv_oct: 1024,
                recv_cnt: 10,
                send_oct: 2048,
                send_cnt: 20,
                client_properties: {
                    connection_name: 'test-connection',
                    platform: 'Node.js',
                    product: 'amqplib',
                    version: '0.10.3',
                },
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
        connectionsCache.clear();
        vi.mocked(rabbitmqResourcesApi.getConnections).mockResolvedValue(mockConnections);
    });

    afterEach(() => {
        connectionsCache.clear();
    });

    it('should use cached data when available', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        // Pre-populate cache
        connectionsCache.set(clusterId, 'connections', mockConnections, params);

        const { result } = renderHook(() => useConnections());

        await act(async () => {
            await result.current.loadConnections(clusterId, params);
        });

        // Should not call API since data is cached
        expect(rabbitmqResourcesApi.getConnections).not.toHaveBeenCalled();
        expect(result.current.data).toEqual(mockConnections);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should fetch from API when cache is empty', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        const { result } = renderHook(() => useConnections());

        await act(async () => {
            await result.current.loadConnections(clusterId, params);
        });

        // Should call API since cache is empty
        expect(rabbitmqResourcesApi.getConnections).toHaveBeenCalledWith(clusterId, params);
        expect(result.current.data).toEqual(mockConnections);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should cache API response after successful fetch', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        const { result } = renderHook(() => useConnections());

        await act(async () => {
            await result.current.loadConnections(clusterId, params);
        });

        // Verify data was cached
        const cachedData = connectionsCache.get(clusterId, 'connections', params);
        expect(cachedData).toEqual(mockConnections);
    });

    it('should invalidate cache on refresh', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        // Pre-populate cache
        connectionsCache.set(clusterId, 'connections', mockConnections, params);

        const { result } = renderHook(() => useConnections());

        // Load initial data (should use cache)
        await act(async () => {
            await result.current.loadConnections(clusterId, params);
        });

        expect(rabbitmqResourcesApi.getConnections).not.toHaveBeenCalled();

        // Refresh should invalidate cache and call API
        await act(async () => {
            await result.current.refreshConnections();
        });

        expect(rabbitmqResourcesApi.getConnections).toHaveBeenCalledWith(clusterId, params);
    });

    it('should provide cache invalidation function', () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        // Pre-populate cache
        connectionsCache.set(clusterId, 'connections', mockConnections, params);

        const { result } = renderHook(() => useConnections());

        // Verify cache has data
        expect(connectionsCache.get(clusterId, 'connections', params)).toEqual(mockConnections);

        // Invalidate cache
        act(() => {
            result.current.invalidateCache(clusterId);
        });

        // Verify cache is cleared
        expect(connectionsCache.get(clusterId, 'connections', params)).toBeNull();
    });

    it('should handle cache with different parameters separately', async () => {
        const clusterId = 'test-cluster';
        const params1 = { page: 0, pageSize: 50 };
        const params2 = { page: 1, pageSize: 50 };

        const mockConnections2 = { ...mockConnections, page: 1 };

        // Pre-populate cache for first set of params
        connectionsCache.set(clusterId, 'connections', mockConnections, params1);

        const { result } = renderHook(() => useConnections());

        // Load with first params (should use cache)
        await act(async () => {
            await result.current.loadConnections(clusterId, params1);
        });

        expect(rabbitmqResourcesApi.getConnections).not.toHaveBeenCalled();
        expect(result.current.data).toEqual(mockConnections);

        // Load with second params (should call API)
        vi.mocked(rabbitmqResourcesApi.getConnections).mockResolvedValueOnce(mockConnections2);

        await act(async () => {
            await result.current.loadConnections(clusterId, params2);
        });

        expect(rabbitmqResourcesApi.getConnections).toHaveBeenCalledWith(clusterId, params2);
        expect(result.current.data).toEqual(mockConnections2);
    });

    it('should update lastUpdated timestamp when loading from cache', async () => {
        const clusterId = 'test-cluster';
        const params = { page: 0, pageSize: 50 };

        // Pre-populate cache
        connectionsCache.set(clusterId, 'connections', mockConnections, params);

        const { result } = renderHook(() => useConnections());

        const beforeLoad = Date.now();

        await act(async () => {
            await result.current.loadConnections(clusterId, params);
        });

        const afterLoad = Date.now();

        expect(result.current.lastUpdated).toBeDefined();
        expect(result.current.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeLoad);
        expect(result.current.lastUpdated!.getTime()).toBeLessThanOrEqual(afterLoad);
    });
});