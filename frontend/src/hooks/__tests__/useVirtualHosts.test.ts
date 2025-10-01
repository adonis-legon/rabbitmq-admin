/// <reference types="vitest" />
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { useVirtualHosts, clearVirtualHostsCache } from '../useVirtualHosts';
import { rabbitmqResourcesApi } from '../../services/api/rabbitmqResourcesApi';
import { VirtualHost } from '../../types/rabbitmq';

// Mock the API
vi.mock('../../services/api/rabbitmqResourcesApi');
const mockRabbitmqResourcesApi = rabbitmqResourcesApi as any;

const mockVirtualHosts: VirtualHost[] = [
    {
        name: '/',
        description: 'Default virtual host',
        tags: 'administrator'
    },
    {
        name: 'test-vhost',
        description: 'Test virtual host',
        tags: 'management'
    },
    {
        name: 'production',
        description: 'Production virtual host'
    }
];

describe('useVirtualHosts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearVirtualHostsCache(); // Clear cache between tests
    });

    afterEach(() => {
        clearVirtualHostsCache(); // Clear cache after tests too
    });

    it('initializes with empty state', () => {
        const { result } = renderHook(() => useVirtualHosts());

        expect(result.current.virtualHosts).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('loads virtual hosts when clusterId is provided', async () => {
        mockRabbitmqResourcesApi.getVirtualHosts.mockResolvedValue(mockVirtualHosts);

        const { result } = renderHook(() => useVirtualHosts('test-cluster'));

        // Initially loading should be true
        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.virtualHosts).toEqual(mockVirtualHosts);
        expect(result.current.error).toBe(null);
        expect(mockRabbitmqResourcesApi.getVirtualHosts).toHaveBeenCalledWith('test-cluster');
    });

    it('handles API errors correctly', async () => {
        const errorMessage = 'Failed to fetch virtual hosts';
        mockRabbitmqResourcesApi.getVirtualHosts.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useVirtualHosts('test-cluster'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.virtualHosts).toEqual([]);
        expect(result.current.error).toBe(errorMessage);
    });

    it('handles API errors without message', async () => {
        mockRabbitmqResourcesApi.getVirtualHosts.mockRejectedValue('Unknown error');

        const { result } = renderHook(() => useVirtualHosts('test-cluster'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.virtualHosts).toEqual([]);
        expect(result.current.error).toBe('Failed to load virtual hosts. Please try again.');
    });

    it('clears data when clusterId changes to undefined', async () => {
        mockRabbitmqResourcesApi.getVirtualHosts.mockResolvedValue(mockVirtualHosts);

        const { result, rerender } = renderHook(
            ({ clusterId }: { clusterId?: string }) => useVirtualHosts(clusterId),
            { initialProps: { clusterId: 'test-cluster' as string | undefined } }
        );

        await waitFor(() => {
            expect(result.current.virtualHosts).toEqual(mockVirtualHosts);
        });

        // Change clusterId to undefined
        rerender({ clusterId: undefined });

        expect(result.current.virtualHosts).toEqual([]);
        expect(result.current.error).toBe(null);
    });

    it('reloads virtual hosts when clusterId changes', async () => {
        const cluster1VHosts = [mockVirtualHosts[0]];
        const cluster2VHosts = [mockVirtualHosts[1]];

        mockRabbitmqResourcesApi.getVirtualHosts
            .mockResolvedValueOnce(cluster1VHosts)
            .mockResolvedValueOnce(cluster2VHosts);

        const { result, rerender } = renderHook(
            ({ clusterId }: { clusterId?: string }) => useVirtualHosts(clusterId),
            { initialProps: { clusterId: 'cluster-1' as string | undefined } }
        );

        await waitFor(() => {
            expect(result.current.virtualHosts).toEqual(cluster1VHosts);
        });

        // Change to different cluster
        rerender({ clusterId: 'cluster-2' });

        await waitFor(() => {
            expect(result.current.virtualHosts).toEqual(cluster2VHosts);
        });

        expect(mockRabbitmqResourcesApi.getVirtualHosts).toHaveBeenCalledWith('cluster-1');
        expect(mockRabbitmqResourcesApi.getVirtualHosts).toHaveBeenCalledWith('cluster-2');
    });

    it('manually loads virtual hosts with loadVirtualHosts', async () => {
        mockRabbitmqResourcesApi.getVirtualHosts.mockResolvedValue(mockVirtualHosts);

        const { result } = renderHook(() => useVirtualHosts());

        await act(async () => {
            await result.current.loadVirtualHosts('manual-cluster');
        });

        expect(result.current.virtualHosts).toEqual(mockVirtualHosts);
        expect(result.current.error).toBe(null);
        expect(mockRabbitmqResourcesApi.getVirtualHosts).toHaveBeenCalledWith('manual-cluster');
    });

    it('handles errors in manual loadVirtualHosts', async () => {
        const errorMessage = 'Manual load failed';
        mockRabbitmqResourcesApi.getVirtualHosts.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useVirtualHosts());

        await act(async () => {
            await result.current.loadVirtualHosts('manual-cluster');
        });

        expect(result.current.virtualHosts).toEqual([]);
        expect(result.current.error).toBe(errorMessage);
    });

    it('clears error with clearError', async () => {
        mockRabbitmqResourcesApi.getVirtualHosts.mockRejectedValue(new Error('Test error'));

        const { result } = renderHook(() => useVirtualHosts('test-cluster'));

        await waitFor(() => {
            expect(result.current.error).toBe('Test error');
        });

        act(() => {
            result.current.clearError();
        });

        expect(result.current.error).toBe(null);
    });

    it('refreshes virtual hosts with refresh method', async () => {
        const newVirtualHost: VirtualHost = {
            name: 'new-vhost',
            description: 'New virtual host'
        };

        mockRabbitmqResourcesApi.getVirtualHosts
            .mockResolvedValueOnce(mockVirtualHosts)
            .mockResolvedValueOnce([...mockVirtualHosts, newVirtualHost]);

        const { result } = renderHook(() => useVirtualHosts('test-cluster'));

        await waitFor(() => {
            expect(result.current.virtualHosts).toEqual(mockVirtualHosts);
        });

        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.virtualHosts).toHaveLength(4);
        expect(mockRabbitmqResourcesApi.getVirtualHosts).toHaveBeenCalledTimes(2);
    });

    it('does not refresh when no clusterId is set', async () => {
        const { result } = renderHook(() => useVirtualHosts());

        await act(async () => {
            await result.current.refresh();
        });

        expect(mockRabbitmqResourcesApi.getVirtualHosts).not.toHaveBeenCalled();
    });

    it('sets loading state correctly during operations', async () => {
        let resolvePromise: (value: VirtualHost[]) => void;
        const promise = new Promise<VirtualHost[]>((resolve) => {
            resolvePromise = resolve;
        });

        mockRabbitmqResourcesApi.getVirtualHosts.mockReturnValue(promise);

        const { result } = renderHook(() => useVirtualHosts('test-cluster'));

        // Loading should be true when clusterId is provided during render
        expect(result.current.loading).toBe(true);

        act(() => {
            resolvePromise!(mockVirtualHosts);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it('maintains loading state during manual operations', async () => {
        let resolvePromise: (value: VirtualHost[]) => void;
        const promise = new Promise<VirtualHost[]>((resolve) => {
            resolvePromise = resolve;
        });

        mockRabbitmqResourcesApi.getVirtualHosts.mockReturnValue(promise);

        const { result } = renderHook(() => useVirtualHosts());

        // Initially loading should be false since no clusterId is provided
        expect(result.current.loading).toBe(false);

        // Start the async operation and wait for loading state to update
        act(() => {
            result.current.loadVirtualHosts('test-cluster');
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(true);
        });

        // Resolve the promise and wait for completion
        act(() => {
            resolvePromise!(mockVirtualHosts);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });
});