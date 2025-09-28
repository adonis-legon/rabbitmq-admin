import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWriteOperationState, useMultipleWriteOperations } from '../useWriteOperationState';

describe('useWriteOperationState', () => {
    it('should initialize with default state', () => {
        const { result } = renderHook(() => useWriteOperationState());

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.success).toBe(false);
    });

    it('should set loading state', () => {
        const { result } = renderHook(() => useWriteOperationState());

        act(() => {
            result.current.setLoading(true);
        });

        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBe(null); // Error should be cleared when loading starts
    });

    it('should set error state', () => {
        const { result } = renderHook(() => useWriteOperationState());

        act(() => {
            result.current.setError('Test error');
        });

        expect(result.current.error).toBe('Test error');
        expect(result.current.loading).toBe(false);
        expect(result.current.success).toBe(false);
    });

    it('should set success state', () => {
        const { result } = renderHook(() => useWriteOperationState());

        act(() => {
            result.current.setSuccess(true);
        });

        expect(result.current.success).toBe(true);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null); // Error should be cleared on success
    });

    it('should reset state', () => {
        const { result } = renderHook(() => useWriteOperationState());

        act(() => {
            result.current.setLoading(true);
            result.current.setError('Test error');
            result.current.setSuccess(true);
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.success).toBe(false);
    });

    it('should execute operation successfully', async () => {
        const { result } = renderHook(() => useWriteOperationState());
        const mockOperation = vi.fn().mockResolvedValue('success result');
        const mockOnSuccess = vi.fn();

        let operationResult: any;
        await act(async () => {
            operationResult = await result.current.executeOperation(mockOperation, mockOnSuccess);
        });

        expect(mockOperation).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith('success result');
        expect(operationResult).toBe('success result');
        expect(result.current.success).toBe(true);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should handle operation failure', async () => {
        const { result } = renderHook(() => useWriteOperationState());
        const mockError = new Error('Operation failed');
        const mockOperation = vi.fn().mockRejectedValue(mockError);
        const mockOnError = vi.fn();

        await act(async () => {
            try {
                await result.current.executeOperation(mockOperation, undefined, mockOnError);
            } catch (error) {
                // Expected to throw
            }
        });

        expect(mockOperation).toHaveBeenCalled();
        expect(mockOnError).toHaveBeenCalledWith(mockError);
        expect(result.current.success).toBe(false);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Operation failed');
    });
});

describe('useMultipleWriteOperations', () => {
    const operationKeys = ['create', 'delete', 'update'] as const;

    it('should initialize with default states for all operations', () => {
        const { result } = renderHook(() => useMultipleWriteOperations(operationKeys));

        operationKeys.forEach(key => {
            const state = result.current.getOperationState(key);
            expect(state.loading).toBe(false);
            expect(state.error).toBe(null);
            expect(state.success).toBe(false);
        });

        expect(result.current.isAnyLoading).toBe(false);
        expect(result.current.hasAnyError).toBe(false);
        expect(result.current.hasAnySuccess).toBe(false);
    });

    it('should set loading state for specific operation', () => {
        const { result } = renderHook(() => useMultipleWriteOperations(operationKeys));

        act(() => {
            result.current.setOperationLoading('create', true);
        });

        expect(result.current.getOperationState('create').loading).toBe(true);
        expect(result.current.getOperationState('delete').loading).toBe(false);
        expect(result.current.isAnyLoading).toBe(true);
    });

    it('should set error state for specific operation', () => {
        const { result } = renderHook(() => useMultipleWriteOperations(operationKeys));

        act(() => {
            result.current.setOperationError('delete', 'Delete failed');
        });

        expect(result.current.getOperationState('delete').error).toBe('Delete failed');
        expect(result.current.getOperationState('create').error).toBe(null);
        expect(result.current.hasAnyError).toBe(true);
    });

    it('should set success state for specific operation', () => {
        const { result } = renderHook(() => useMultipleWriteOperations(operationKeys));

        act(() => {
            result.current.setOperationSuccess('update', true);
        });

        expect(result.current.getOperationState('update').success).toBe(true);
        expect(result.current.getOperationState('create').success).toBe(false);
        expect(result.current.hasAnySuccess).toBe(true);
    });

    it('should reset specific operation', () => {
        const { result } = renderHook(() => useMultipleWriteOperations(operationKeys));

        act(() => {
            result.current.setOperationLoading('create', true);
            result.current.setOperationError('create', 'Test error');
        });

        act(() => {
            result.current.resetOperation('create');
        });

        const state = result.current.getOperationState('create');
        expect(state.loading).toBe(false);
        expect(state.error).toBe(null);
        expect(state.success).toBe(false);
    });

    it('should reset all operations', () => {
        const { result } = renderHook(() => useMultipleWriteOperations(operationKeys));

        act(() => {
            result.current.setOperationLoading('create', true);
            result.current.setOperationError('delete', 'Error');
            result.current.setOperationSuccess('update', true);
        });

        act(() => {
            result.current.resetAllOperations();
        });

        operationKeys.forEach(key => {
            const state = result.current.getOperationState(key);
            expect(state.loading).toBe(false);
            expect(state.error).toBe(null);
            expect(state.success).toBe(false);
        });
    });

    it('should execute operation for specific key', async () => {
        const { result } = renderHook(() => useMultipleWriteOperations(operationKeys));
        const mockOperation = vi.fn().mockResolvedValue('create result');
        const mockOnSuccess = vi.fn();

        let operationResult: any;
        await act(async () => {
            operationResult = await result.current.executeOperation(
                'create',
                mockOperation,
                mockOnSuccess
            );
        });

        expect(mockOperation).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith('create result');
        expect(operationResult).toBe('create result');
        expect(result.current.getOperationState('create').success).toBe(true);
        expect(result.current.getOperationState('delete').success).toBe(false);
    });
});