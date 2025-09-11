import { ValidationError } from '../types/error';

/**
 * Extract user-friendly error message from API error
 */
export const getErrorMessage = (error: any): string => {
  // If it's already a structured API error
  if (error && typeof error === 'object' && error.message) {
    return error.message;
  }

  // If it's an axios error with response data
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // If it's a network error
  if (error?.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection.';
  }

  // Fallback to generic message
  return error?.message || 'An unexpected error occurred';
};

/**
 * Extract detailed error information for debugging
 */
export const getErrorDetails = (error: any): string | undefined => {
  if (!error) return undefined;

  const details: string[] = [];

  // Add status code if available
  if (error.status) {
    details.push(`Status: ${error.status}`);
  }

  // Add error code if available
  if (error.code) {
    details.push(`Code: ${error.code}`);
  }

  // Add path if available
  if (error.path) {
    details.push(`Path: ${error.path}`);
  }

  // Add validation details if available
  if (error.details && typeof error.details === 'object') {
    const validationErrors = Object.entries(error.details)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');
    if (validationErrors) {
      details.push(`Validation errors:\n${validationErrors}`);
    }
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    details.push(`Stack trace:\n${error.stack}`);
  }

  return details.length > 0 ? details.join('\n') : undefined;
};

/**
 * Extract validation errors from API error response
 */
export const getValidationErrors = (error: any): ValidationError[] => {
  const validationErrors: ValidationError[] = [];

  // Check for validation details in the error response
  if (error?.details && typeof error.details === 'object') {
    Object.entries(error.details).forEach(([field, message]) => {
      validationErrors.push({
        field,
        message: String(message)
      });
    });
  }

  // Check for axios validation error format
  if (error?.response?.data?.details && typeof error.response.data.details === 'object') {
    Object.entries(error.response.data.details).forEach(([field, message]) => {
      validationErrors.push({
        field,
        message: String(message)
      });
    });
  }

  return validationErrors;
};

/**
 * Check if error is a network/connection error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ENOTFOUND' ||
    error?.code === 'ECONNREFUSED' ||
    !error?.response
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
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
 * Check if error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return status === 400 || status === 422;
};

/**
 * Check if error is a conflict error (resource already exists)
 */
export const isConflictError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return status === 409;
};

/**
 * Check if error is a not found error
 */
export const isNotFoundError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return status === 404;
};

/**
 * Check if error is a server error
 */
export const isServerError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  return status >= 500;
};

/**
 * Format error for logging
 */
export const formatErrorForLogging = (error: any, context?: string): string => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  const message = getErrorMessage(error);
  const details = getErrorDetails(error);

  let logMessage = `${timestamp} ${contextStr}${message}`;

  if (details) {
    logMessage += `\nDetails: ${details}`;
  }

  return logMessage;
};