import { ResourceError } from "../types/rabbitmq";

/**
 * Audit-specific error types
 */
export enum AuditErrorType {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    NETWORK = "network",
    TIMEOUT = "timeout",
    VALIDATION = "validation",
    SERVER_ERROR = "server_error",
    AUDIT_DISABLED = "audit_disabled",
    DATA_UNAVAILABLE = "data_unavailable",
    FILTER_ERROR = "filter_error",
    UNKNOWN = "unknown",
}

/**
 * Audit-specific error interface extending ResourceError
 */
export interface AuditError extends ResourceError {
    auditErrorType: AuditErrorType;
    context?: {
        clusterId?: string;
        filterRequest?: any;
        operation?: string;
    };
}

/**
 * Create an audit-specific error from a generic error
 */
export const createAuditError = (
    error: any,
    context?: AuditError["context"]
): AuditError => {
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";
    const details = error.response?.data?.details || error.response?.statusText;
    const status = error.response?.status;

    let auditErrorType: AuditErrorType = AuditErrorType.UNKNOWN;
    let retryable = true;

    // Determine error type based on status code and message
    // Check message-based errors first to avoid false classification by status code
    if (message.toLowerCase().includes("audit") && message.toLowerCase().includes("disabled")) {
        auditErrorType = AuditErrorType.AUDIT_DISABLED;
        retryable = false;
    } else if (status === 401 || message.toLowerCase().includes("unauthorized")) {
        auditErrorType = AuditErrorType.AUTHENTICATION;
        retryable = false;
    } else if (status === 403 || message.toLowerCase().includes("forbidden")) {
        auditErrorType = AuditErrorType.AUTHORIZATION;
        retryable = false;
    } else if (status === 404) {
        auditErrorType = AuditErrorType.DATA_UNAVAILABLE;
        retryable = false;
    } else if (status === 400) {
        auditErrorType = AuditErrorType.VALIDATION;
        retryable = false;
    } else if (status === 408 || error.code === "ECONNABORTED") {
        auditErrorType = AuditErrorType.TIMEOUT;
        retryable = true;
    } else if (status >= 500) {
        auditErrorType = AuditErrorType.SERVER_ERROR;
        retryable = true;
    } else if (error.code === "NETWORK_ERROR" || !navigator.onLine) {
        auditErrorType = AuditErrorType.NETWORK;
        retryable = true;
    }

    // Map audit error type to ResourceError type
    let resourceErrorType: ResourceError['type'] = 'api_error';
    if (auditErrorType === AuditErrorType.NETWORK) {
        resourceErrorType = 'network';
    } else if (auditErrorType === AuditErrorType.AUTHENTICATION) {
        resourceErrorType = 'authentication';
    } else if (auditErrorType === AuditErrorType.AUTHORIZATION) {
        resourceErrorType = 'authorization';
    } else if (auditErrorType === AuditErrorType.AUDIT_DISABLED) {
        resourceErrorType = 'cluster_unavailable';
    } else {
        // All other error types (TIMEOUT, VALIDATION, SERVER_ERROR, DATA_UNAVAILABLE, FILTER_ERROR, UNKNOWN)
        resourceErrorType = 'api_error';
    }

    return {
        type: resourceErrorType,
        auditErrorType,
        message,
        details,
        retryable,
        timestamp: Date.now(),
        context,
    };
};

/**
 * Get user-friendly error messages for audit errors
 */
export const getAuditErrorMessage = (error: AuditError): string => {
    switch (error.auditErrorType) {
        case AuditErrorType.AUTHENTICATION:
            return "Your session has expired. Please log in again to access audit records.";

        case AuditErrorType.AUTHORIZATION:
            return "You don't have permission to access audit records. Administrator privileges are required.";

        case AuditErrorType.NETWORK:
            return "Unable to connect to the server. Please check your internet connection and try again.";

        case AuditErrorType.TIMEOUT:
            return "The request timed out. Try applying more specific filters to reduce the amount of data.";

        case AuditErrorType.VALIDATION:
            return "Invalid filter parameters. Please check your filter values and try again.";

        case AuditErrorType.SERVER_ERROR:
            return "The server encountered an error while processing your request. Please try again later.";

        case AuditErrorType.AUDIT_DISABLED:
            return "Audit logging is currently disabled on this system. Contact your administrator for more information.";

        case AuditErrorType.DATA_UNAVAILABLE:
            return "No audit data is available. This may be because audit logging was recently enabled or data has been archived.";

        case AuditErrorType.FILTER_ERROR:
            return "There was an error applying your filters. Please check your filter values and try again.";

        default:
            return error.message || "An unexpected error occurred while loading audit records.";
    }
};

/**
 * Get detailed error suggestions for audit errors
 */
export const getAuditErrorSuggestions = (error: AuditError): string[] => {
    const suggestions: string[] = [];

    switch (error.auditErrorType) {
        case AuditErrorType.AUTHENTICATION:
            suggestions.push("Click the 'Log In' button to authenticate again");
            suggestions.push("Clear your browser cookies and log in fresh");
            suggestions.push("Contact your administrator if authentication continues to fail");
            break;

        case AuditErrorType.AUTHORIZATION:
            suggestions.push("Contact your administrator to request audit access permissions");
            suggestions.push("Verify you are logged in with an administrator account");
            suggestions.push("Check if your user role has been recently changed");
            break;

        case AuditErrorType.NETWORK:
            suggestions.push("Check your internet connection");
            suggestions.push("Try refreshing the page");
            suggestions.push("Verify the application server is accessible");
            if (error.context?.clusterId) {
                suggestions.push(`Check if cluster "${error.context.clusterId}" is reachable`);
            }
            break;

        case AuditErrorType.TIMEOUT:
            suggestions.push("Apply more specific date range filters");
            suggestions.push("Filter by specific users or clusters");
            suggestions.push("Reduce the page size to load fewer records at once");
            suggestions.push("Try searching for specific resource names");
            break;

        case AuditErrorType.VALIDATION:
            suggestions.push("Check that date ranges are valid (start date before end date)");
            suggestions.push("Verify filter values don't contain special characters");
            suggestions.push("Clear all filters and try again");
            suggestions.push("Ensure date formats are correct");
            break;

        case AuditErrorType.SERVER_ERROR:
            suggestions.push("Wait a few moments and try again");
            suggestions.push("Try with simpler filter criteria");
            suggestions.push("Contact your administrator if the error persists");
            break;

        case AuditErrorType.AUDIT_DISABLED:
            suggestions.push("Contact your administrator to enable audit logging");
            suggestions.push("Check system configuration documentation");
            suggestions.push("Verify audit logging requirements with your compliance team");
            break;

        case AuditErrorType.DATA_UNAVAILABLE:
            suggestions.push("Try expanding your date range to include older records");
            suggestions.push("Check if audit logging was recently enabled");
            suggestions.push("Contact your administrator about audit data retention policies");
            break;

        case AuditErrorType.FILTER_ERROR:
            suggestions.push("Clear all filters and apply them one at a time");
            suggestions.push("Check for typos in filter values");
            suggestions.push("Try using simpler filter criteria");
            break;

        default:
            suggestions.push("Try refreshing the page");
            suggestions.push("Clear your browser cache");
            suggestions.push("Contact your administrator if the problem persists");
            break;
    }

    return suggestions;
};

/**
 * Check if an error is recoverable through user action
 */
export const isAuditErrorRecoverable = (error: AuditError): boolean => {
    switch (error.auditErrorType) {
        case AuditErrorType.AUTHENTICATION:
        case AuditErrorType.NETWORK:
        case AuditErrorType.TIMEOUT:
        case AuditErrorType.VALIDATION:
        case AuditErrorType.FILTER_ERROR:
            return true;

        case AuditErrorType.AUTHORIZATION:
        case AuditErrorType.AUDIT_DISABLED:
        case AuditErrorType.DATA_UNAVAILABLE:
            return false;

        case AuditErrorType.SERVER_ERROR:
        case AuditErrorType.UNKNOWN:
        default:
            return error.retryable;
    }
};

/**
 * Get appropriate retry delay for different error types
 */
export const getAuditErrorRetryDelay = (error: AuditError): number => {
    switch (error.auditErrorType) {
        case AuditErrorType.NETWORK:
            return 2000; // 2 seconds

        case AuditErrorType.TIMEOUT:
            return 5000; // 5 seconds

        case AuditErrorType.SERVER_ERROR:
            return 3000; // 3 seconds

        default:
            return 1000; // 1 second
    }
};

/**
 * Format error for logging
 */
export const formatAuditErrorForLogging = (error: AuditError): Record<string, any> => {
    return {
        type: error.auditErrorType,
        message: error.message,
        details: error.details,
        retryable: error.retryable,
        timestamp: error.timestamp,
        context: error.context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        online: navigator.onLine,
    };
};

/**
 * Validation error utilities for audit filters
 */
export interface AuditFilterValidationError {
    field: string;
    message: string;
    value?: any;
}

/**
 * Validate audit filter request
 */
export const validateAuditFilters = (filters: any): AuditFilterValidationError[] => {
    const errors: AuditFilterValidationError[] = [];

    // Validate date range
    if (filters.startTime && filters.endTime) {
        const startDate = new Date(filters.startTime);
        const endDate = new Date(filters.endTime);

        if (isNaN(startDate.getTime())) {
            errors.push({
                field: "startTime",
                message: "Start date is not valid",
                value: filters.startTime,
            });
        }

        if (isNaN(endDate.getTime())) {
            errors.push({
                field: "endTime",
                message: "End date is not valid",
                value: filters.endTime,
            });
        }

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate >= endDate) {
            errors.push({
                field: "dateRange",
                message: "Start date must be before end date",
                value: { startTime: filters.startTime, endTime: filters.endTime },
            });
        }

        // Check if date range is too large (more than 1 year)
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffInDays > 365) {
                errors.push({
                    field: "dateRange",
                    message: "Date range cannot exceed 365 days",
                    value: { startTime: filters.startTime, endTime: filters.endTime },
                });
            }
        }
    }

    // Validate string lengths
    if (filters.username && filters.username.length > 100) {
        errors.push({
            field: "username",
            message: "Username filter is too long (maximum 100 characters)",
            value: filters.username,
        });
    }

    if (filters.clusterName && filters.clusterName.length > 100) {
        errors.push({
            field: "clusterName",
            message: "Cluster name filter is too long (maximum 100 characters)",
            value: filters.clusterName,
        });
    }

    if (filters.resourceName && filters.resourceName.length > 500) {
        errors.push({
            field: "resourceName",
            message: "Resource name filter is too long (maximum 500 characters)",
            value: filters.resourceName,
        });
    }

    if (filters.resourceType) {
        const resourceTypeStr = Array.isArray(filters.resourceType)
            ? filters.resourceType.join(',')
            : filters.resourceType;
        if (resourceTypeStr.length > 500) {
            errors.push({
                field: "resourceType",
                message: "Resource type filter is too long (maximum 500 characters)",
                value: filters.resourceType,
            });
        }
    }

    return errors;
};

/**
 * Create a filter validation error
 */
export const createFilterValidationError = (
    validationErrors: AuditFilterValidationError[]
): AuditError => {
    const message = validationErrors.length === 1
        ? validationErrors[0].message
        : `${validationErrors.length} validation errors in filter parameters`;

    const details = validationErrors.map(err => `${err.field}: ${err.message}`).join("; ");

    return {
        type: "api_error",
        auditErrorType: AuditErrorType.FILTER_ERROR,
        message,
        details,
        retryable: false,
        timestamp: Date.now(),
        context: {
            operation: "filter_validation",
        },
    };
};