import { useState, useEffect, useCallback, useRef } from 'react';
import { AuditRecord, AuditFilterRequest, PagedResponse, AuditOperationType, AuditOperationStatus } from '../types/audit';
import { auditApi } from '../services/api/auditApi';
import { auditCache } from '../utils/resourceCache';
import { createAuditError, AuditError } from '../utils/auditErrorUtils';

interface UseAuditRecordsState {
    data: PagedResponse<AuditRecord> | null;
    loading: boolean;
    error: AuditError | null;
    lastUpdated: Date | null;
}

interface UseAuditRecordsActions {
    loadAuditRecords: (
        filterRequest?: AuditFilterRequest,
        page?: number,
        pageSize?: number,
        sortBy?: string,
        sortDirection?: 'asc' | 'desc'
    ) => Promise<void>;
    refreshAuditRecords: () => Promise<void>;
    clearError: () => void;
    invalidateCache: () => void;
}

interface UseAuditRecordsOptions {
    autoRefresh?: boolean;
    refreshInterval?: number; // in milliseconds
}

interface LoadParams {
    filterRequest?: AuditFilterRequest;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export const useAuditRecords = (
    options: UseAuditRecordsOptions = {}
): UseAuditRecordsState & UseAuditRecordsActions => {
    const { autoRefresh = false, refreshInterval = 60000 } = options; // Default 1 minute for audit records

    const [state, setState] = useState<UseAuditRecordsState>({
        data: null,
        loading: false,
        error: null,
        lastUpdated: null
    });

    // Use ref to store latest params for auto-refresh to avoid dependency issues
    const lastParamsRef = useRef<LoadParams | null>(null);

    const setLoading = (loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
    };

    const setError = (error: AuditError | null) => {
        setState(prev => ({ ...prev, error }));
    };

    const setData = (data: PagedResponse<AuditRecord> | null) => {
        setState(prev => ({ ...prev, data, lastUpdated: new Date() }));
    };

    const generateCacheKey = (params: LoadParams): string => {
        return JSON.stringify({
            filterRequest: params.filterRequest || {},
            page: params.page || 0,
            pageSize: params.pageSize || 50,
            sortBy: params.sortBy || 'timestamp',
            sortDirection: params.sortDirection || 'desc'
        });
    };

    const loadAuditRecords = useCallback(async (
        filterRequest: AuditFilterRequest = {},
        page: number = 0,
        pageSize: number = 50,
        sortBy: string = 'timestamp',
        sortDirection: 'asc' | 'desc' = 'desc'
    ) => {
        try {
            setLoading(true);
            setError(null);

            // Store params for refresh functionality
            const params: LoadParams = { filterRequest, page, pageSize, sortBy, sortDirection };
            lastParamsRef.current = params;

            // Check cache first
            const cacheKey = generateCacheKey(params);
            const cachedData = auditCache.get('audit', 'records', { key: cacheKey });

            if (cachedData && typeof cachedData === 'object' && 'items' in cachedData && Array.isArray(cachedData.items)) {
                setData(cachedData as PagedResponse<AuditRecord>);
                setLoading(false);
                return;
            }

            const response = await auditApi.getAuditRecords(
                filterRequest,
                page,
                pageSize,
                sortBy,
                sortDirection
            );

            // Cache the response
            auditCache.set('audit', 'records', response, { key: cacheKey });
            setData(response);
        } catch (err: any) {
            console.error('Error loading audit records:', err);

            // Use enhanced audit error handling
            const auditError = createAuditError(err, {
                operation: 'load_audit_records',
                filterRequest: filterRequest,
            });

            setError(auditError);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshAuditRecords = useCallback(async () => {
        const currentParams = lastParamsRef.current;
        if (currentParams) {
            // Invalidate cache before refresh
            auditCache.invalidate('audit', 'records');
            await loadAuditRecords(
                currentParams.filterRequest,
                currentParams.page,
                currentParams.pageSize,
                currentParams.sortBy,
                currentParams.sortDirection
            );
        }
    }, [loadAuditRecords]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const invalidateCache = useCallback(() => {
        auditCache.invalidate('audit', 'records');
    }, []);

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefresh) {
            return;
        }

        const interval = setInterval(async () => {
            const currentParams = lastParamsRef.current;
            if (currentParams) {
                try {
                    // Invalidate cache before refresh
                    auditCache.invalidate('audit', 'records');

                    const response = await auditApi.getAuditRecords(
                        currentParams.filterRequest,
                        currentParams.page,
                        currentParams.pageSize,
                        currentParams.sortBy,
                        currentParams.sortDirection
                    );

                    // Cache the response
                    const cacheKey = generateCacheKey(currentParams);
                    auditCache.set('audit', 'records', response, { key: cacheKey });
                    setData(response);
                } catch (err: any) {
                    console.error('Auto-refresh error:', err);
                    const auditError = createAuditError(err, {
                        operation: 'auto_refresh_audit_records',
                        filterRequest: currentParams.filterRequest,
                    });
                    setError(auditError);
                }
            }
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    return {
        ...state,
        loadAuditRecords,
        refreshAuditRecords,
        clearError,
        invalidateCache
    };
};

// Export types for convenience
export type { UseAuditRecordsState, UseAuditRecordsActions, UseAuditRecordsOptions };
export { AuditOperationType, AuditOperationStatus };