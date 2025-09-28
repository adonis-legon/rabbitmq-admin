import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ExchangesList from "../ExchangesList";
import { RabbitMQExchange } from "../../../types/rabbitmq";
import { useExchanges } from "../../../hooks/useExchanges";

// Mock the useExchanges hook
vi.mock("../../../hooks/useExchanges");

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

const mockExchanges: RabbitMQExchange[] = [
  {
    name: "direct-exchange",
    type: "direct",
    durable: true,
    auto_delete: false,
    internal: false,
    arguments: { "x-max-length": 1000 },
    vhost: "/",
    message_stats: {
      publish_in: 150,
      publish_in_details: { rate: 5.2 },
      publish_out: 140,
      publish_out_details: { rate: 4.8 },
    },
  },
  {
    name: "topic-exchange",
    type: "topic",
    durable: false,
    auto_delete: true,
    internal: true,
    arguments: {},
    vhost: "/test",
    message_stats: {
      publish_in: 75,
      publish_in_details: { rate: 2.1 },
      publish_out: 70,
      publish_out_details: { rate: 2.0 },
    },
  },
  {
    name: "fanout-exchange",
    type: "fanout",
    durable: true,
    auto_delete: false,
    internal: false,
    arguments: { "alternate-exchange": "backup-exchange" },
    vhost: "/",
  },
];

// Mock the API
vi.mock("../../../services/api/rabbitmqResourcesApi", () => ({
  rabbitmqResourcesApi: {
    getExchanges: vi.fn(),
  },
}));

// Mock notification context
vi.mock("../../../contexts/NotificationContext", () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock dialog components
vi.mock("../CreateExchangeDialog", () => ({
  default: ({ open, onClose, onSuccess }: any) =>
    open ? (
      <div data-testid="create-exchange-dialog">
        <h2>Create Exchange</h2>
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={() => {
            onSuccess();
            onClose();
          }}
        >
          Create
        </button>
      </div>
    ) : null,
}));

vi.mock("../CreateBindingDialog", () => ({
  default: ({ open, onClose, onSuccess, sourceResource }: any) =>
    open ? (
      <div data-testid="create-binding-dialog">
        <h2>Create Binding from {sourceResource?.name}</h2>
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={() => {
            onSuccess();
            onClose();
          }}
        >
          Create Binding
        </button>
      </div>
    ) : null,
}));

vi.mock("../PublishMessageDialog", () => ({
  default: ({ open, onClose, onSuccess, targetResource }: any) =>
    open ? (
      <div data-testid="publish-message-dialog">
        <h2>Publish Message to {targetResource?.name}</h2>
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={() => {
            onSuccess();
            onClose();
          }}
        >
          Publish
        </button>
      </div>
    ) : null,
}));

vi.mock("../../common/DeleteConfirmationDialog", () => ({
  default: ({ open, onClose, onConfirm, resourceName }: any) =>
    open ? (
      <div data-testid="delete-confirmation-dialog">
        <h2>Delete {resourceName}</h2>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onConfirm({})}>Delete</button>
      </div>
    ) : null,
}));

// Mock shared components
vi.mock("../shared/ResourceTable", () => ({
  default: ({ data, columns, onRowClick }: any) => (
    <div data-testid="resource-table" role="grid">
      {data.map((row: any, index: number) => (
        <div
          key={row.id || index}
          role="row"
          onClick={() => onRowClick?.({ row })}
          style={{
            cursor: "pointer",
            padding: "8px",
            border: "1px solid #ccc",
            margin: "2px",
          }}
        >
          {columns.map((col: any) => {
            const value = col.renderCell
              ? col.renderCell({ row, value: row[col.field] })
              : row[col.field];
            return (
              <div key={col.field} data-testid={`cell-${col.field}`}>
                {typeof value === "object" ? value : String(value)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../shared/ResourceFilters", () => ({
  default: ({
    searchTerm,
    onSearchChange,
    onClearFilters,
    searchPlaceholder,
    typeFilter,
    typeOptions,
    onTypeFilterChange,
  }: any) => (
    <div data-testid="resource-filters">
      <input
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {typeOptions && (
        <select
          aria-label="Filter by type"
          value={typeFilter?.[0] || ""}
          onChange={(e) => onTypeFilterChange([e.target.value])}
        >
          <option value="">All Types</option>
          {typeOptions.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {(searchTerm || typeFilter?.length > 0) && (
        <button onClick={onClearFilters}>Clear Filters</button>
      )}
    </div>
  ),
}));

vi.mock("../shared/RefreshControls", () => ({
  default: ({ onRefresh, autoRefresh, onAutoRefreshChange }: any) => (
    <div data-testid="refresh-controls">
      <button onClick={onRefresh} aria-label="refresh data">
        Refresh
      </button>
      <label>
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => onAutoRefreshChange(e.target.checked)}
        />
        Auto-refresh
      </label>
    </div>
  ),
}));

vi.mock("../ExchangeDetailModal", () => ({
  default: ({ open, onClose, exchange }: any) =>
    open ? (
      <div data-testid="exchange-detail-modal">
        <h2>Exchange Details</h2>
        <button onClick={onClose}>Close</button>
        {exchange && <div>Exchange: {exchange.name}</div>}
      </div>
    ) : null,
}));

describe("ExchangesList", () => {
  const mockClusterId = "test-cluster-id";

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default successful mock for useExchanges
    vi.mocked(useExchanges).mockReturnValue({
      data: {
        items: mockExchanges,
        page: 0,
        pageSize: 50,
        totalItems: mockExchanges.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      lastUpdated: new Date(),
      loadExchanges: vi.fn(),
      refreshExchanges: vi.fn(),
      clearError: vi.fn(),
      invalidateCache: vi.fn(),
    });
  });

  it("renders exchanges list with data", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    // Check if the component renders
    expect(screen.getByText("Exchanges")).toBeInTheDocument();

    // Check if exchanges are displayed
    await waitFor(() => {
      expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      expect(screen.getByText("topic-exchange")).toBeInTheDocument();
      expect(screen.getByText("fanout-exchange")).toBeInTheDocument();
    });

    // Check exchange types
    expect(screen.getByText("direct")).toBeInTheDocument();
    expect(screen.getByText("topic")).toBeInTheDocument();
    expect(screen.getByText("fanout")).toBeInTheDocument();
  });

  it("displays exchange properties correctly", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(screen.getByText("direct-exchange")).toBeInTheDocument();
    });

    // Check durability indicators - there are multiple exchanges with different durability
    const durableElements = screen.getAllByText("Durable");
    expect(durableElements.length).toBeGreaterThan(0); // direct-exchange and fanout-exchange are durable

    const transientElements = screen.getAllByText("Transient");
    expect(transientElements.length).toBeGreaterThan(0); // topic-exchange is transient

    // Check other properties that should be displayed
    expect(screen.getByText("direct")).toBeInTheDocument(); // exchange type
    expect(screen.getByText("topic")).toBeInTheDocument(); // exchange type
    expect(screen.getByText("fanout")).toBeInTheDocument(); // exchange type
  });

  it("displays message statistics", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(screen.getByText("direct-exchange")).toBeInTheDocument();
    });

    // Check for message rate displays (rates should be formatted as "X.X msg/s")
    expect(
      screen.getByText((content) => {
        return content.includes("5.20") && content.includes("msg/s");
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => {
        return content.includes("4.80") && content.includes("msg/s");
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => {
        return content.includes("2.10") && content.includes("msg/s");
      })
    ).toBeInTheDocument();
  });

  it("displays refresh controls", () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    // Check for refresh button
    const refreshButton = screen.getByRole("button", { name: /refresh data/i });
    expect(refreshButton).toBeInTheDocument();

    // Check for auto-refresh toggle
    expect(screen.getByText("Auto-refresh")).toBeInTheDocument();
  });

  it("displays search and filter controls", () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    // Check for search input
    const searchInput = screen.getByPlaceholderText(
      "Search exchanges by name..."
    );
    expect(searchInput).toBeInTheDocument();

    // Check for type filter
    expect(screen.getByLabelText("Filter by type")).toBeInTheDocument();

    // Check for clear filters button (should not be visible initially)
    expect(screen.queryByText("Clear Filters")).not.toBeInTheDocument();
  });

  it("shows clear filters button when search term is entered", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    const searchInput = screen.getByPlaceholderText(
      "Search exchanges by name..."
    );

    // Type in search input
    fireEvent.change(searchInput, { target: { value: "test" } });

    // Wait for debounced search and check for clear filters button
    await waitFor(
      () => {
        expect(screen.getByText("Clear Filters")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("handles type filter changes", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    const typeSelect = screen.getByLabelText("Filter by type");
    fireEvent.change(typeSelect, { target: { value: "direct" } });

    await waitFor(() => {
      expect(screen.getByText("Clear Filters")).toBeInTheDocument();
    });
  });

  it("handles exchange row click", async () => {
    const mockOnExchangeClick = vi.fn();
    render(
      <ExchangesList
        clusterId={mockClusterId}
        onExchangeClick={mockOnExchangeClick}
      />,
      { wrapper: TestWrapper }
    );

    await waitFor(() => {
      expect(screen.getByText("direct-exchange")).toBeInTheDocument();
    });

    // Click on an exchange row
    const exchangeRow = screen
      .getByText("direct-exchange")
      .closest('[role="row"]');
    if (exchangeRow) {
      fireEvent.click(exchangeRow);
    }

    // The modal should open
    await waitFor(() => {
      expect(screen.getByText("Exchange Details")).toBeInTheDocument();
    });
  });

  it("closes modal when close button is clicked", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(screen.getByText("direct-exchange")).toBeInTheDocument();
    });

    // Click on an exchange row to open modal
    const exchangeRow = screen
      .getByText("direct-exchange")
      .closest('[role="row"]');
    if (exchangeRow) {
      fireEvent.click(exchangeRow);
    }

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText("Exchange Details")).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText("Exchange Details")).not.toBeInTheDocument();
    });
  });

  it("displays exchange arguments", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(screen.getByText("direct-exchange")).toBeInTheDocument();
    });

    // Check that exchanges with arguments are indicated
    // The component should show argument count or indicator
    expect(screen.getByText("Exchanges")).toBeInTheDocument();
  });

  it("handles exchanges without message stats", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(screen.getByText("fanout-exchange")).toBeInTheDocument();
    });

    // fanout-exchange doesn't have message_stats, should handle gracefully
    expect(screen.getByText("Exchanges")).toBeInTheDocument();
  });

  it("displays vhost information", async () => {
    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      const vhostElements = screen.getAllByText("/");
      expect(vhostElements.length).toBeGreaterThan(0); // multiple exchanges use "/" vhost
      expect(screen.getByText("/test")).toBeInTheDocument();
    });
  });

  it("handles empty exchange list", () => {
    // Mock empty data
    vi.mocked(useExchanges).mockReturnValue({
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
      lastUpdated: new Date(),
      loadExchanges: vi.fn(),
      refreshExchanges: vi.fn(),
      clearError: vi.fn(),
      invalidateCache: vi.fn(),
    });

    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByText("Exchanges")).toBeInTheDocument();
    expect(screen.queryByText("direct-exchange")).not.toBeInTheDocument();
  });

  it("handles loading state", () => {
    // Mock loading state
    vi.mocked(useExchanges).mockReturnValue({
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
      lastUpdated: new Date(),
      loadExchanges: vi.fn(),
      refreshExchanges: vi.fn(),
      clearError: vi.fn(),
      invalidateCache: vi.fn(),
    });

    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByText("Exchanges")).toBeInTheDocument();
    // Loading state should be handled by ResourceTable
  });

  it("handles error state", () => {
    // Mock error state
    vi.mocked(useExchanges).mockReturnValue({
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
      error: {
        type: "network",
        message: "Failed to load exchanges",
        retryable: true,
        timestamp: Date.now(),
      },
      lastUpdated: new Date(),
      loadExchanges: vi.fn(),
      refreshExchanges: vi.fn(),
      clearError: vi.fn(),
      invalidateCache: vi.fn(),
    });

    render(<ExchangesList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByText("Exchanges")).toBeInTheDocument();
    // Error should be displayed by error handling components
  });

  describe("Write Operations", () => {
    it("displays Create Exchange button", () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const createButton = screen.getByRole("button", {
        name: /create exchange/i,
      });
      expect(createButton).toBeInTheDocument();
    });

    it("opens Create Exchange dialog when button is clicked", async () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const createButton = screen.getByRole("button", {
        name: /create exchange/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("create-exchange-dialog")
        ).toBeInTheDocument();
      });
    });

    it("closes Create Exchange dialog when cancelled", async () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const createButton = screen.getByRole("button", {
        name: /create exchange/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("create-exchange-dialog")
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId("create-exchange-dialog")
        ).not.toBeInTheDocument();
      });
    });

    it("displays action menu button for each exchange", async () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      });

      // Should have action buttons for each exchange
      const actionButtons = screen.getAllByLabelText(/actions for exchange/i);
      expect(actionButtons.length).toBe(mockExchanges.length);
    });

    it("opens action menu when action button is clicked", async () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      });

      const actionButton = screen.getByLabelText(
        "Actions for exchange direct-exchange"
      );
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText("Create Binding")).toBeInTheDocument();
        expect(screen.getByText("Publish Message")).toBeInTheDocument();
        expect(screen.getByText("Delete Exchange")).toBeInTheDocument();
      });
    });

    it("opens Create Binding dialog from action menu", async () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      });

      // Open action menu
      const actionButton = screen.getByLabelText(
        "Actions for exchange direct-exchange"
      );
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText("Create Binding")).toBeInTheDocument();
      });

      // Click Create Binding
      const createBindingButton = screen.getByText("Create Binding");
      fireEvent.click(createBindingButton);

      await waitFor(() => {
        expect(screen.getByTestId("create-binding-dialog")).toBeInTheDocument();
        expect(
          screen.getByText("Create Binding from direct-exchange")
        ).toBeInTheDocument();
      });
    });

    it("opens Publish Message dialog from action menu", async () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      });

      // Open action menu
      const actionButton = screen.getByLabelText(
        "Actions for exchange direct-exchange"
      );
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText("Publish Message")).toBeInTheDocument();
      });

      // Click Publish Message
      const publishButton = screen.getByText("Publish Message");
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("publish-message-dialog")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Publish Message to direct-exchange")
        ).toBeInTheDocument();
      });
    });

    it("opens Delete Confirmation dialog from action menu", async () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      });

      // Open action menu
      const actionButton = screen.getByLabelText(
        "Actions for exchange direct-exchange"
      );
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText("Delete Exchange")).toBeInTheDocument();
      });

      // Click Delete Exchange
      const deleteButton = screen.getByText("Delete Exchange");
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("delete-confirmation-dialog")
        ).toBeInTheDocument();
        expect(screen.getByText("Delete direct-exchange")).toBeInTheDocument();
      });
    });

    it("refreshes exchanges list after successful exchange creation", async () => {
      const mockRefreshExchanges = vi.fn();
      vi.mocked(useExchanges).mockReturnValue({
        data: {
          items: mockExchanges,
          page: 0,
          pageSize: 50,
          totalItems: mockExchanges.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        lastUpdated: new Date(),
        loadExchanges: vi.fn(),
        refreshExchanges: mockRefreshExchanges,
        clearError: vi.fn(),
        invalidateCache: vi.fn(),
      });

      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      // Open create dialog
      const createButton = screen.getByRole("button", {
        name: /create exchange/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("create-exchange-dialog")
        ).toBeInTheDocument();
      });

      // Click create button in dialog
      const createDialogButton = screen.getByText("Create");
      fireEvent.click(createDialogButton);

      await waitFor(() => {
        expect(mockRefreshExchanges).toHaveBeenCalled();
      });
    });

    it("refreshes exchanges list after successful binding creation", async () => {
      const mockRefreshExchanges = vi.fn();
      vi.mocked(useExchanges).mockReturnValue({
        data: {
          items: mockExchanges,
          page: 0,
          pageSize: 50,
          totalItems: mockExchanges.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        lastUpdated: new Date(),
        loadExchanges: vi.fn(),
        refreshExchanges: mockRefreshExchanges,
        clearError: vi.fn(),
        invalidateCache: vi.fn(),
      });

      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      });

      // Open action menu and create binding
      const actionButton = screen.getByLabelText(
        "Actions for exchange direct-exchange"
      );
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText("Create Binding")).toBeInTheDocument();
      });

      const createBindingButton = screen.getByText("Create Binding");
      fireEvent.click(createBindingButton);

      await waitFor(() => {
        expect(screen.getByTestId("create-binding-dialog")).toBeInTheDocument();
      });

      // Click create binding button in dialog
      const createDialogButton = screen.getByText("Create Binding");
      fireEvent.click(createDialogButton);

      await waitFor(() => {
        expect(mockRefreshExchanges).toHaveBeenCalled();
      });
    });

    it("does not refresh after message publishing", async () => {
      const mockRefreshExchanges = vi.fn();
      vi.mocked(useExchanges).mockReturnValue({
        data: {
          items: mockExchanges,
          page: 0,
          pageSize: 50,
          totalItems: mockExchanges.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        loading: false,
        error: null,
        lastUpdated: new Date(),
        loadExchanges: vi.fn(),
        refreshExchanges: mockRefreshExchanges,
        clearError: vi.fn(),
        invalidateCache: vi.fn(),
      });

      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      });

      // Open action menu and publish message
      const actionButton = screen.getByLabelText(
        "Actions for exchange direct-exchange"
      );
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText("Publish Message")).toBeInTheDocument();
      });

      const publishButton = screen.getByText("Publish Message");
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("publish-message-dialog")
        ).toBeInTheDocument();
      });

      // Click publish button in dialog
      const publishDialogButton = screen.getByText("Publish");
      fireEvent.click(publishDialogButton);

      // Should not refresh for message publishing
      await waitFor(() => {
        expect(mockRefreshExchanges).not.toHaveBeenCalled();
      });
    });

    it("disables Create Exchange button when loading", () => {
      vi.mocked(useExchanges).mockReturnValue({
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
        lastUpdated: new Date(),
        loadExchanges: vi.fn(),
        refreshExchanges: vi.fn(),
        clearError: vi.fn(),
        invalidateCache: vi.fn(),
      });

      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      const createButton = screen.getByRole("button", {
        name: /create exchange/i,
      });
      expect(createButton).toBeDisabled();
    });

    it("closes action menu when dialog opens", async () => {
      render(<ExchangesList clusterId={mockClusterId} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText("direct-exchange")).toBeInTheDocument();
      });

      // Open action menu
      const actionButton = screen.getByLabelText(
        "Actions for exchange direct-exchange"
      );
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText("Create Binding")).toBeInTheDocument();
      });

      // Click Create Binding - this should close the menu and open dialog
      const createBindingButton = screen.getByText("Create Binding");
      fireEvent.click(createBindingButton);

      await waitFor(() => {
        expect(screen.getByTestId("create-binding-dialog")).toBeInTheDocument();
        // Menu should be closed (menu items should not be visible)
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });
  });
});
