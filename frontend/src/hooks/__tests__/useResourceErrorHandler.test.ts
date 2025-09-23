import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useResourceErrorHandler } from '../useResourceErrorHandler';

// Mock all the dependencies
vi.mock('../../contexts/ErrorContext', () => ({
  useError: vi.fn(() => ({
    showError: vi.fn(),
    showWarning: vi.fn(),
    clearNotifications: vi.fn()
  }))
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn())
}));

vi.mock('../../services/errorLoggingService', () => ({
  errorLoggingService: {
    logResourceError: vi.fn(),
    logAuthError: vi.fn(),
    logNetworkError: vi.fn(),
    logInfo: vi.fn()
  }
}));

vi.mock('../../services/tokenExpirationHandler', () => ({
  tokenExpirationHandler: {
    handleAuthError: vi.fn().mockResolvedValue(false)
  }
}));

vi.mock('../../services/clusterAccessValidator', () => ({
  clusterAccessValidator: {
    clearCache: vi.fn(),
    validateClusterAccess: vi.fn().mockResolvedValue({ hasAccess: true })
  }
}));

vi.mock('../../services/clusterConnectivityService', () => ({
  clusterConnectivityService: {
    clearCache: vi.fn()
  }
}));

vi.mock('../../services/rateLimitHandler', () => ({
  rateLimitHandler: {
    isRateLimitError: vi.fn().mockReturnValue(false),
    handleRateLimitError: vi.fn(),
    executeWithBackoff: vi.fn((operation) => operation())
  }
}));

vi.mock('../../utils/resourceErrorUtils', () => ({
  createResourceError: vi.fn(() => ({
    type: 'api_error',
    message: 'Test error',
    timestamp: Date.now(),
    retryable: true
  })),
  retryWithBackoff: vi.fn((operation) => operation()),
  formatResourceErrorForLogging: vi.fn(() => 'formatted error'),
  getErrorSuggestions: vi.fn(() => ['suggestion 1', 'suggestion 2']),
  withTimeout: vi.fn((promise) => promise),
  DEFAULT_RETRY_CONFIG: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: ['network', 'cluster_unavailable', 'api_error']
  }
}));

describe('useResourceErrorHandler', () => {
  it('should initialize without errors', () => {
    const { result } = renderHook(() => useResourceErrorHandler());

    expect(result.current).toBeDefined();
    expect(typeof result.current.handleResourceError).toBe('function');
    expect(typeof result.current.executeWithErrorHandling).toBe('function');
    expect(typeof result.current.executeWithRetry).toBe('function');
    expect(typeof result.current.showResourceError).toBe('function');
    expect(typeof result.current.clearResourceErrors).toBe('function');
  });

  it('should handle basic resource errors', () => {
    const { result } = renderHook(() => useResourceErrorHandler());

    const error = new Error('Test error');
    const resourceError = result.current.handleResourceError(error, {
      clusterId: 'test-cluster',
      resourceType: 'connections',
      operation: 'load'
    });

    expect(resourceError).toBeDefined();
    expect(resourceError.type).toBeDefined();
    expect(resourceError.message).toBeDefined();
    expect(resourceError.timestamp).toBeDefined();
  });

  it('should execute operations with error handling', async () => {
    const { result } = renderHook(() => useResourceErrorHandler());

    const mockOperation = vi.fn().mockResolvedValue('success');

    const response = await result.current.executeWithErrorHandling(mockOperation, {
      clusterId: 'test-cluster',
      resourceType: 'connections',
      operation: 'load'
    });

    expect(response).toBe('success');
    expect(mockOperation).toHaveBeenCalled();
  });
});