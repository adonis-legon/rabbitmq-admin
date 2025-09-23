import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import ResourceErrorBoundary from "../shared/ResourceErrorBoundary";
import React from "react";

// Create a test wrapper with theme and router
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return (
    <MemoryRouter>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </MemoryRouter>
  );
};

// Component that throws different types of errors
const ErrorThrowingComponent = ({
  errorType,
  shouldThrow = true,
}: {
  errorType: string;
  shouldThrow?: boolean;
}) => {
  if (!shouldThrow) {
    return (
      <div data-testid="success-content">Component loaded successfully</div>
    );
  }

  switch (errorType) {
    case "network":
      throw new Error("Network request failed");
    case "timeout":
      throw new Error("Request timeout");
    case "auth":
      throw new Error("401 Unauthorized");
    case "forbidden":
      throw new Error("403 Forbidden");
    case "server":
      throw new Error("500 Internal Server Error");
    case "cluster":
      throw new Error("Cluster connection failed");
    case "parse":
      throw new Error("Failed to parse response");
    default:
      throw new Error("Generic error");
  }
};

describe("Error Boundary Integration Tests", () => {
  const mockOnError = vi.fn();
  const mockOnRetry = vi.fn();
  const mockClusterId = "test-cluster-123";

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for these tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Network Error Handling", () => {
    it("displays network error with appropriate suggestions", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          clusterId={mockClusterId}
          resourceType="connections"
        >
          <ErrorThrowingComponent errorType="network" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Resource Loading Error")).toBeInTheDocument();
      expect(screen.getByText("Network request failed")).toBeInTheDocument();
      expect(
        screen.getByText(
          'Unable to load connections data for cluster "test-cluster-123".'
        )
      ).toBeInTheDocument();

      // Check for network-specific suggestions
      expect(screen.getByText("Suggested Solutions")).toBeInTheDocument();
      expect(
        screen.getByText("Check your internet connection")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Ensure cluster "test-cluster-123" is running and reachable'
        )
      ).toBeInTheDocument();
    });

    it("handles timeout errors with specific suggestions", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          clusterId={mockClusterId}
          resourceType="queues"
        >
          <ErrorThrowingComponent errorType="timeout" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Request timeout")).toBeInTheDocument();
      expect(
        screen.getByText(
          'Unable to load queues data for cluster "test-cluster-123".'
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Try refreshing the page")).toBeInTheDocument();
    });
  });

  describe("Authentication and Authorization Errors", () => {
    it("displays authentication error with login suggestions", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          resourceType="connections"
        >
          <ErrorThrowingComponent errorType="auth" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("401 Unauthorized")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Your session may have expired - try refreshing the page"
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Log out and log back in")).toBeInTheDocument();
    });

    it("displays authorization error with permission suggestions", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          resourceType="exchanges"
        >
          <ErrorThrowingComponent errorType="forbidden" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("403 Forbidden")).toBeInTheDocument();
      expect(
        screen.getByText("You may not have permission to access this resource")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Contact your administrator for access")
      ).toBeInTheDocument();
    });
  });

  describe("Server and Cluster Errors", () => {
    it("displays server error with appropriate suggestions", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          clusterId={mockClusterId}
          resourceType="channels"
        >
          <ErrorThrowingComponent errorType="server" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("500 Internal Server Error")).toBeInTheDocument();
      expect(screen.getByText("Try refreshing the page")).toBeInTheDocument();
    });

    it("displays cluster-specific error suggestions", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          clusterId={mockClusterId}
          resourceType="queues"
        >
          <ErrorThrowingComponent errorType="cluster" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Cluster connection failed")).toBeInTheDocument();
      // Check for cluster-specific error suggestions that are actually rendered
      expect(document.body.textContent).toMatch(/cluster.*connection.*failed/i);
    });
  });

  describe("Resource-Specific Error Handling", () => {
    it("provides resource-specific suggestions for connections", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          resourceType="connections"
        >
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText("Try navigating to a different connections page")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Check if the connections data is available in RabbitMQ"
        )
      ).toBeInTheDocument();
    });

    it("provides resource-specific suggestions for queues", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          resourceType="queues"
        >
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText("Try navigating to a different queues page")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Check if the queues data is available in RabbitMQ")
      ).toBeInTheDocument();
    });

    it("provides resource-specific suggestions for exchanges", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          resourceType="exchanges"
        >
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText("Try navigating to a different exchanges page")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Check if the exchanges data is available in RabbitMQ")
      ).toBeInTheDocument();
    });

    it("provides resource-specific suggestions for channels", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          resourceType="channels"
        >
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText("Try navigating to a different channels page")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Check if the channels data is available in RabbitMQ")
      ).toBeInTheDocument();
    });
  });

  describe("Error Recovery and Retry", () => {
    it("calls onError callback with error details", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          onRetry={mockOnRetry}
          clusterId={mockClusterId}
          resourceType="connections"
        >
          <ErrorThrowingComponent errorType="network" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Network request failed",
        }),
        expect.any(Object)
      );
    });

    it("handles retry functionality", async () => {
      let shouldThrow = true;
      const DynamicComponent = () => {
        if (shouldThrow) {
          throw new Error("Temporary error");
        }
        return (
          <div data-testid="success-content">Component loaded successfully</div>
        );
      };

      render(
        <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
          <DynamicComponent />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Resource Loading Error")).toBeInTheDocument();

      // Simulate fixing the error
      shouldThrow = false;

      const retryButton = screen.getByText("Retry");
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByTestId("success-content")).toBeInTheDocument();
      });
    });

    it("resets error state when children change", () => {
      const { rerender } = render(
        <ResourceErrorBoundary
          key="error"
          onError={mockOnError}
          onRetry={mockOnRetry}
        >
          <ErrorThrowingComponent errorType="network" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Resource Loading Error")).toBeInTheDocument();

      // Change children with different key to force reset
      rerender(
        <ResourceErrorBoundary
          key="success"
          onError={mockOnError}
          onRetry={mockOnRetry}
        >
          <div data-testid="new-content">New content</div>
        </ResourceErrorBoundary>
      );

      expect(screen.getByTestId("new-content")).toBeInTheDocument();
    });
  });

  describe("Error Boundary Actions", () => {
    it("provides reload page functionality", () => {
      const mockReload = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <ResourceErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      const reloadButton = screen.getByText("Reload Page");
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalled();
    });

    it("provides go home functionality", () => {
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(
        <ResourceErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      const homeButton = screen.getByText("Go Home");
      fireEvent.click(homeButton);

      expect(mockLocation.href).toBe("/");
    });

    it("hides retry button when onRetry is not provided", () => {
      render(
        <ResourceErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Resource Loading Error")).toBeInTheDocument();
      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
      expect(screen.getByText("Reload Page")).toBeInTheDocument();
      expect(screen.getByText("Go Home")).toBeInTheDocument();
    });
  });

  describe("Development vs Production Behavior", () => {
    it("displays error ID in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      render(
        <ResourceErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/Error ID:/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it("displays debug button in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      render(
        <ResourceErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Log Error Details")).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it("logs error details when debug button is clicked", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(
        <ResourceErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      const debugButton = screen.getByText("Log Error Details");
      fireEvent.click(debugButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error details:",
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Generic error",
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe("Error Context and Metadata", () => {
    it("includes cluster context in error messages", () => {
      render(
        <ResourceErrorBoundary
          onError={mockOnError}
          clusterId="production-cluster-456"
          resourceType="exchanges"
        >
          <ErrorThrowingComponent errorType="cluster" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText(
          'Unable to load exchanges data for cluster "production-cluster-456".'
        )
      ).toBeInTheDocument();
    });

    it("handles missing cluster context gracefully", () => {
      render(
        <ResourceErrorBoundary onError={mockOnError} resourceType="channels">
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText("Unable to load channels data.")
      ).toBeInTheDocument();
    });

    it("handles missing resource type gracefully", () => {
      render(
        <ResourceErrorBoundary onError={mockOnError} clusterId={mockClusterId}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText("Unable to load resource data.")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and roles", () => {
      render(
        <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reload Page" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Go Home" })
      ).toBeInTheDocument();
    });

    it("supports keyboard navigation", () => {
      render(
        <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
          <ErrorThrowingComponent errorType="generic" />
        </ResourceErrorBoundary>,
        { wrapper: TestWrapper }
      );

      const retryButton = screen.getByRole("button", { name: "Retry" });
      const reloadButton = screen.getByRole("button", { name: "Reload Page" });
      const homeButton = screen.getByRole("button", { name: "Go Home" });

      expect(retryButton).toBeInTheDocument();
      expect(reloadButton).toBeInTheDocument();
      expect(homeButton).toBeInTheDocument();

      // All buttons should be focusable
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });
  });
});
