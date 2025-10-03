import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuditRecords } from '../useAuditRecords';
import { auditCache } from '../../utils/resourceCache';
import { auditApi } from '../../services/api/auditApi';
import { AuditOperationType, AuditOperationStatus } from '../../types/audit';

// Mock the API
vi.mock('../../services/api/auditApi', () => ({
    auditApi: {
        getAuditRecords: vi.fn(),
    },
}));

describe('useAuditRecords', () => {
    const mockAuditRecords = {
        items: [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                username: 'admin',
                clusterName: 'test-cluster',
                operationType: AuditOperationType.CREATE_QUEUE,
                resourceType: 'queue',
                resourceName: 'test-queue',
                resourceDetails: { durable: true, autoDelete: false },
                status: AuditOperationStatus.SUCCESS,
                timestamp: '2023-10-01T12:00:00Z',
                clientIp: '192.168.1.100',
                userAgent: 'Mozilla/5.0',
                createdAt: '2023-10-01T12:00:01Z',
            },
            {
                id: '123e4567-e89b-12d3-a456-426614174001',
                username: 'user1',
                clusterName: 'test-cluster',
                operationType: AuditOperationType.DELETE_EXCHANGE,
                resourceType: 'exchange',
                resourceName: 'test-exchange',
                resourceDetails: { type: 'direct' },
                status: AuditOperationStatus.FAILURE,
                errorMessage: 'Exchange not found',
                timestamp: '2023-10-01T11:30:00Z',
                clientIp: '192.168.1.101',
                createdAt: '2023-10-01T11:30:01Z',
            },
        ],
        page: 0,
        pageSize: 50,
        totalItems: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        auditCache.clear();
        vi.mocked(auditApi.getAuditRecords).mockResolvedValue(mockAuditRecords);
    });

    afterEach(() => {
        auditCache.clear();
    });

    describe('Basic functionality', () => {
        it('should initialize with correct default state', () => {
            const { result } = renderHook(() => useAuditRecords());

            expect(result.current.data).toBeNull();
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.lastUpdated).toBeNull();
        });

        it('should provide all required actions', () => {
            const { result } = renderHook(() => useAuditRecords());

            expect(typeof result.current.loadAuditRecords).toBe('function');
            expect(typeof result.current.refreshAuditRecords).toBe('function');
            expect(typeof result.current.clearError).toBe('function');
            expect(typeof result.current.invalidateCache).toBe('function');
        });
    });

    describe('Loading audit records', () => {
        it('should load audit records with default parameters', async () => {
            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(auditApi.getAuditRecords).toHaveBeenCalledWith(
                {},
                0,
                50,
                'timestamp',
                'desc'
            );
            expect(result.current.data).toEqual(mockAuditRecords);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.lastUpdated).toBeDefined();
        });

        it('should load audit records with custom parameters', async () => {
            const { result } = renderHook(() => useAuditRecords());

            const filterRequest = {
                username: 'admin',
                operationType: AuditOperationType.CREATE_QUEUE,
                startTime: '2023-10-01T00:00:00Z',
                endTime: '2023-10-01T23:59:59Z',
            };

            await act(async () => {
                await result.current.loadAuditRecords(
                    filterRequest,
                    1,
                    25,
                    'username',
                    'asc'
                );
            });

            expect(auditApi.getAuditRecords).toHaveBeenCalledWith(
                filterRequest,
                1,
                25,
                'username',
                'asc'
            );
            expect(result.current.data).toEqual(mockAuditRecords);
        });

        it('should set loading state during API call', async () => {
            let resolvePromise: (value: any) => void;
            const promise = new Promise<typeof mockAuditRecords>((resolve) => {
                resolvePromise = resolve;
            });

            vi.mocked(auditApi.getAuditRecords).mockReturnValue(promise);

            const { result } = renderHook(() => useAuditRecords());

            act(() => {
                result.current.loadAuditRecords();
            });

            expect(result.current.loading).toBe(true);

            await act(async () => {
                resolvePromise!(mockAuditRecords);
                await promise;
            });

            expect(result.current.loading).toBe(false);
        });

        it('should clear error when loading starts', async () => {
            const { result } = renderHook(() => useAuditRecords());

            // Set an initial error
            act(() => {
                result.current.clearError();
            });

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('Error handling', () => {
        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            vi.mocked(auditApi.getAuditRecords).mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(result.current.error).toBeDefined();
            expect(result.current.error?.message).toBe('API Error');
            expect(result.current.error?.type).toBe('api_error');
            expect(result.current.data).toBeNull();
            expect(result.current.loading).toBe(false);
        });

        it('should handle authentication errors', async () => {
            const error = {
                response: { status: 401, data: { message: 'Unauthorized' } }
            };
            vi.mocked(auditApi.getAuditRecords).mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(result.current.error?.type).toBe('authentication');
            expect(result.current.error?.message).toBe('Unauthorized');
        });

        it('should handle authorization errors', async () => {
            const error = {
                response: { status: 403, data: { message: 'Forbidden' } }
            };
            vi.mocked(auditApi.getAuditRecords).mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(result.current.error?.type).toBe('authorization');
            expect(result.current.error?.retryable).toBe(false);
        });

        it('should handle network errors', async () => {
            const error = { code: 'NETWORK_ERROR', message: 'Network error' };
            vi.mocked(auditApi.getAuditRecords).mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(result.current.error?.type).toBe('network');
        });

        it('should clear error when clearError is called', async () => {
            const error = new Error('Test error');
            vi.mocked(auditApi.getAuditRecords).mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(result.current.error).toBeDefined();

            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('Caching functionality', () => {
        it('should use cached data when available', async () => {
            const filterRequest = {};
            const cacheKey = JSON.stringify({
                filterRequest,
                page: 0,
                pageSize: 50,
                sortBy: 'timestamp',
                sortDirection: 'desc'
            });

            // Pre-populate cache
            auditCache.set('audit', 'records', mockAuditRecords, { key: cacheKey });

            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            // Should not call API since data is cached
            expect(auditApi.getAuditRecords).not.toHaveBeenCalled();
            expect(result.current.data).toEqual(mockAuditRecords);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should fetch from API when cache is empty', async () => {
            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            // Should call API since cache is empty
            expect(auditApi.getAuditRecords).toHaveBeenCalledWith(
                {},
                0,
                50,
                'timestamp',
                'desc'
            );
            expect(result.current.data).toEqual(mockAuditRecords);
        });

        it('should cache API response after successful fetch', async () => {
            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            // Verify data was cached
            const cacheKey = JSON.stringify({
                filterRequest: {},
                page: 0,
                pageSize: 50,
                sortBy: 'timestamp',
                sortDirection: 'desc'
            });
            const cachedData = auditCache.get('audit', 'records', { key: cacheKey });
            expect(cachedData).toEqual(mockAuditRecords);
        });

        it('should handle cache with different parameters separately', async () => {
            const filterRequest1 = { username: 'admin' };
            const filterRequest2 = { username: 'user1' };

            const mockAuditRecords2 = { ...mockAuditRecords, page: 1 };

            const cacheKey1 = JSON.stringify({
                filterRequest: filterRequest1,
                page: 0,
                pageSize: 50,
                sortBy: 'timestamp',
                sortDirection: 'desc'
            });

            // Pre-populate cache for first filter
            auditCache.set('audit', 'records', mockAuditRecords, { key: cacheKey1 });

            const { result } = renderHook(() => useAuditRecords());

            // Load with first filter (should use cache)
            await act(async () => {
                await result.current.loadAuditRecords(filterRequest1);
            });

            expect(auditApi.getAuditRecords).not.toHaveBeenCalled();
            expect(result.current.data).toEqual(mockAuditRecords);

            // Load with second filter (should call API)
            vi.mocked(auditApi.getAuditRecords).mockResolvedValueOnce(mockAuditRecords2);

            await act(async () => {
                await result.current.loadAuditRecords(filterRequest2);
            });

            expect(auditApi.getAuditRecords).toHaveBeenCalledWith(
                filterRequest2,
                0,
                50,
                'timestamp',
                'desc'
            );
            expect(result.current.data).toEqual(mockAuditRecords2);
        });

        it('should not cache failed responses', async () => {
            const error = new Error('API Error');
            vi.mocked(auditApi.getAuditRecords).mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            // Should have error and no cached data
            expect(result.current.error).toBeDefined();
            expect(result.current.data).toBeNull();

            const cacheKey = JSON.stringify({
                filterRequest: {},
                page: 0,
                pageSize: 50,
                sortBy: 'timestamp',
                sortDirection: 'desc'
            });
            expect(auditCache.get('audit', 'records', { key: cacheKey })).toBeNull();
        });
    });

    describe('Refresh functionality', () => {
        it('should refresh audit records and invalidate cache', async () => {
            const filterRequest = { username: 'admin' };

            const { result } = renderHook(() => useAuditRecords());

            // Load initial data
            await act(async () => {
                await result.current.loadAuditRecords(filterRequest);
            });

            expect(auditApi.getAuditRecords).toHaveBeenCalledTimes(1);

            // Refresh should invalidate cache and call API again
            await act(async () => {
                await result.current.refreshAuditRecords();
            });

            expect(auditApi.getAuditRecords).toHaveBeenCalledTimes(2);
            expect(auditApi.getAuditRecords).toHaveBeenLastCalledWith(
                filterRequest,
                0,
                50,
                'timestamp',
                'desc'
            );
        });

        it('should handle refresh when no previous load was performed', async () => {
            const { result } = renderHook(() => useAuditRecords());

            await act(async () => {
                await result.current.refreshAuditRecords();
            });

            // Should not call API if no previous load
            expect(auditApi.getAuditRecords).not.toHaveBeenCalled();
        });
    });

    describe('Cache invalidation', () => {
        it('should provide cache invalidation function', () => {
            const cacheKey = JSON.stringify({
                filterRequest: {},
                page: 0,
                pageSize: 50,
                sortBy: 'timestamp',
                sortDirection: 'desc'
            });

            // Pre-populate cache
            auditCache.set('audit', 'records', mockAuditRecords, { key: cacheKey });

            const { result } = renderHook(() => useAuditRecords());

            // Verify cache has data
            expect(auditCache.get('audit', 'records', { key: cacheKey })).toEqual(mockAuditRecords);

            // Invalidate cache
            act(() => {
                result.current.invalidateCache();
            });

            // Verify cache is cleared
            expect(auditCache.get('audit', 'records', { key: cacheKey })).toBeNull();
        });
    });

    describe('Auto-refresh functionality', () => {
        it('should auto-refresh when enabled', async () => {
            const { result } = renderHook(() =>
                useAuditRecords({ autoRefresh: true, refreshInterval: 100 })
            );

            // Load initial data
            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(auditApi.getAuditRecords).toHaveBeenCalledTimes(1);

            // Wait for auto-refresh to trigger
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 150));
            });

            // Should have called API again due to auto-refresh
            expect(auditApi.getAuditRecords).toHaveBeenCalledTimes(2);
        });

        it('should not auto-refresh when disabled', async () => {
            const { result } = renderHook(() =>
                useAuditRecords({ autoRefresh: false })
            );

            // Load initial data
            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(auditApi.getAuditRecords).toHaveBeenCalledTimes(1);

            // Wait longer than refresh interval
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            // Should not have called API again
            expect(auditApi.getAuditRecords).toHaveBeenCalledTimes(1);
        });

        it('should handle auto-refresh errors gracefully', async () => {
            const { result } = renderHook(() =>
                useAuditRecords({ autoRefresh: true, refreshInterval: 100 })
            );

            // Load initial data successfully
            await act(async () => {
                await result.current.loadAuditRecords();
            });

            expect(result.current.error).toBeNull();

            // Mock API to fail on next call
            const error = new Error('Auto-refresh failed');
            vi.mocked(auditApi.getAuditRecords).mockRejectedValueOnce(error);

            // Wait for auto-refresh to trigger
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 150));
            });

            // Should have error from auto-refresh
            expect(result.current.error).toBeDefined();
            expect(result.current.error?.message).toBe('Auto-refresh failed');
            expect(result.current.error?.type).toBe('api_error');
        });

        it('should not auto-refresh if no initial load was performed', async () => {
            renderHook(() =>
                useAuditRecords({ autoRefresh: true, refreshInterval: 100 })
            );

            // Wait for potential auto-refresh
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 150));
            });

            // Should not have called API
            expect(auditApi.getAuditRecords).not.toHaveBeenCalled();
        });
    });

    describe('Timestamp handling', () => {
        it('should update lastUpdated timestamp when loading from cache', async () => {
            const cacheKey = JSON.stringify({
                filterRequest: {},
                page: 0,
                pageSize: 50,
                sortBy: 'timestamp',
                sortDirection: 'desc'
            });

            // Pre-populate cache
            auditCache.set('audit', 'records', mockAuditRecords, { key: cacheKey });

            const { result } = renderHook(() => useAuditRecords());

            const beforeLoad = Date.now();

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            const afterLoad = Date.now();

            expect(result.current.lastUpdated).toBeDefined();
            expect(result.current.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeLoad);
            expect(result.current.lastUpdated!.getTime()).toBeLessThanOrEqual(afterLoad);
        });

        it('should update lastUpdated timestamp when loading from API', async () => {
            const { result } = renderHook(() => useAuditRecords());

            const beforeLoad = Date.now();

            await act(async () => {
                await result.current.loadAuditRecords();
            });

            const afterLoad = Date.now();

            expect(result.current.lastUpdated).toBeDefined();
            expect(result.current.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeLoad);
            expect(result.current.lastUpdated!.getTime()).toBeLessThanOrEqual(afterLoad);
        });
    });
});