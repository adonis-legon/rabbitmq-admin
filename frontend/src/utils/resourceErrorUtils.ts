import { ResourceError } from '../types/rabbitmq';

/**
 * Enhanced error handling utilities specifically for RabbitMQ resource operations
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffFactor: number;
  retryableErrors: ResourceError['type'][];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: ['network', 'cluster_unavailable', 'api_error']
};

/**
 * Create a ResourceError from various error types
 */
export const createResourceError = (
  err: any, 
  context?: { clusterId?: string; resourceType?: string; operation?: string }
): ResourceError => {
  let type: ResourceError['type'] = 'api_error';
  let message = 'An unexpected error occurred';
  let retryable = true;

  // Determine error type based on various indicators
  if (isNetworkError(err)) {
    type = 'network';
    message = 'Network connection failed. Please check your internet connection.';
  } else if (isAuthenticationError(err)) {
    type = 'authentication';
    message = 'Authentication failed. Please log in again.';
    retryable = false;
  } else if (isAuthorizationError(err)) {
    type = 'authorization';
    message = 'You do not have permission to access this resource.';
    retryable = false;
  } else if (isClusterUnavailableError(err)) {
    type = 'cluster_unavailable';
    message = context?.clusterId 
      ? `RabbitMQ cluster "${context.clusterId}" is currently unavailable.`
      : 'RabbitMQ cluster is currently unavailable.';
  } else if (isTimeoutError(err)) {
    type = 'network';
    message = 'Request timed out. The server may be overloaded.';
  } else if (isRateLimitError(err)) {
    type = 'api_error';
    message = 'Too many requests. Please wait a moment before trying again.';
  } else {
    // Extract message from various error formats
    message = extractErrorMessage(err, context);
  }

  // Extract additional details
  const details = extractErrorDetails(err, context);

  return {
    type,
    message,
    details,
    retryable,
    timestamp: Date.now()
  };
};

/**
 * Check if error is a network-related error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ENOTFOUND' ||
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.name === 'NetworkError' ||
    !error?.response
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthenticationError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return status === 401;
};

/**
 * Check if error is an authorization error
 */
export const isAuthorizationError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return status === 403;
};

/**
 * Check if error indicates cluster unavailability
 */
export const isClusterUnavailableError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return status === 502 || status === 503 || status === 504;
};

/**
 * Check if error is a timeout error
 */
export const isTimeoutError = (error: any): boolean => {
  return (
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('timeout')
  );
};

/**
 * Check if error is a rate limiting error
 */
export const isRateLimitError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return status === 429;
};

/**
 * Extract user-friendly error message
 */
export const extractErrorMessage = (
  error: any, 
  context?: { clusterId?: string; resourceType?: string; operation?: string }
): string => {
  // Try to get message from response data
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Try to get message from error object
  if (error?.message) {
    return error.message;
  }

  // Generate contextual message based on operation
  if (context?.operation && context?.resourceType) {
    return `Failed to ${context.operation} ${context.resourceType}`;
  }

  if (context?.resourceType) {
    return `Failed to load ${context.resourceType} data`;
  }

  return 'An unexpected error occurred';
};

/**
 * Extract detailed error information for debugging
 */
export const extractErrorDetails = (
  error: any,
  context?: { clusterId?: string; resourceType?: string; operation?: string }
): string | undefined => {
  const details: string[] = [];

  // Add context information
  if (context?.clusterId) {
    details.push(`Cluster: ${context.clusterId}`);
  }
  if (context?.resourceType) {
    details.push(`Resource: ${context.resourceType}`);
  }
  if (context?.operation) {
    details.push(`Operation: ${context.operation}`);
  }

  // Add HTTP status information
  const status = error?.status || error?.response?.status;
  if (status) {
    details.push(`HTTP Status: ${status}`);
  }

  // Add error code if available
  if (error?.code) {
    details.push(`Error Code: ${error.code}`);
  }

  // Add request path if available
  const path = error?.config?.url || error?.request?.responseURL;
  if (path) {
    details.push(`Path: ${path}`);
  }

  // Add response data if available and not already in message
  if (error?.response?.data && typeof error.response.data === 'object') {
    const responseData = JSON.stringify(error.response.data, null, 2);
    if (responseData !== '{}') {
      details.push(`Response: ${responseData}`);
    }
  }

  // Add timestamp
  details.push(`Timestamp: ${new Date().toISOString()}`);

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error?.stack) {
    details.push(`Stack: ${error.stack}`);
  }

  return details.length > 0 ? details.join('\n') : undefined;
};

/**
 * Calculate delay for exponential backoff
 */
export const calculateBackoffDelay = (
  attempt: number, 
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number => {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelay);
};

/**
 * Check if error is retryable based on configuration
 */
export const isRetryableError = (
  error: ResourceError, 
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean => {
  return error.retryable && config.retryableErrors.includes(error.type);
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if error is not retryable
      if (attempt === config.maxAttempts) {
        break;
      }

      const resourceError = createResourceError(error);
      if (!isRetryableError(resourceError, config)) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, config);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Format error for logging with enhanced context
 */
export const formatResourceErrorForLogging = (
  error: ResourceError,
  context?: { clusterId?: string; resourceType?: string; operation?: string; userId?: string }
): string => {
  const logData = {
    timestamp: new Date(error.timestamp).toISOString(),
    errorType: error.type,
    message: error.message,
    retryable: error.retryable,
    context: context || {},
    details: error.details
  };

  return JSON.stringify(logData, null, 2);
};

/**
 * Get user-friendly error suggestions based on error type
 */
export const getErrorSuggestions = (
  error: ResourceError,
  context?: { clusterId?: string; resourceType?: string }
): string[] => {
  const suggestions: string[] = [];

  switch (error.type) {
    case 'network':
      suggestions.push('Check your internet connection');
      suggestions.push('Verify the server is accessible');
      if (context?.clusterId) {
        suggestions.push(`Ensure RabbitMQ cluster "${context.clusterId}" is running`);
      }
      break;

    case 'authentication':
      suggestions.push('Your session has expired');
      suggestions.push('Please log out and log back in');
      suggestions.push('Clear your browser cookies and try again');
      break;

    case 'authorization':
      suggestions.push('You may not have permission to access this resource');
      suggestions.push('Contact your administrator for access');
      if (context?.clusterId) {
        suggestions.push(`Verify you have access to cluster "${context.clusterId}"`);
      }
      break;

    case 'cluster_unavailable':
      suggestions.push('The RabbitMQ cluster may be temporarily unavailable');
      suggestions.push('Check the cluster status with your administrator');
      suggestions.push('Try again in a few minutes');
      break;

    case 'api_error':
      suggestions.push('This may be a temporary server issue');
      suggestions.push('Try refreshing the page');
      suggestions.push('If the problem persists, contact support');
      break;
  }

  // Add general suggestions
  if (error.retryable) {
    suggestions.push('Try the operation again');
  }

  return suggestions;
};

/**
 * Create timeout wrapper for promises
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage || `Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
};