import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '../contexts/ErrorContext';
import { ResourceError } from '../types/rabbitmq';
import {
  createResourceError,
  retryWithBackoff,
  formatResourceErrorForLogging,
  getErrorSuggestions,
  withTimeout,
  DEFAULT_RETRY_CONFIG,
  RetryConfig
} from '../utils/resourceErrorUtils';
import { errorLoggingService } from '../services/errorLoggingService';
import { tokenExpirationHandler } from '../services/tokenExpirationHandler';
import { clusterAccessValidator } from '../services/clusterAccessValidator';
import { clusterConnectivityService } from '../services/clusterConnectivityService';
import { rateLimitHandler } from '../services/rateLimitHandler';

export interface ResourceErrorContext {
  clusterId?: string;
  resourceType?: string;
  operation?: string;
  userId?: string;
}

export interface UseResourceErrorHandlerOptions {
  retryConfig?: Partial<RetryConfig>;
  timeoutMs?: number;
  enableAutoRetry?: boolean;
  onAuthError?: () => void;
  onClusterError?: (clusterId: string) => void;
}

export interface UseResourceErrorHandlerReturn {
  handleResourceError: (error: any, context?: ResourceErrorContext) => ResourceError;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    context?: ResourceErrorContext
  ) => Promise<T>;
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    context?: ResourceErrorContext
  ) => Promise<T>;
  showResourceError: (error: ResourceError, context?: ResourceErrorContext) => void;
  clearResourceErrors: () => void;
}

export const useResourceErrorHandler = (
  options: UseResourceErrorHandlerOptions = {}
): UseResourceErrorHandlerReturn => {
  const {
    retryConfig = {},
    timeoutMs = 30000,
    enableAutoRetry = true,
    onAuthError,
    onClusterError
  } = options;

  const { showError, showWarning, clearNotifications } = useError();
  const navigate = useNavigate();
  const retryAttempts = useRef<Map<string, number>>(new Map());

  const mergedRetryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig
  };

  /**
   * Handle resource errors with enhanced context and logging
   */
  const handleResourceError = useCallback((
    error: any,
    context?: ResourceErrorContext
  ): ResourceError => {
    const resourceError = createResourceError(error, context);

    // Enhanced logging with error logging service
    errorLoggingService.logResourceError(resourceError, {
      userId: context?.userId,
      clusterId: context?.clusterId,
      resourceType: context?.resourceType,
      operation: context?.operation
    });
    console.error('Resource error occurred:', formatResourceErrorForLogging(resourceError, context));

    // Handle specific error types
    switch (resourceError.type) {
      case 'authentication':
        errorLoggingService.logAuthError('resource_access', error, {
          userId: context?.userId,
          clusterId: context?.clusterId,
          resourceType: context?.resourceType,
          operation: context?.operation
        });

        // Try to handle token expiration
        tokenExpirationHandler.handleAuthError(error, {
          operation: context?.operation,
          clusterId: context?.clusterId
        }).then(canRetry => {
          if (!canRetry) {
            if (onAuthError) {
              onAuthError();
            } else {
              // Default: redirect to login
              navigate('/login', {
                replace: true,
                state: {
                  message: 'Your session has expired. Please log in again.',
                  returnUrl: window.location.pathname
                }
              });
            }
          }
        });
        break;

      case 'authorization':
        // Clear cluster access cache for this cluster
        if (context?.clusterId) {
          clusterAccessValidator.clearCache(context.clusterId);
        }
        break;

      case 'cluster_unavailable':
        // Update cluster connectivity status
        if (context?.clusterId) {
          clusterConnectivityService.clearCache(context.clusterId);
          if (onClusterError) {
            onClusterError(context.clusterId);
          }
        }
        break;

      case 'network':
        errorLoggingService.logNetworkError(
          error?.config?.url || 'unknown',
          error?.config?.method || 'unknown',
          error?.response?.status,
          error,
          {
            userId: context?.userId,
            clusterId: context?.clusterId,
            resourceType: context?.resourceType,
            operation: context?.operation
          }
        );

        // Handle rate limiting
        if (rateLimitHandler.isRateLimitError(error)) {
          const endpoint = error?.config?.url || 'unknown';
          rateLimitHandler.handleRateLimitError(error, endpoint);
        }
        break;

      case 'api_error':
        // Check for rate limiting in API errors
        if (rateLimitHandler.isRateLimitError(error)) {
          const endpoint = error?.config?.url || 'unknown';
          rateLimitHandler.handleRateLimitError(error, endpoint);
          resourceError.type = 'network'; // Treat rate limits as network errors
        }
        break;
    }

    return resourceError;
  }, [navigate, onAuthError, onClusterError]);

  /**
   * Show resource error with user-friendly message and suggestions
   */
  const showResourceError = useCallback((
    error: ResourceError,
    context?: ResourceErrorContext
  ) => {
    const suggestions = getErrorSuggestions(error, context);
    const details = suggestions.length > 0
      ? `Suggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}`
      : error.details;

    // Don't show notification for auth errors as they redirect
    if (error.type === 'authentication') {
      return;
    }

    if (error.type === 'cluster_unavailable') {
      showWarning(error.message);
    } else {
      showError(error.message, details);
    }
  }, [showError, showWarning]);

  /**
   * Execute operation with basic error handling and timeout
   */
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: ResourceErrorContext
  ): Promise<T> => {
    try {
      const timeoutPromise = withTimeout(operation(), timeoutMs,
        `Operation timed out after ${timeoutMs / 1000} seconds`);

      return await timeoutPromise;
    } catch (error) {
      const resourceError = handleResourceError(error, context);
      showResourceError(resourceError, context);
      throw resourceError;
    }
  }, [timeoutMs, handleResourceError, showResourceError]);

  /**
   * Execute operation with retry logic and exponential backoff
   */
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: ResourceErrorContext
  ): Promise<T> => {
    if (!enableAutoRetry) {
      return executeWithErrorHandling(operation, context);
    }

    const operationKey = `${context?.clusterId || 'default'}-${context?.resourceType || 'unknown'}-${context?.operation || 'unknown'}`;
    const endpoint = `${context?.clusterId}/${context?.resourceType}`;

    // Validate cluster access before attempting operation
    if (context?.clusterId) {
      try {
        await clusterAccessValidator.validateClusterAccess(context.clusterId, context);
      } catch (error) {
        const resourceError = handleResourceError(error, context);
        showResourceError(resourceError, context);
        throw resourceError;
      }
    }

    try {
      // Use rate limit handler for the operation
      const result = await rateLimitHandler.executeWithBackoff(
        () => retryWithBackoff(
          () => withTimeout(operation(), timeoutMs),
          mergedRetryConfig,
          (attempt, error) => {
            console.warn(`Retry attempt ${attempt} for ${operationKey}:`, error.message);
            retryAttempts.current.set(operationKey, attempt);
          }
        ),
        endpoint,
        {
          initialDelay: mergedRetryConfig.baseDelay,
          maxDelay: mergedRetryConfig.maxDelay,
          backoffFactor: mergedRetryConfig.backoffFactor,
          maxAttempts: mergedRetryConfig.maxAttempts,
          jitterFactor: 0.1
        }
      );

      // Clear retry count on success
      retryAttempts.current.delete(operationKey);
      return result;
    } catch (error) {
      const attempts = retryAttempts.current.get(operationKey) || 0;
      retryAttempts.current.delete(operationKey);

      const resourceError = handleResourceError(error, context);

      // Enhance error message with retry information
      if (attempts > 0) {
        resourceError.message += ` (Failed after ${attempts + 1} attempts)`;
      }

      showResourceError(resourceError, context);
      throw resourceError;
    }
  }, [
    enableAutoRetry,
    executeWithErrorHandling,
    timeoutMs,
    mergedRetryConfig,
    handleResourceError,
    showResourceError
  ]);

  /**
   * Clear all resource-related error notifications
   */
  const clearResourceErrors = useCallback(() => {
    clearNotifications();
    retryAttempts.current.clear();
  }, [clearNotifications]);

  return {
    handleResourceError,
    executeWithErrorHandling,
    executeWithRetry,
    showResourceError,
    clearResourceErrors
  };
};

/**
 * Hook for handling specific resource operation errors
 */
export const useResourceOperation = (
  resourceType: string,
  clusterId?: string,
  options?: UseResourceErrorHandlerOptions
) => {
  const errorHandler = useResourceErrorHandler(options);

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const context: ResourceErrorContext = {
      clusterId,
      resourceType,
      operation: operationName
    };

    return errorHandler.executeWithRetry(operation, context);
  }, [errorHandler, resourceType, clusterId]);

  return {
    ...errorHandler,
    executeOperation
  };
};