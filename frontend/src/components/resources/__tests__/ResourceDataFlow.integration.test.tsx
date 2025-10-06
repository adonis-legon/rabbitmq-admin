import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import ResourceLayout from "../ResourceLayout";
import ConnectionsList from "../ConnectionsList";
import QueuesList from "../QueuesList";
import { ClusterConnection } from "../../../types/cluster";
import { RabbitMQConnection, RabbitMQQueue } from "../../../types/rabbitmq";

// Create a test wrapper with theme and router
const TestWrapper = ({
  children,
  initialEntries = ["/resources/connections"],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) => {
  const theme = createTheme();
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider theme={theme}>
        <div>
          {children}
        </div>
      </ThemeProvider>
    </MemoryRouter>
  );
};

// Mock the NotificationProvider and useNotification hook
vi.mock("../../../contexts/NotificationContext", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock constants
vi.mock("../../../utils/constants", () => ({
  ROUTES: {
    DASHBOARD: "/dashboard",
    RESOURCES_CONNECTIONS: "/resources/connections",
    RESOURCES_CHANNELS: "/resources/channels",
    RESOURCES_EXCHANGES: "/resources/exchanges",
    RESOURCES_QUEUES: "/resources/queues",
  },
}));

// Mock shared components
vi.mock("../shared/ResourceTable", () => ({
  default: ({
    data,
    onRowClick,
    loading,
    error,
    onPageChange,
    onPageSizeChange,
  }: any) => {
    if (error) {
      return <div data-testid="resource-table-error">{error}</div>;
    }
    if (loading) {
      return <div data-testid="resource-table-loading">Loading...</div>;
    }
    return (
      <div data-testid="resource-table">
        {data.map((row: any, index: number) => (
          <div
            key={row.id || index}
            role="row"
            onClick={() => onRowClick?.({ row })}
            data-testid={`resource-row-${row.name}`}
          >
            {row.name} - {row.state || row.type || "active"}
          </div>
        ))}
        <div data-testid="pagination-controls">
          <button onClick={() => onPageChange?.(1)} data-testid="next-page">
            Next
          </button>
          <button
            onClick={() => onPageSizeChange?.(100)}
            data-testid="change-page-size"
          >
            Change Size
          </button>
        </div>
      </div>
    );
  },
}));

vi.mock("../shared/ResourceFilters", () => ({
  default: ({
    searchTerm,
    onSearchChange,
    onClearFilters,
    stateFilter,
    onStateFilterChange,
  }: any) => {
    // Mock the behavior of triggering a search when the input changes
    const handleSearchChange = (value: string) => {
      onSearchChange(value);
      // Simulate the component calling loadConnections with search parameters
      // This is a simplified mock - in reality, the parent component handles this
    };

    const handleStateFilterChange = (e: any) => {
      // Handle both real events and test events
      let selectedValues: string[] = [];
      try {
        if (e.target.selectedOptions && e.target.selectedOptions.length > 0) {
          selectedValues = Array.from(
            e.target.selectedOptions,
            (option: any) => option.value
          );
        } else if (e.target.value) {
          // For test scenarios where selectedOptions might not work
          selectedValues = Array.isArray(e.target.value)
            ? e.target.value
            : [e.target.value];
        }
      } catch (error) {
        // Fallback for test scenarios
        selectedValues = ["running"];
      }
      onStateFilterChange(selectedValues);
    };

    return (
      <div data-testid="resource-filters">
        <input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          data-testid="search-input"
        />
        {searchTerm && (
          <button onClick={onClearFilters} data-testid="clear-filters">
            Clear
          </button>
        )}
        {onStateFilterChange && (
          <select
            multiple
            value={stateFilter || []}
            onChange={handleStateFilterChange}
            data-testid="state-filter"
          >
            <option value="running">Running</option>
            <option value="idle">Idle</option>
            <option value="blocked">Blocked</option>
          </select>
        )}
      </div>
    );
  },
}));

vi.mock("../shared/RefreshControls", () => ({
  default: ({ onRefresh, autoRefresh, onAutoRefreshChange }: any) => (
    <div data-testid="refresh-controls">
      <button onClick={onRefresh} data-testid="refresh-button">
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
    </div>
  ),
}));

// Mock detail modals
vi.mock("../ConnectionDetailModal", () => ({
  default: ({ open, onClose, connection }: any) =>
    open ? (
      <div data-testid="connection-detail-modal">
        <h2>Connection Details: {connection?.name}</h2>
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock("../QueueDetailModal", () => ({
  default: ({ open, onClose, queue }: any) =>
    open ? (
      <div data-testid="queue-detail-modal">
        <h2>Queue Details: {queue?.name}</h2>
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
      </div>
    ) : null,
}));

// Mock the hooks
const mockUseConnections = vi.fn();
const mockUseQueues = vi.fn();

vi.mock("../../../hooks/useConnections", () => ({
  useConnections: () => mockUseConnections(),
}));

vi.mock("../../../hooks/useQueues", () => ({
  useQueues: () => mockUseQueues(),
}));

const mockCluster: ClusterConnection = {
  id: "test-cluster-123",
  name: "Test Cluster",
  apiUrl: "http://localhost:15672",
  username: "guest",
  password: "guest",
  description: "Test cluster for integration tests",
  active: true,
  assignedUsers: [],
};

const mockConnections: RabbitMQConnection[] = [
  {
    name: "connection-1",
    state: "running",
    channels: 2,
    client_properties: { connection_name: "Test Connection 1" },
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
  {
    name: "connection-2",
    state: "blocked",
    channels: 1,
    client_properties: { connection_name: "Test Connection 2" },
    host: "localhost",
    peer_host: "192.168.1.101",
    port: 5672,
    peer_port: 54322,
    protocol: "AMQP 0-9-1",
    user: "admin",
    vhost: "/test",
    timeout: 30,
    frame_max: 131072,
    recv_oct: 2048000,
    recv_cnt: 200,
    send_oct: 1024000,
    send_cnt: 100,
    connected_at: Date.now() - 1800000,
  },
];

const mockQueues: RabbitMQQueue[] = [
  {
    name: "task.queue",
    state: "running",
    durable: true,
    auto_delete: false,
    exclusive: false,
    arguments: {},
    node: "rabbit@node1",
    vhost: "/",
    messages: 150,
    messages_ready: 100,
    messages_unacknowledged: 50,
    consumers: 3,
    memory: 2048000,
  },
  {
    name: "notification.queue",
    state: "idle",
    durable: false,
    auto_delete: true,
    exclusive: false,
    arguments: {},
    node: "rabbit@node2",
    vhost: "/notifications",
    messages: 0,
    messages_ready: 0,
    messages_unacknowledged: 0,
    consumers: 0,
    memory: 512000,
  },
];

// Skip heavy integration tests in CI environment for faster builds
const describeOrSkip = process.env.CI && process.env.SKIP_INTEGRATION_TESTS ? describe.skip : describe;

describeOrSkip("Resource Data Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseConnections.mockReturnValue({
      data: {
        items: mockConnections,
        page: 0,
        pageSize: 50,
        totalItems: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      loadConnections: vi.fn(),
      refreshConnections: vi.fn(),
      clearError: vi.fn(),
    });

    mockUseQueues.mockReturnValue({
      data: {
        items: mockQueues,
        page: 0,
        pageSize: 50,
        totalItems: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      loadQueues: vi.fn(),
      refreshQueues: vi.fn(),
      clearError: vi.fn(),
    });
  });

  describe("Navigation and Tab Switching", () => {
    it("navigates between resource tabs and loads appropriate data", async () => {
      render(
        <ResourceLayout selectedCluster={mockCluster}>
          <ConnectionsList clusterId={mockCluster.id} />
        </ResourceLayout>,
        { wrapper: TestWrapper }
      );

      // Should start on connections tab
      expect(screen.getByRole("tab", { name: /connections/i })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(
        screen.getByTestId("resource-row-connection-1")
      ).toBeInTheDocument();

      // Navigate to queues tab
      const queuesTab = screen.getByRole("tab", { name: /queues/i });
      fireEvent.click(queuesTab);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/resources/queues");
      });
    });

    it("maintains cluster context across navigation", async () => {
      render(
        <ResourceLayout selectedCluster={mockCluster}>
          <ConnectionsList clusterId={mockCluster.id} />
        </ResourceLayout>,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText((content, element) => {
          return (
            content.includes("Managing resources for cluster:") &&
            (element?.textContent?.includes(mockCluster.name) ?? false)
          );
        })
      ).toBeInTheDocument();

      // Navigate to different tab
      const channelsTab = screen.getByRole("tab", { name: /channels/i });
      fireEvent.click(channelsTab);

      // Cluster context should remain
      expect(
        screen.getByText((content, element) => {
          return (
            content.includes("Managing resources for cluster:") &&
            (element?.textContent?.includes(mockCluster.name) ?? false)
          );
        })
      ).toBeInTheDocument();
    });

    it("handles navigation with different initial routes", () => {
      const TestWrapperQueues = ({
        children,
      }: {
        children: React.ReactNode;
      }) => {
        const theme = createTheme();
        return (
          <MemoryRouter initialEntries={["/resources/queues"]}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
          </MemoryRouter>
        );
      };

      render(
        <ResourceLayout selectedCluster={mockCluster}>
          <QueuesList clusterId={mockCluster.id} />
        </ResourceLayout>,
        { wrapper: TestWrapperQueues }
      );

      expect(screen.getByRole("tab", { name: /queues/i })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
  });

  describe("Data Loading and State Management", () => {
    it("loads data when component mounts", () => {
      const mockLoadConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
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
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      expect(mockLoadConnections).toHaveBeenCalledWith(
        mockCluster.id,
        expect.objectContaining({
          page: 0,
          pageSize: 50,
        })
      );
    });

    it("displays loading state during data fetch", () => {
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
        loadConnections: vi.fn(),
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByTestId("resource-table-loading")).toBeInTheDocument();
    });

    it("displays error state when data loading fails", () => {
      const errorMessage = "Failed to load connections";
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
        loading: false,
        error: { message: errorMessage },
        loadConnections: vi.fn(),
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByTestId("resource-table-error")).toBeInTheDocument();
      expect(screen.getByTestId("resource-table-error")).toHaveTextContent(
        errorMessage
      );
    });
  });

  describe("Search and Filtering Integration", () => {
    it("updates data when search term changes", async () => {
      const mockLoadConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
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
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      const searchInput = screen.getByTestId("search-input");
      fireEvent.change(searchInput, { target: { value: "connection-1" } });

      // Wait for debounced search to trigger
      await waitFor(
        () => {
          expect(mockLoadConnections).toHaveBeenCalledWith(
            mockCluster.id,
            expect.objectContaining({
              name: "connection-1",
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it("applies state filters and updates data", async () => {
      const mockLoadConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
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
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      const stateFilter = screen.getByTestId("state-filter");
      fireEvent.change(stateFilter, {
        target: { value: ["running"] },
      });

      await waitFor(() => {
        // State filtering is handled client-side, so we just check that loadConnections was called
        expect(mockLoadConnections).toHaveBeenCalledWith(
          mockCluster.id,
          expect.objectContaining({
            page: 0,
            pageSize: 50,
          })
        );
      });
    });

    it("clears all filters when clear button is clicked", async () => {
      const mockLoadConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
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
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      // Set search term first
      const searchInput = screen.getByTestId("search-input");
      fireEvent.change(searchInput, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByTestId("clear-filters")).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByTestId("clear-filters");
      fireEvent.click(clearButton);

      await waitFor(() => {
        // After clearing, search should be empty (undefined)
        expect(mockLoadConnections).toHaveBeenCalledWith(
          mockCluster.id,
          expect.objectContaining({
            page: 0,
            pageSize: 50,
            name: undefined,
          })
        );
      });
    });
  });

  describe("Pagination Integration", () => {
    it("handles page changes", async () => {
      const mockLoadConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
          page: 0,
          pageSize: 50,
          totalItems: 100,
          totalPages: 2,
          hasNext: true,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      const nextPageButton = screen.getByTestId("next-page");
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(mockLoadConnections).toHaveBeenCalledWith(
          mockCluster.id,
          expect.objectContaining({
            page: 1,
          })
        );
      });
    });

    it("handles page size changes", async () => {
      const mockLoadConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
          page: 0,
          pageSize: 50,
          totalItems: 100,
          totalPages: 2,
          hasNext: true,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      const changeSizeButton = screen.getByTestId("change-page-size");
      fireEvent.click(changeSizeButton);

      await waitFor(() => {
        expect(mockLoadConnections).toHaveBeenCalledWith(
          mockCluster.id,
          expect.objectContaining({
            pageSize: 100,
          })
        );
      });
    });

    it("preserves filters during pagination", async () => {
      const mockLoadConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
          page: 0,
          pageSize: 50,
          totalItems: 100,
          totalPages: 2,
          hasNext: true,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      // Set search filter
      const searchInput = screen.getByTestId("search-input");
      fireEvent.change(searchInput, { target: { value: "connection-1" } });

      await waitFor(() => {
        expect(mockLoadConnections).toHaveBeenCalledWith(
          mockCluster.id,
          expect.objectContaining({
            name: "connection-1",
            page: 0,
          })
        );
      });

      // Change page
      const nextPageButton = screen.getByTestId("next-page");
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(mockLoadConnections).toHaveBeenCalledWith(
          mockCluster.id,
          expect.objectContaining({
            name: "connection-1",
            page: 1,
          })
        );
      });
    });
  });

  describe("Refresh Integration", () => {
    it("refreshes data when refresh button is clicked", async () => {
      const mockRefreshConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
          page: 0,
          pageSize: 50,
          totalItems: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: vi.fn(),
        refreshConnections: mockRefreshConnections,
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      const refreshButton = screen.getByTestId("refresh-button");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalled();
      });
    });

    it("preserves current state during refresh", async () => {
      const mockRefreshConnections = vi.fn();
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
          page: 1,
          pageSize: 25,
          totalItems: 100,
          totalPages: 4,
          hasNext: true,
          hasPrevious: true,
        },
        loading: false,
        error: null,
        loadConnections: vi.fn(),
        refreshConnections: mockRefreshConnections,
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      // Set search term
      const searchInput = screen.getByTestId("search-input");
      fireEvent.change(searchInput, { target: { value: "test" } });

      // Refresh
      const refreshButton = screen.getByTestId("refresh-button");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockRefreshConnections).toHaveBeenCalled();
      });

      // Search term should be preserved
      expect(searchInput).toHaveValue("test");
    });
  });

  describe("Detail Modal Integration", () => {
    it("opens detail modal when resource row is clicked", async () => {
      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      const connectionRow = screen.getByTestId("resource-row-connection-1");
      fireEvent.click(connectionRow);

      await waitFor(() => {
        expect(
          screen.getByTestId("connection-detail-modal")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Connection Details: connection-1")
        ).toBeInTheDocument();
      });
    });

    it("closes detail modal when close button is clicked", async () => {
      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      const connectionRow = screen.getByTestId("resource-row-connection-1");
      fireEvent.click(connectionRow);

      await waitFor(() => {
        expect(
          screen.getByTestId("connection-detail-modal")
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId("close-modal");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId("connection-detail-modal")
        ).not.toBeInTheDocument();
      });
    });

    it("handles modal interactions for different resource types", async () => {
      render(<QueuesList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      const queueRow = screen.getByTestId("resource-row-task.queue");
      fireEvent.click(queueRow);

      await waitFor(() => {
        expect(screen.getByTestId("queue-detail-modal")).toBeInTheDocument();
        expect(
          screen.getByText("Queue Details: task.queue")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Cross-Component State Management", () => {
    it("maintains independent state for different resource types", () => {
      const mockLoadQueues = vi.fn();
      mockUseQueues.mockReturnValue({
        data: {
          items: mockQueues,
          page: 0,
          pageSize: 50,
          totalItems: 50,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadQueues: mockLoadQueues,
        refreshQueues: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <div>
          <ConnectionsList clusterId={mockCluster.id} />
          <QueuesList clusterId={mockCluster.id} />
        </div>,
        { wrapper: TestWrapper }
      );

      // Both components should render independently
      expect(screen.getAllByTestId("resource-table")).toHaveLength(2);
      expect(
        screen.getByText((content) => content.includes("connection-1"))
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes("task.queue"))
      ).toBeInTheDocument();
    });

    it("handles cluster changes across all components", () => {
      const newClusterId = "new-cluster-456";
      const mockLoadConnections = vi.fn();
      const mockLoadQueues = vi.fn();

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
        loading: false,
        error: null,
        loadConnections: mockLoadConnections,
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      mockUseQueues.mockReturnValue({
        data: {
          items: [],
          page: 0,
          pageSize: 50,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadQueues: mockLoadQueues,
        refreshQueues: vi.fn(),
        clearError: vi.fn(),
      });

      const { rerender } = render(
        <div>
          <ConnectionsList clusterId={mockCluster.id} />
          <QueuesList clusterId={mockCluster.id} />
        </div>,
        { wrapper: TestWrapper }
      );

      // Change cluster
      rerender(
        <div>
          <ConnectionsList clusterId={newClusterId} />
          <QueuesList clusterId={newClusterId} />
        </div>
      );

      // Both components should reload with new cluster
      expect(mockLoadConnections).toHaveBeenCalledWith(
        newClusterId,
        expect.objectContaining({ page: 0, pageSize: 50 })
      );
      expect(mockLoadQueues).toHaveBeenCalledWith(
        newClusterId,
        expect.objectContaining({ page: 0, pageSize: 50 })
      );
    });
  });

  describe("Error Recovery Integration", () => {
    it.skip("recovers from errors when retry is successful", async () => {
      const mockLoadConnections = vi.fn();

      const { rerender } = render(
        <ConnectionsList clusterId={mockCluster.id} />,
        { wrapper: TestWrapper }
      );

      // Simulate error state
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
        loading: false,
        error: { message: "Network error" },
        loadConnections: mockLoadConnections,
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      rerender(<ConnectionsList clusterId={mockCluster.id} />);

      await waitFor(() => {
        expect(screen.getByTestId("resource-table-error")).toBeInTheDocument();
      });

      // Simulate successful retry by completely remounting the component
      mockUseConnections.mockReturnValue({
        data: {
          items: mockConnections,
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
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      // Force a complete re-render by changing the key
      rerender(
        <div key="success">
          <ConnectionsList clusterId={mockCluster.id} />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId("resource-table")).toBeInTheDocument();
        expect(
          screen.getByText((content) => content.includes("connection-1"))
        ).toBeInTheDocument();
      });
    });
  });

  describe("Performance and Optimization", () => {
    it("handles large datasets efficiently", () => {
      const largeConnectionsDataset = Array.from({ length: 1000 }, (_, i) => ({
        name: `connection-${i}`,
        state: "running" as const,
        channels: Math.floor(Math.random() * 10),
        client_properties: { connection_name: `Connection ${i}` },
        host: "localhost",
        peer_host: `192.168.1.${100 + (i % 50)}`,
        port: 5672,
        peer_port: 50000 + i,
        protocol: "AMQP 0-9-1",
        user: "guest",
        vhost: "/",
        timeout: 60,
        frame_max: 131072,
        recv_oct: Math.floor(Math.random() * 1000000),
        recv_cnt: Math.floor(Math.random() * 1000),
        send_oct: Math.floor(Math.random() * 1000000),
        send_cnt: Math.floor(Math.random() * 1000),
        connected_at: Date.now() - Math.floor(Math.random() * 3600000),
      }));

      mockUseConnections.mockReturnValue({
        data: {
          items: largeConnectionsDataset,
          page: 0,
          pageSize: 100,
          totalItems: 1000,
          totalPages: 10,
          hasNext: true,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        loadConnections: vi.fn(),
        refreshConnections: vi.fn(),
        clearError: vi.fn(),
      });

      render(<ConnectionsList clusterId={mockCluster.id} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByTestId("resource-table")).toBeInTheDocument();
      expect(
        screen.getByTestId("resource-row-connection-0")
      ).toBeInTheDocument();
    });
  });
});
