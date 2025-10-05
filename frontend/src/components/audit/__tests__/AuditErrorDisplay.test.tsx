import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AuditErrorDisplay from "../AuditErrorDisplay";
import { AuditError, AuditErrorType } from "../../../utils/auditErrorUtils";

const createMockAuditError = (
  auditErrorType: AuditErrorType,
  overrides: Partial<AuditError> = {}
): AuditError => ({
  type: 'api_error', // ResourceError type - will be set correctly in actual usage
  auditErrorType: auditErrorType,
  message: "Test error message",
  retryable: true,
  timestamp: Date.now(),
  ...overrides,
});

describe("AuditErrorDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders authentication error correctly", () => {
    const error = createMockAuditError(AuditErrorType.AUTHENTICATION);

    render(<AuditErrorDisplay error={error} />);

    expect(screen.getByText("Authentication Required")).toBeInTheDocument();
    expect(screen.getByText(/session has expired/)).toBeInTheDocument();
    expect(screen.getByText("Log In")).toBeInTheDocument();
  });

  it("renders authorization error correctly", () => {
    const error = createMockAuditError(AuditErrorType.AUTHORIZATION);

    render(<AuditErrorDisplay error={error} />);

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByText(/don't have permission/)).toBeInTheDocument();
    expect(screen.getByText("Contact Admin")).toBeInTheDocument();
  });

  it("renders network error correctly", () => {
    const error = createMockAuditError(AuditErrorType.NETWORK);
    const mockOnRetry = vi.fn();

    render(<AuditErrorDisplay error={error} onRetry={mockOnRetry} />);

    expect(screen.getByText("Network Error")).toBeInTheDocument();
    expect(screen.getByText(/connect to the server/)).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders timeout error correctly", () => {
    const error = createMockAuditError(AuditErrorType.TIMEOUT);
    const mockOnRetry = vi.fn();

    render(<AuditErrorDisplay error={error} onRetry={mockOnRetry} />);

    expect(screen.getByText("Request Timeout")).toBeInTheDocument();
    expect(screen.getByText(/request timed out/)).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders validation error correctly", () => {
    const error = createMockAuditError(AuditErrorType.VALIDATION);

    render(<AuditErrorDisplay error={error} />);

    expect(screen.getByText("Validation Error")).toBeInTheDocument();
    expect(screen.getByText(/Invalid filter parameters/)).toBeInTheDocument();
  });

  it("renders server error correctly", () => {
    const error = createMockAuditError(AuditErrorType.SERVER_ERROR);
    const mockOnRetry = vi.fn();

    render(<AuditErrorDisplay error={error} onRetry={mockOnRetry} />);

    expect(screen.getByText("Server Error")).toBeInTheDocument();
    expect(screen.getByText(/server encountered an error/)).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders audit disabled error correctly", () => {
    const error = createMockAuditError(AuditErrorType.AUDIT_DISABLED);

    render(<AuditErrorDisplay error={error} />);

    expect(screen.getByText("Audit Disabled")).toBeInTheDocument();
    expect(
      screen.getByText(/Audit logging is currently disabled on this system/)
    ).toBeInTheDocument();
  });

  it("renders data unavailable error correctly", () => {
    const error = createMockAuditError(AuditErrorType.DATA_UNAVAILABLE);

    render(<AuditErrorDisplay error={error} />);

    expect(screen.getByText("No Data Available")).toBeInTheDocument();
    expect(screen.getByText(/No audit data is available/)).toBeInTheDocument();
  });

  it("renders filter error correctly", () => {
    const error = createMockAuditError(AuditErrorType.FILTER_ERROR);

    render(<AuditErrorDisplay error={error} />);

    expect(screen.getByText("Filter Error")).toBeInTheDocument();
    expect(screen.getByText(/error applying your filters/)).toBeInTheDocument();
  });

  it("shows context information when provided", () => {
    const error = createMockAuditError(AuditErrorType.NETWORK, {
      context: {
        clusterId: "test-cluster",
        operation: "load_audit_records",
      },
    });

    render(<AuditErrorDisplay error={error} />);

    expect(screen.getByText(/Cluster: test-cluster/)).toBeInTheDocument();
    expect(
      screen.getByText(/Operation: load_audit_records/)
    ).toBeInTheDocument();
  });

  it("shows suggestions when expanded", async () => {
    const error = createMockAuditError(AuditErrorType.NETWORK);

    render(<AuditErrorDisplay error={error} showDetails={true} />);

    expect(
      screen.getByText("Check your internet connection")
    ).toBeInTheDocument();
    expect(screen.getByText("Try refreshing the page")).toBeInTheDocument();
  });

  it("toggles suggestions visibility", async () => {
    const error = createMockAuditError(AuditErrorType.NETWORK);

    render(<AuditErrorDisplay error={error} />);

    // Initially collapsed - check aria label to confirm initial state
    expect(screen.getByLabelText("Show suggestions")).toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByLabelText("Show suggestions");
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Hide suggestions")).toBeInTheDocument();
    });

    // Click to collapse
    const collapseButton = screen.getByLabelText("Hide suggestions");
    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Show suggestions")).toBeInTheDocument();
    });
  });

  it("calls onRetry when retry button is clicked", () => {
    const mockOnRetry = vi.fn();
    const error = createMockAuditError(AuditErrorType.NETWORK);

    render(<AuditErrorDisplay error={error} onRetry={mockOnRetry} />);

    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onClearError when dismiss button is clicked", () => {
    const mockOnClearError = vi.fn();
    const error = createMockAuditError(AuditErrorType.NETWORK);

    render(<AuditErrorDisplay error={error} onClearError={mockOnClearError} />);

    const dismissButton = screen.getByText("Dismiss");
    fireEvent.click(dismissButton);

    expect(mockOnClearError).toHaveBeenCalledTimes(1);
  });

  it("navigates to login for authentication errors", () => {
    const mockLocation = { href: "" };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    const error = createMockAuditError(AuditErrorType.AUTHENTICATION);

    render(<AuditErrorDisplay error={error} />);

    const loginButton = screen.getByText("Log In");
    fireEvent.click(loginButton);

    expect(mockLocation.href).toBe("/login");
  });

  it("navigates to contact for authorization errors", () => {
    const mockLocation = { href: "" };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    const error = createMockAuditError(AuditErrorType.AUTHORIZATION);

    render(<AuditErrorDisplay error={error} />);

    const contactButton = screen.getByText("Contact Admin");
    fireEvent.click(contactButton);

    expect(mockLocation.href).toBe("/contact");
  });

  it("renders in compact mode", () => {
    const error = createMockAuditError(AuditErrorType.NETWORK);

    render(<AuditErrorDisplay error={error} compact={true} />);

    // Should show basic error info but not full details
    expect(screen.getByText("Network Error")).toBeInTheDocument();
    expect(screen.getByText(/connect to the server/)).toBeInTheDocument();
    expect(screen.queryByText("Suggested Solutions:")).not.toBeInTheDocument();
  });

  it("shows technical details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const error = createMockAuditError(AuditErrorType.SERVER_ERROR, {
      details: "Internal server error details",
    });

    render(<AuditErrorDisplay error={error} />);

    expect(
      screen.getByText(/Technical Details: Internal server error details/)
    ).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("shows timestamp information", () => {
    const timestamp = Date.now();
    const error = createMockAuditError(AuditErrorType.NETWORK, {
      timestamp,
      retryable: true,
    });

    render(<AuditErrorDisplay error={error} />);

    expect(
      screen.getByText(new RegExp(new Date(timestamp).toLocaleString()))
    ).toBeInTheDocument();
    expect(screen.getByText(/This error can be retried/)).toBeInTheDocument();
  });

  it("does not show retry button for non-retryable errors", () => {
    const error = createMockAuditError(AuditErrorType.AUTHORIZATION, {
      retryable: false,
    });

    render(<AuditErrorDisplay error={error} />);

    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    expect(screen.getByText("Contact Admin")).toBeInTheDocument();
  });

  it("shows appropriate severity colors", () => {
    const errorError = createMockAuditError(AuditErrorType.SERVER_ERROR);
    const { rerender } = render(<AuditErrorDisplay error={errorError} />);

    // Check for error severity (red)
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardError");

    const warningError = createMockAuditError(AuditErrorType.NETWORK);
    rerender(<AuditErrorDisplay error={warningError} />);

    // Check for warning severity (orange)
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardWarning");

    const infoError = createMockAuditError(AuditErrorType.DATA_UNAVAILABLE);
    rerender(<AuditErrorDisplay error={infoError} />);

    // Check for info severity (blue)
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardInfo");
  });
});
