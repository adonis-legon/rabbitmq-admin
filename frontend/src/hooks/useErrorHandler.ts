import { useCallback } from 'react';
import { useError } from '../contexts/ErrorContext';
import {
  getErrorMessage,
  getErrorDetails,
  getValidationErrors,
  isNetworkError,
  isAuthError,
  isAuthorizationError,
  isServerError,
  formatErrorForLogging
} from '../utils/errorUtils';

export interface UseErrorHandlerReturn {
  handleError: (error: any, context?: string) => void;
  handleApiError: (error: any, context?: string) => void;
  handleValidationError: (error: any, setFieldErrors?: (errors: Record<string, string>) => void) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const { showError, showSuccess, showWarning, showInfo } = useError();

  const handleError = useCallback((error: any, context?: string) => {
    const message = getErrorMessage(error);
    const details = getErrorDetails(error);

    // Log error for debugging
    console.error(formatErrorForLogging(error, context));

    // Show user-friendly error message
    showError(message, details);
  }, [showError]);

  const handleApiError = useCallback((error: any, context?: string) => {
    const message = getErrorMessage(error);
    const details = getErrorDetails(error);

    // Log error for debugging
    console.error(formatErrorForLogging(error, context));

    // Customize message based on error type
    let userMessage = message;

    if (isNetworkError(error)) {
      userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    } else if (isAuthError(error)) {
      userMessage = 'Your session has expired. Please log in again.';
      // Don't show error notification for auth errors as they redirect to login
      return;
    } else if (isAuthorizationError(error)) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (isServerError(error)) {
      userMessage = 'A server error occurred. Our team has been notified. Please try again later.';
    }

    showError(userMessage, details);
  }, [showError]);

  const handleValidationError = useCallback((
    error: any,
    setFieldErrors?: (errors: Record<string, string>) => void
  ) => {
    const validationErrors = getValidationErrors(error);

    if (validationErrors.length > 0 && setFieldErrors) {
      // Set field-specific errors for form handling
      const fieldErrorMap = validationErrors.reduce((acc, { field, message }) => {
        acc[field] = message;
        return acc;
      }, {} as Record<string, string>);

      setFieldErrors(fieldErrorMap);
    } else {
      // Fallback to general error handling
      handleApiError(error, 'Validation');
    }
  }, [handleApiError]);

  return {
    handleError,
    handleApiError,
    handleValidationError,
    showSuccess,
    showWarning,
    showInfo,
  };
};