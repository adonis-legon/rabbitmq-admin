import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ConnectionsList from "../ConnectionsList";
import { RabbitMQConnection } from "../../../types/rabbitmq";

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

// Mock shared components
vi.mock("../shared/ResourceTable", () => ({
  default: ({ data, loading, error }: any) => {
    if (error) {
      return <div data-testid="resource-table-error">{error}</div>;
    }
    if (loading) {
      return <div data-testid="resource-table-loading">Loading...</div>;
    }
    return (
      <div data-testid="resource-table">
        {data.map((row: any, index: number) => (
          <div key={row.id || index} data-testid={`connection-${row.name}`}>
            {row.name} - {row.state}
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock("../shared/ResourceFilters", () => ({
  default: ({ searchTerm, onSearchChange, onClearFilters }: any) => (
    <div data-testid="resource-filters">
      <input
        placeholder="Search connections..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        data-testid="search-input"
      />
      {searchTerm && (
        <button onClick={onClearFilters} data-testid="clear-filters">
          Clear Filters
        </button>
      )}
    </div>
  ),
}));

vi.mock("../shared/RefreshControls", () => ({
  default: ({
    onRefresh,
    autoRefresh,
    onAutoRefreshChange,
    refreshInterval,
    onRefreshIntervalChange,
    loading,
    lastUpdated,
  }: any) => (
    <div data-testid="refresh-controls">
      <button
        onClick={onRefresh}
        disabled={loading}
        data-testid="refresh-button"
      >
        Refresh
      </button>
      <label>
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => onAutoRefreshChange(e.target.checked)}
          data-testid="auto-refresh-toggle"
        />
        Auto-refresh
      </label>
      {autoRefresh && (
        <select
          value={refreshInterval}
          onChange={(e) => onRefreshIntervalChange(parseInt(e.target.value))}
          data-testid="refresh-interval-select"
        >
          <option value={10}>10s</option>
          <option value={30}>30s</option>
          <option value={60}>60s</option>
        </select>
      )}
      {lastUpdated && (
        <div data-testid="last-updated">
          Last updated: {lastUpdated.toISOString()}
        </div>
      )}
    </div>
  ),
}));

vi.mock("../ConnectionDetailModal", () => ({
  default: () => null,
}));

// Mock the hooks
const mockUseConnections = vi.fn();
vi.mock("../../../hooks/useConnections", () => ({
  useConnections: () => mockUseConnections(),
}));

const initialConnections: RabbitMQConnection[] = [
  {
    name: "connection-1",
    state: "running",
    channels: 2,
    client_properties: {
      connection_name: "Test Connection 1",
      platform: "Java",
    },
    host: "localhost",
    peer_host: "192.168.1.100",
    port: 5672,
    peer_port: 54321,
    protocol: "AMQP 0-9-1",
    user: "guest",
    vhost: "/",
    timeout: 60,
    frame_max: 131072,
    recv_oct: 1024000,
    recv_cnt: 100,
    send_oct: 512000,
    send_cnt: 50,
    connected_at: Date.now() - 3600000,
  },
];

const updatedConnections: RabbitMQConnection[] = [
  {
    ...initialConnections[0],
    state: "blocked", // State changed
    channels: 3, // Channel count increased
    recv_oct: 2048000, // Bytes received increased
  },
  {
    name: "connection-2",
    state: "running",
    channels: 1,
    client_properties: {
      connection_name: "New Connection",
      platform: "Python",
    },
    host: "localhost",
    peer_host: "192.168.1.102",
    port: 5672,
    peer_port: 54323,
    protocol: "AMQP 0-9-1",
    user: "admin",
    vhost: "/",
    timeout: 30,
    frame_max: 131072,
    recv_oct: 512000,
    recv_cnt: 50,
    send_oct: 256000,
    send_cnt: 25,
    connected_at: Date.now() - 1800000,
  },
];

describe("Auto-Refresh Integration Tests", () => {
  const mockClusterId = "test-cluster-id";
  let mockLoadConnections: ReturnType<typeof vi.fn>;
  let mockRefreshConnections: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockLoadConnections = vi.fn();
    mockRefreshConnections = vi.fn();

    mockUseConnections.mockReturnValue({
      data: {
        items: initialConnections,
        page: 0,
        pageSize: 50,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      loadConnections: mockLoadConnections,
      refreshConnections: mockRefreshConnections,
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("Manual Refresh", () => {
    it.skip("triggers refresh when refresh button is clicked", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const refreshButton = screen.getByTestId("refresh-button");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(1);
      });
    });

    it("disables refresh button during loading", () => {
      mockUseConnections.mockReturnValue({
        data: {
          items: [],
          page: 0,
          pageSize: 50,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
        loading: true,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: mockRefreshConnections,
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const refreshButton = screen.getByTestId("refresh-button");
      expect(refreshButton).toBeDisabled();
    });

    it.skip("updates data after manual refresh", async () => {
      const { rerender } = render(
        <ConnectionsList clusterId={mockClusterId} />,
        { wrapper: TestWrapper }
      );

      // Initial state
      expect(screen.getByTestId("connection-connection-1")).toHaveTextContent(
        "connection-1 - running"
      );

      // Simulate refresh with updated data
      mockUseConnections.mockReturnValue({
        data: {
          items: updatedConnections,
          page: 0,
          pageSize: 50,
          totalItems: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: mockRefreshConnections,
        clearError: vi.fn(),
      });

      rerender(<ConnectionsList clusterId={mockClusterId} />);

      await waitFor(() => {
        expect(screen.getByTestId("connection-connection-1")).toHaveTextContent(
          "connection-1 - blocked"
        );
        expect(screen.getByTestId("connection-connection-2")).toHaveTextContent(
          "connection-2 - running"
        );
      });
    });
  });

  describe("Auto-Refresh Toggle", () => {
    it.skip("enables auto-refresh when toggle is clicked", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      expect(autoRefreshToggle).not.toBeChecked();

      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(autoRefreshToggle).toBeChecked();
      });
    });

    it.skip("shows refresh interval selector when auto-refresh is enabled", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });
    });

    it.skip("hides refresh interval selector when auto-refresh is disabled", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");

      // Enable auto-refresh first
      fireEvent.click(autoRefreshToggle);
      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Disable auto-refresh
      fireEvent.click(autoRefreshToggle);
      await waitFor(() => {
        expect(
          screen.queryByTestId("refresh-interval-select")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Auto-Refresh Intervals", () => {
    it.skip("refreshes data at 10-second intervals", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Set interval to 10 seconds
      const intervalSelect = screen.getByTestId("refresh-interval-select");
      fireEvent.change(intervalSelect, { target: { value: "10" } });

      // Fast-forward 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(1);
      });

      // Fast-forward another 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(2);
      });
    });

    it.skip("refreshes data at 30-second intervals", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Set interval to 30 seconds
      const intervalSelect = screen.getByTestId("refresh-interval-select");
      fireEvent.change(intervalSelect, { target: { value: "30" } });

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 20 more seconds (should not trigger refresh yet)
      act(() => {
        vi.advanceTimersByTime(20000);
      });

      expect(mockRefreshConnections).toHaveBeenCalledTimes(1);

      // Fast-forward 10 more seconds (total 60s, should trigger second refresh)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(2);
      });
    });

    it.skip("changes refresh interval dynamically", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Start with 30-second interval
      const intervalSelect = screen.getByTestId("refresh-interval-select");
      fireEvent.change(intervalSelect, { target: { value: "30" } });

      // Fast-forward 15 seconds
      act(() => {
        vi.advanceTimersByTime(15000);
      });

      // Change to 10-second interval
      fireEvent.change(intervalSelect, { target: { value: "10" } });

      // Fast-forward 10 seconds (should trigger refresh with new interval)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Auto-Refresh State Management", () => {
    it.skip("stops auto-refresh when toggle is disabled", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Set 10-second interval
      const intervalSelect = screen.getByTestId("refresh-interval-select");
      fireEvent.change(intervalSelect, { target: { value: "10" } });

      // Fast-forward 10 seconds (should trigger refresh)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(1);
      });

      // Disable auto-refresh
      fireEvent.click(autoRefreshToggle);

      // Fast-forward another 10 seconds (should not trigger refresh)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should still be 1 call
      expect(mockRefreshConnections).toHaveBeenCalledTimes(1);
    });

    it.skip("preserves filters and pagination during auto-refresh", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      // Set up search filter
      const searchInput = screen.getByTestId("search-input");
      fireEvent.change(searchInput, { target: { value: "connection-1" } });

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Set 10-second interval
      const intervalSelect = screen.getByTestId("refresh-interval-select");
      fireEvent.change(intervalSelect, { target: { value: "10" } });

      // Fast-forward 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(1);
      });

      // Verify search term is preserved
      expect(searchInput).toHaveValue("connection-1");
    });

    it.skip("handles errors during auto-refresh gracefully", async () => {
      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Set 10-second interval
      const intervalSelect = screen.getByTestId("refresh-interval-select");
      fireEvent.change(intervalSelect, { target: { value: "10" } });

      // Mock error on refresh
      mockRefreshConnections.mockRejectedValueOnce(new Error("Network error"));

      // Fast-forward 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(1);
      });

      // Auto-refresh should continue despite error
      mockRefreshConnections.mockResolvedValueOnce(undefined);

      // Fast-forward another 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Last Updated Timestamp", () => {
    it("displays last updated timestamp after refresh", async () => {
      const lastUpdated = new Date("2023-01-01T12:00:00Z");

      mockUseConnections.mockReturnValue({
        data: {
          items: initialConnections,
          page: 0,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: mockRefreshConnections,
        clearError: vi.fn(),
        lastUpdated,
      });

      render(<ConnectionsList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByTestId("last-updated")).toHaveTextContent(
        `Last updated: ${lastUpdated.toISOString()}`
      );
    });

    it.skip("updates timestamp after manual refresh", async () => {
      const initialTime = new Date("2023-01-01T12:00:00Z");
      const updatedTime = new Date("2023-01-01T12:05:00Z");

      mockUseConnections.mockReturnValue({
        data: {
          items: initialConnections,
          page: 0,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: mockRefreshConnections,
        clearError: vi.fn(),
        lastUpdated: initialTime,
      });

      const { rerender } = render(
        <ConnectionsList clusterId={mockClusterId} />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId("last-updated")).toHaveTextContent(
        `Last updated: ${initialTime.toISOString()}`
      );

      // Simulate refresh with updated timestamp
      mockUseConnections.mockReturnValue({
        data: {
          items: initialConnections,
          page: 0,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: mockRefreshConnections,
        clearError: vi.fn(),
        lastUpdated: updatedTime,
      });

      rerender(<ConnectionsList clusterId={mockClusterId} />);

      await waitFor(() => {
        expect(screen.getByTestId("last-updated")).toHaveTextContent(
          `Last updated: ${updatedTime.toISOString()}`
        );
      });
    });
  });

  describe("Component Cleanup", () => {
    it.skip("clears auto-refresh timer on component unmount", async () => {
      const { unmount } = render(
        <ConnectionsList clusterId={mockClusterId} />,
        { wrapper: TestWrapper }
      );

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Set 10-second interval
      const intervalSelect = screen.getByTestId("refresh-interval-select");
      fireEvent.change(intervalSelect, { target: { value: "10" } });

      // Unmount component
      unmount();

      // Fast-forward 10 seconds (should not trigger refresh after unmount)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockRefreshConnections).not.toHaveBeenCalled();
    });

    it.skip("clears auto-refresh timer when cluster changes", async () => {
      const { rerender } = render(
        <ConnectionsList clusterId={mockClusterId} />,
        { wrapper: TestWrapper }
      );

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByTestId("auto-refresh-toggle");
      fireEvent.click(autoRefreshToggle);

      await waitFor(() => {
        expect(
          screen.getByTestId("refresh-interval-select")
        ).toBeInTheDocument();
      });

      // Set 10-second interval
      const intervalSelect = screen.getByTestId("refresh-interval-select");
      fireEvent.change(intervalSelect, { target: { value: "10" } });

      // Change cluster
      rerender(<ConnectionsList clusterId="different-cluster-id" />);

      // Fast-forward 10 seconds (should not trigger refresh for old cluster)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockRefreshConnections).not.toHaveBeenCalled();
    });
  });
});
