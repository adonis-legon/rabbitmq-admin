import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ResourceErrorBoundary from "../ResourceErrorBoundary";
import React from "react";

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ResourceErrorBoundary", () => {
  const mockOnError = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for these tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
        <div>Test content</div>
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error UI when child component throws", () => {
    render(
      <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Resource Loading Error")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("calls onError callback when error occurs", () => {
    render(
      <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Test error",
      }),
      expect.any(Object)
    );
  });

  it("handles retry functionality", () => {
    let shouldThrow = true;
    const DynamicComponent = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>No error</div>;
    };

    render(
      <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
        <DynamicComponent />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Resource Loading Error")).toBeInTheDocument();

    const retryButton = screen.getByText("Retry");

    // Change the component to not throw before clicking retry
    shouldThrow = false;

    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalled();

    // The error boundary should have reset and re-rendered the children
    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("displays cluster and resource type context", () => {
    render(
      <ResourceErrorBoundary
        onError={mockOnError}
        onRetry={mockOnRetry}
        clusterId="test-cluster"
        resourceType="connections"
      >
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(
      screen.getByText(
        'Unable to load connections data for cluster "test-cluster".'
      )
    ).toBeInTheDocument();
  });

  it("displays resource type without cluster", () => {
    render(
      <ResourceErrorBoundary
        onError={mockOnError}
        onRetry={mockOnRetry}
        resourceType="queues"
      >
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Unable to load queues data.")).toBeInTheDocument();
  });

  it("displays generic message without context", () => {
    render(
      <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(
      screen.getByText("Unable to load resource data.")
    ).toBeInTheDocument();
  });

  it("hides retry button when onRetry is not provided", () => {
    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Resource Loading Error")).toBeInTheDocument();
    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });

  it("displays reload page button", () => {
    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("displays go home button", () => {
    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Go Home")).toBeInTheDocument();
  });

  it("handles reload page click", () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    const reloadButton = screen.getByText("Reload Page");
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it("handles go home click", () => {
    // Mock window.location.href
    const mockLocation = { href: "" };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    const homeButton = screen.getByText("Go Home");
    fireEvent.click(homeButton);

    expect(mockLocation.href).toBe("/");
  });

  it("displays error suggestions for network errors", () => {
    const NetworkError = () => {
      throw new Error("Network request failed");
    };

    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <NetworkError />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Suggested Solutions")).toBeInTheDocument();
    expect(
      screen.getByText("Check your internet connection")
    ).toBeInTheDocument();
  });

  it("displays error suggestions for authentication errors", () => {
    const AuthError = () => {
      throw new Error("401 Unauthorized");
    };

    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <AuthError />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Suggested Solutions")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your session may have expired - try refreshing the page"
      )
    ).toBeInTheDocument();
  });

  it("displays error suggestions for authorization errors", () => {
    const ForbiddenError = () => {
      throw new Error("403 Forbidden");
    };

    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <ForbiddenError />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Suggested Solutions")).toBeInTheDocument();
    expect(
      screen.getByText("You may not have permission to access this resource")
    ).toBeInTheDocument();
  });

  it("displays error ID in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <ResourceErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
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
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Log Error Details")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("resets error state when children change", () => {
    const { rerender } = render(
      <ResourceErrorBoundary
        key="error"
        onError={mockOnError}
        onRetry={mockOnRetry}
      >
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Resource Loading Error")).toBeInTheDocument();

    // Change children to non-throwing component with different key to force reset
    rerender(
      <ResourceErrorBoundary
        key="success"
        onError={mockOnError}
        onRetry={mockOnRetry}
      >
        <div>New content</div>
      </ResourceErrorBoundary>
    );

    expect(screen.getByText("New content")).toBeInTheDocument();
  });

  it("logs errors to console", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ResourceErrorBoundary onError={mockOnError} onRetry={mockOnRetry}>
        <ThrowError shouldThrow={true} />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("displays resource-specific suggestions", () => {
    render(
      <ResourceErrorBoundary onError={mockOnError} resourceType="exchanges">
        <ThrowError shouldThrow={true} />
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

  it("displays cluster-specific suggestions", () => {
    const NetworkErrorWithCluster = () => {
      throw new Error("Network request failed");
    };

    render(
      <ResourceErrorBoundary onError={mockOnError} clusterId="test-cluster-123">
        <NetworkErrorWithCluster />
      </ResourceErrorBoundary>,
      { wrapper: TestWrapper }
    );

    expect(
      screen.getByText(
        'Ensure cluster "test-cluster-123" is running and reachable'
      )
    ).toBeInTheDocument();
  });
});
