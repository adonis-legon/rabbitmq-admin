import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    AuditErrorType,
    createAuditError,
    getAuditErrorMessage,
    getAuditErrorSuggestions,
    isAuditErrorRecoverable,
    getAuditErrorRetryDelay,
    formatAuditErrorForLogging,
    validateAuditFilters,
    createFilterValidationError,
} from "../auditErrorUtils";

describe("auditErrorUtils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createAuditError", () => {
        it("creates authentication error for 401 status", () => {
            const error = {
                response: {
                    status: 401,
                    data: { message: "Unauthorized" },
                    statusText: "Unauthorized",
                },
            };

            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.AUTHENTICATION);
            expect(auditError.message).toBe("Unauthorized");
            expect(auditError.retryable).toBe(false);
        });

        it("creates authorization error for 403 status", () => {
            const error = {
                response: {
                    status: 403,
                    data: { message: "Forbidden" },
                },
            };

            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.AUTHORIZATION);
            expect(auditError.message).toBe("Forbidden");
            expect(auditError.retryable).toBe(false);
        });

        it("creates validation error for 400 status", () => {
            const error = {
                response: {
                    status: 400,
                    data: { message: "Invalid parameters" },
                },
            };

            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.VALIDATION);
            expect(auditError.message).toBe("Invalid parameters");
            expect(auditError.retryable).toBe(false);
        });

        it("creates timeout error for ECONNABORTED", () => {
            const error = {
                code: "ECONNABORTED",
                message: "Request timeout",
            };

            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.TIMEOUT);
            expect(auditError.message).toBe("Request timeout");
            expect(auditError.retryable).toBe(true);
        });

        it("creates network error for NETWORK_ERROR", () => {
            const error = {
                code: "NETWORK_ERROR",
                message: "Network failed",
            };

            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.NETWORK);
            expect(auditError.message).toBe("Network failed");
            expect(auditError.retryable).toBe(true);
        });

        it("creates server error for 500 status", () => {
            const error = {
                response: {
                    status: 500,
                    data: { message: "Internal server error" },
                },
            };

            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.SERVER_ERROR);
            expect(auditError.message).toBe("Internal server error");
            expect(auditError.retryable).toBe(true);
        });

        it("creates audit disabled error for audit disabled message", () => {
            const error = {
                response: {
                    status: 400,
                    data: { message: "Audit logging is disabled" },
                },
            };

            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.AUDIT_DISABLED);
            expect(auditError.message).toBe("Audit logging is disabled");
            expect(auditError.retryable).toBe(false);
        });

        it("includes context when provided", () => {
            const error = { message: "Test error" };
            const context = {
                clusterId: "test-cluster",
                operation: "load_audit_records",
            };

            const auditError = createAuditError(error, context);

            expect(auditError.context).toEqual(context);
        });

        it("handles errors without response", () => {
            const error = { message: "Generic error" };

            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.UNKNOWN);
            expect(auditError.message).toBe("Generic error");
            expect(auditError.retryable).toBe(true);
        });

        it("handles offline status", () => {
            const originalOnline = navigator.onLine;
            Object.defineProperty(navigator, "onLine", {
                writable: true,
                value: false,
            });

            const error = { message: "Network error" };
            const auditError = createAuditError(error);

            expect(auditError.auditErrorType).toBe(AuditErrorType.NETWORK);

            Object.defineProperty(navigator, "onLine", {
                writable: true,
                value: originalOnline,
            });
        });
    });

    describe("getAuditErrorMessage", () => {
        it("returns appropriate message for authentication error", () => {
            const error = createAuditError({ response: { status: 401 } });
            const message = getAuditErrorMessage(error);

            expect(message).toContain("session has expired");
            expect(message).toContain("log in again");
        });

        it("returns appropriate message for authorization error", () => {
            const error = createAuditError({ response: { status: 403 } });
            const message = getAuditErrorMessage(error);

            expect(message).toContain("don't have permission");
            expect(message).toContain("Administrator privileges");
        });

        it("returns appropriate message for network error", () => {
            const error = createAuditError({ code: "NETWORK_ERROR" });
            const message = getAuditErrorMessage(error);

            expect(message).toContain("connect to the server");
            expect(message).toContain("internet connection");
        });

        it("returns appropriate message for timeout error", () => {
            const error = createAuditError({ code: "ECONNABORTED" });
            const message = getAuditErrorMessage(error);

            expect(message).toContain("timed out");
            expect(message).toContain("specific filters");
        });

        it("returns appropriate message for validation error", () => {
            const error = createAuditError({ response: { status: 400 } });
            const message = getAuditErrorMessage(error);

            expect(message).toContain("Invalid filter parameters");
        });

        it("returns appropriate message for audit disabled error", () => {
            const error = createAuditError({
                response: { status: 400, data: { message: "Audit logging is disabled" } },
            });
            const message = getAuditErrorMessage(error);

            expect(message).toContain("Audit logging is currently disabled");
        });

        it("returns fallback message for unknown error", () => {
            const error = createAuditError({ message: "Unknown error" });
            const message = getAuditErrorMessage(error);

            expect(message).toContain("Unknown error");
        });
    });

    describe("getAuditErrorSuggestions", () => {
        it("returns authentication suggestions", () => {
            const error = createAuditError({ response: { status: 401 } });
            const suggestions = getAuditErrorSuggestions(error);

            expect(suggestions).toContain("Click the 'Log In' button to authenticate again");
            expect(suggestions).toContain("Clear your browser cookies and log in fresh");
        });

        it("returns authorization suggestions", () => {
            const error = createAuditError({ response: { status: 403 } });
            const suggestions = getAuditErrorSuggestions(error);

            expect(suggestions).toContain("Contact your administrator to request audit access permissions");
            expect(suggestions).toContain("Verify you are logged in with an administrator account");
        });

        it("returns network suggestions with cluster context", () => {
            const error = createAuditError(
                { code: "NETWORK_ERROR" },
                { clusterId: "test-cluster" }
            );
            const suggestions = getAuditErrorSuggestions(error);

            expect(suggestions).toContain("Check your internet connection");
            expect(suggestions).toContain('Check if cluster "test-cluster" is reachable');
        });

        it("returns timeout suggestions", () => {
            const error = createAuditError({ code: "ECONNABORTED" });
            const suggestions = getAuditErrorSuggestions(error);

            expect(suggestions).toContain("Apply more specific date range filters");
            expect(suggestions).toContain("Filter by specific users or clusters");
        });

        it("returns validation suggestions", () => {
            const error = createAuditError({ response: { status: 400 } });
            const suggestions = getAuditErrorSuggestions(error);

            expect(suggestions).toContain("Check that date ranges are valid (start date before end date)");
            expect(suggestions).toContain("Clear all filters and try again");
        });
    });

    describe("isAuditErrorRecoverable", () => {
        it("returns true for recoverable errors", () => {
            const authError = createAuditError({ response: { status: 401 } });
            const networkError = createAuditError({ code: "NETWORK_ERROR" });
            const timeoutError = createAuditError({ code: "ECONNABORTED" });
            const validationError = createAuditError({ response: { status: 400 } });

            expect(isAuditErrorRecoverable(authError)).toBe(true);
            expect(isAuditErrorRecoverable(networkError)).toBe(true);
            expect(isAuditErrorRecoverable(timeoutError)).toBe(true);
            expect(isAuditErrorRecoverable(validationError)).toBe(true);
        });

        it("returns false for non-recoverable errors", () => {
            const authzError = createAuditError({ response: { status: 403 } });
            const disabledError = createAuditError({
                response: { status: 400, data: { message: "Audit logging is disabled" } },
            });

            expect(isAuditErrorRecoverable(authzError)).toBe(false);
            expect(isAuditErrorRecoverable(disabledError)).toBe(false);
        });
    });

    describe("getAuditErrorRetryDelay", () => {
        it("returns appropriate delays for different error types", () => {
            const networkError = createAuditError({ code: "NETWORK_ERROR" });
            const timeoutError = createAuditError({ code: "ECONNABORTED" });
            const serverError = createAuditError({ response: { status: 500 } });
            const unknownError = createAuditError({ message: "Unknown" });

            expect(getAuditErrorRetryDelay(networkError)).toBe(2000);
            expect(getAuditErrorRetryDelay(timeoutError)).toBe(5000);
            expect(getAuditErrorRetryDelay(serverError)).toBe(3000);
            expect(getAuditErrorRetryDelay(unknownError)).toBe(1000);
        });
    });

    describe("formatAuditErrorForLogging", () => {
        it("formats error for logging with all relevant information", () => {
            const error = createAuditError(
                { message: "Test error", code: "TEST_ERROR" },
                { clusterId: "test-cluster", operation: "test_operation" }
            );

            const formatted = formatAuditErrorForLogging(error);

            expect(formatted).toMatchObject({
                type: error.auditErrorType,
                message: error.message,
                retryable: error.retryable,
                timestamp: error.timestamp,
                context: error.context,
                userAgent: navigator.userAgent,
                url: window.location.href,
                online: navigator.onLine,
            });
        });
    });

    describe("validateAuditFilters", () => {
        it("validates date range correctly", () => {
            const filters = {
                startTime: "2024-12-01T10:00:00Z",
                endTime: "2024-11-01T10:00:00Z", // End before start
            };

            const errors = validateAuditFilters(filters);

            expect(errors).toHaveLength(1);
            expect(errors[0].field).toBe("dateRange");
            expect(errors[0].message).toContain("Start date must be before end date");
        });

        it("validates invalid date formats", () => {
            const filters = {
                startTime: "invalid-date",
                endTime: "2024-12-01T10:00:00Z",
            };

            const errors = validateAuditFilters(filters);

            expect(errors).toHaveLength(1);
            expect(errors[0].field).toBe("startTime");
            expect(errors[0].message).toContain("Start date is not valid");
        });

        it("validates date range too large", () => {
            const startDate = new Date("2023-01-01");
            const endDate = new Date("2024-12-31"); // More than 365 days

            const filters = {
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            };

            const errors = validateAuditFilters(filters);

            expect(errors).toHaveLength(1);
            expect(errors[0].field).toBe("dateRange");
            expect(errors[0].message).toContain("Date range cannot exceed 365 days");
        });

        it("validates string field lengths", () => {
            const filters = {
                username: "a".repeat(101), // Over 100 characters
                clusterName: "b".repeat(101),
                resourceName: "c".repeat(501), // Over 500 characters
                resourceType: "d".repeat(501), // Over 500 characters (updated from 101 to 501)
            };

            const errors = validateAuditFilters(filters);

            expect(errors).toHaveLength(4);
            expect(errors.find(e => e.field === "username")?.message).toContain("too long");
            expect(errors.find(e => e.field === "clusterName")?.message).toContain("too long");
            expect(errors.find(e => e.field === "resourceName")?.message).toContain("too long");
            expect(errors.find(e => e.field === "resourceType")?.message).toContain("too long");
        });

        it("returns no errors for valid filters", () => {
            const filters = {
                username: "testuser",
                clusterName: "test-cluster",
                resourceName: "test-resource",
                resourceType: "queue",
                startTime: "2024-11-01T10:00:00Z",
                endTime: "2024-12-01T10:00:00Z",
            };

            const errors = validateAuditFilters(filters);

            expect(errors).toHaveLength(0);
        });

        it("handles empty filters", () => {
            const filters = {};

            const errors = validateAuditFilters(filters);

            expect(errors).toHaveLength(0);
        });
    });

    describe("createFilterValidationError", () => {
        it("creates single validation error", () => {
            const validationErrors = [
                {
                    field: "username",
                    message: "Username is too long",
                    value: "a".repeat(101),
                },
            ];

            const error = createFilterValidationError(validationErrors);

            expect(error.auditErrorType).toBe(AuditErrorType.FILTER_ERROR);
            expect(error.message).toBe("Username is too long");
            expect(error.details).toBe("username: Username is too long");
            expect(error.retryable).toBe(false);
        });

        it("creates multiple validation errors", () => {
            const validationErrors = [
                {
                    field: "username",
                    message: "Username is too long",
                    value: "a".repeat(101),
                },
                {
                    field: "dateRange",
                    message: "Start date must be before end date",
                },
            ];

            const error = createFilterValidationError(validationErrors);

            expect(error.auditErrorType).toBe(AuditErrorType.FILTER_ERROR);
            expect(error.message).toBe("2 validation errors in filter parameters");
            expect(error.details).toContain("username: Username is too long");
            expect(error.details).toContain("dateRange: Start date must be before end date");
        });

        it("includes operation context", () => {
            const validationErrors = [
                {
                    field: "username",
                    message: "Username is too long",
                },
            ];

            const error = createFilterValidationError(validationErrors);

            expect(error.context?.operation).toBe("filter_validation");
        });
    });
});