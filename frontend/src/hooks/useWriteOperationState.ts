import { useState, useCallback } from 'react';

export interface WriteOperationState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export interface WriteOperationActions {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSuccess: (success: boolean) => void;
    reset: () => void;
    executeOperation: <T>(
        operation: () => Promise<T>,
        onSuccess?: (result: T) => void,
        onError?: (error: any) => void
    ) => Promise<T | null>;
}

const initialState: WriteOperationState = {
    loading: false,
    error: null,
    success: false,
};

/**
 * Hook for managing write operation state with consistent patterns
 */
export const useWriteOperationState = (): WriteOperationState & WriteOperationActions => {
    const [state, setState] = useState<WriteOperationState>(initialState);

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error, loading: false, success: false }));
    }, []);

    const setSuccess = useCallback((success: boolean) => {
        setState(prev => ({ ...prev, success, loading: false, error: success ? null : prev.error }));
    }, []);

    const reset = useCallback(() => {
        setState(initialState);
    }, []);

    const executeOperation = useCallback(
        async <T>(
            operation: () => Promise<T>,
            onSuccess?: (result: T) => void,
            onError?: (error: any) => void
        ): Promise<T | null> => {
            try {
                setLoading(true);
                const result = await operation();
                setSuccess(true);
                onSuccess?.(result);
                return result;
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Operation failed');
                onError?.(error);
                throw error; // Re-throw to allow caller to handle
            } finally {
                setLoading(false);
            }
        },
        [setLoading, setSuccess, setError]
    );

    return {
        ...state,
        setLoading,
        setError,
        setSuccess,
        reset,
        executeOperation,
    };
};

/**
 * Hook for managing multiple write operations with individual state tracking
 */
export const useMultipleWriteOperations = <T extends string>(
    operationKeys: readonly T[]
) => {
    const [states, setStates] = useState<Record<T, WriteOperationState>>(() =>
        operationKeys.reduce(
            (acc, key) => ({ ...acc, [key]: { ...initialState } }),
            {} as Record<T, WriteOperationState>
        )
    );

    const setOperationLoading = useCallback((key: T, loading: boolean) => {
        setStates(prev => ({
            ...prev,
            [key]: { ...prev[key], loading, error: loading ? null : prev[key].error }
        }));
    }, []);

    const setOperationError = useCallback((key: T, error: string | null) => {
        setStates(prev => ({
            ...prev,
            [key]: { ...prev[key], error, loading: false, success: false }
        }));
    }, []);

    const setOperationSuccess = useCallback((key: T, success: boolean) => {
        setStates(prev => ({
            ...prev,
            [key]: { ...prev[key], success, loading: false, error: success ? null : prev[key].error }
        }));
    }, []);

    const resetOperation = useCallback((key: T) => {
        setStates(prev => ({
            ...prev,
            [key]: { ...initialState }
        }));
    }, []);

    const resetAllOperations = useCallback(() => {
        setStates(
            operationKeys.reduce(
                (acc, key) => ({ ...acc, [key]: { ...initialState } }),
                {} as Record<T, WriteOperationState>
            )
        );
    }, [operationKeys]);

    const executeOperation = useCallback(
        async <R>(
            key: T,
            operation: () => Promise<R>,
            onSuccess?: (result: R) => void,
            onError?: (error: any) => void
        ): Promise<R | null> => {
            try {
                setOperationLoading(key, true);
                const result = await operation();
                setOperationSuccess(key, true);
                onSuccess?.(result);
                return result;
            } catch (error) {
                setOperationError(key, error instanceof Error ? error.message : 'Operation failed');
                onError?.(error);
                throw error;
            } finally {
                setOperationLoading(key, false);
            }
        },
        [setOperationLoading, setOperationSuccess, setOperationError]
    );

    const isAnyLoading = (Object.values(states) as WriteOperationState[]).some(state => state.loading);
    const hasAnyError = (Object.values(states) as WriteOperationState[]).some(state => state.error !== null);
    const hasAnySuccess = (Object.values(states) as WriteOperationState[]).some(state => state.success);

    return {
        states,
        isAnyLoading,
        hasAnyError,
        hasAnySuccess,
        setOperationLoading,
        setOperationError,
        setOperationSuccess,
        resetOperation,
        resetAllOperations,
        executeOperation,
        getOperationState: (key: T) => states[key],
    };
};