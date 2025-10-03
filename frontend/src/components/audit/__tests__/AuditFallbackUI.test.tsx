
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import AuditFallbackUI from "../AuditFallbackUI";

describe("AuditFallbackUI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("no-data type", () => {
    it("renders no data message correctly", () => {
      render(<AuditFallbackUI type="no-data" />);

      expect(screen.getByText("No Audit Records Found")).toBeInTheDocument();
      expect(
        screen.getByText(/No audit records are available at this time/)
      ).toBeInTheDocument();
    });

    it("shows cluster-specific message when clusterId provided", () => {
      render(<AuditFallbackUI type="no-data" clusterId="test-cluster" />);

      expect(
        screen.getByText(
          /No audit records are available for cluster "test-cluster"/
        )
      ).toBeInTheDocument();
    });

    it("shows appropriate suggestions for no data", () => {
      render(<AuditFallbackUI type="no-data" />);

      expect(
        screen.getByText("Audit logging may have been recently enabled")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Try expanding your date range to include older records"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("Check if any filters are too restrictive")
      ).toBeInTheDocument();
    });

    it("calls onRefresh when refresh button is clicked", () => {
      const mockOnRefresh = vi.fn();
      render(<AuditFallbackUI type="no-data" onRefresh={mockOnRefresh} />);

      const refreshButton = screen.getByText("Refresh");
      fireEvent.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("disabled type", () => {
    it("renders disabled message correctly", () => {
      render(<AuditFallbackUI type="disabled" />);

      expect(screen.getByText("Audit Logging Disabled")).toBeInTheDocument();
      expect(
        screen.getByText("Audit logging is currently disabled on this system.")
      ).toBeInTheDocument();
    });

    it("shows appropriate suggestions for disabled audit", () => {
      render(<AuditFallbackUI type="disabled" />);

      expect(
        screen.getByText(
          "Contact your system administrator to enable audit logging"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("Check system configuration documentation")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Verify audit logging requirements with your compliance team"
        )
      ).toBeInTheDocument();
    });

    it("navigates to contact page when contact admin button is clicked", () => {
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(<AuditFallbackUI type="disabled" />);

      const contactButton = screen.getByText("Contact Administrator");
      fireEvent.click(contactButton);

      expect(mockLocation.href).toBe("/contact");
    });

    it("calls onRefresh when check again button is clicked", () => {
      const mockOnRefresh = vi.fn();
      render(<AuditFallbackUI type="disabled" onRefresh={mockOnRefresh} />);

      const checkButton = screen.getByText("Check Again");
      fireEvent.click(checkButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading-failed type", () => {
    it("renders loading failed message correctly", () => {
      render(<AuditFallbackUI type="loading-failed" />);

      expect(
        screen.getByText("Failed to Load Audit Records")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Unable to load audit records due to an unexpected error."
        )
      ).toBeInTheDocument();
    });

    it("shows custom message when provided", () => {
      const customMessage = "Custom error message for testing";
      render(<AuditFallbackUI type="loading-failed" message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it("shows appropriate suggestions for loading failure", () => {
      render(<AuditFallbackUI type="loading-failed" />);

      expect(
        screen.getByText("Check your internet connection")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Verify the application server is accessible")
      ).toBeInTheDocument();
      expect(screen.getByText("Try refreshing the page")).toBeInTheDocument();
    });

    it("calls onRetry when retry button is clicked", () => {
      const mockOnRetry = vi.fn();
      render(<AuditFallbackUI type="loading-failed" onRetry={mockOnRetry} />);

      const retryButton = screen.getByText("Retry");
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it("calls onRefresh when refresh page button is clicked", () => {
      const mockOnRefresh = vi.fn();
      render(
        <AuditFallbackUI type="loading-failed" onRefresh={mockOnRefresh} />
      );

      const refreshButton = screen.getByText("Refresh Page");
      fireEvent.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("permission-denied type", () => {
    it("renders permission denied message correctly", () => {
      render(<AuditFallbackUI type="permission-denied" />);

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(
        screen.getByText(/You don't have permission to access audit records/)
      ).toBeInTheDocument();
    });

    it("shows appropriate suggestions for permission denied", () => {
      render(<AuditFallbackUI type="permission-denied" />);

      expect(
        screen.getByText(
          "Contact your administrator to request audit access permissions"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Verify you are logged in with an administrator account"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("Check if your user role has been recently changed")
      ).toBeInTheDocument();
    });

    it("navigates to contact page when contact admin button is clicked", () => {
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(<AuditFallbackUI type="permission-denied" />);

      const contactButton = screen.getByText("Contact Administrator");
      fireEvent.click(contactButton);

      expect(mockLocation.href).toBe("/contact");
    });

    it("navigates to dashboard when go to dashboard button is clicked", () => {
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(<AuditFallbackUI type="permission-denied" />);

      const dashboardButton = screen.getByText("Go to Dashboard");
      fireEvent.click(dashboardButton);

      expect(mockLocation.href).toBe("/");
    });
  });

  describe("default/unknown type", () => {
    it("renders default message for unknown type", () => {
      // @ts-ignore - Testing with invalid type
      render(<AuditFallbackUI type="unknown-type" />);

      expect(screen.getByText("Audit Records Unavailable")).toBeInTheDocument();
      expect(
        screen.getByText("Audit records are currently unavailable.")
      ).toBeInTheDocument();
    });

    it("shows custom message for unknown type", () => {
      const customMessage = "Custom unavailable message";
      // @ts-ignore - Testing with invalid type
      render(<AuditFallbackUI type="unknown-type" message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe("common functionality", () => {
    it("shows what you can do section with suggestions", () => {
      render(<AuditFallbackUI type="no-data" />);

      expect(screen.getByText("What you can do:")).toBeInTheDocument();
    });

    it("shows additional information section", () => {
      render(<AuditFallbackUI type="no-data" />);

      expect(
        screen.getByText(/Audit records track all write operations/)
      ).toBeInTheDocument();
    });

    it("shows different additional information for each type", () => {
      const { rerender } = render(<AuditFallbackUI type="disabled" />);
      expect(
        screen.getByText(
          /Audit logging can be enabled in the application configuration/
        )
      ).toBeInTheDocument();

      rerender(<AuditFallbackUI type="loading-failed" />);
      expect(
        screen.getByText(
          /If this problem persists, please contact your system administrator/
        )
      ).toBeInTheDocument();

      rerender(<AuditFallbackUI type="permission-denied" />);
      expect(
        screen.getByText(/Audit records contain sensitive information/)
      ).toBeInTheDocument();
    });

    it("does not render action buttons when callbacks are not provided", () => {
      render(<AuditFallbackUI type="no-data" />);

      expect(screen.queryByText("Refresh")).not.toBeInTheDocument();
    });

    it("renders multiple action buttons when multiple callbacks provided", () => {
      const mockOnRetry = vi.fn();
      const mockOnRefresh = vi.fn();

      render(
        <AuditFallbackUI
          type="loading-failed"
          onRetry={mockOnRetry}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Retry")).toBeInTheDocument();
      expect(screen.getByText("Refresh Page")).toBeInTheDocument();
    });

    it("applies correct styling and layout", () => {
      render(<AuditFallbackUI type="no-data" />);

      // Check for main container
      const container =
        screen.getByRole("main") ||
        screen.getByText("No Audit Records Found").closest("div");
      expect(container).toBeInTheDocument();

      // Check for paper component
      expect(
        screen.getByText("No Audit Records Found").closest(".MuiPaper-root")
      ).toBeInTheDocument();
    });
  });
});
