import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ConnectionsList from "../ConnectionsList";
import { RabbitMQConnection } from "../../../types/rabbitmq";

// Mock MUI DataGrid
vi.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows, columns, onRowClick }: any) => (
    <div data-testid="data-grid">
      {rows.map((row: any, index: number) => (
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
  GridColDef: {},
  GridRowParams: {},
  GridPaginationModel: {},
  GridSortModel: {},
  GridFilterModel: {},
  GridToolbar: () => <div>Toolbar</div>,
}));

// Mock shared components
vi.mock("../shared/ResourceTable", () => ({
  default: ({ data, columns, onRowClick }: any) => (
    <div data-testid="resource-table">
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
  }: any) => (
    <div data-testid="resource-filters">
      <input
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {searchTerm && <button onClick={onClearFilters}>Clear Filters</button>}
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

vi.mock("../ConnectionDetailModal", () => ({
  default: ({ open, onClose, connection }: any) =>
    open ? (
      <div data-testid="connection-detail-modal">
        <h2>Connection Details</h2>
        <button onClick={onClose}>Close</button>
        {connection && <div>Connection: {connection.name}</div>}
      </div>
    ) : null,
}));

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

// Mock the hooks
vi.mock("../../../hooks/useConnections", () => ({
  useConnections: vi.fn(() => ({
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
  })),
}));

// Mock the API
vi.mock("../../../services/api/rabbitmqResourcesApi", () => ({
  rabbitmqResourcesApi: {
    getConnections: vi.fn(),
  },
}));

const mockConnections: RabbitMQConnection[] = [
  {
    name: "connection-1",
    state: "running",
    channels: 2,
    client_properties: {
      connection_name: "Test Connection 1",
      platform: "Java",
      product: "RabbitMQ Java Client",
      version: "5.16.0",
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
    connected_at: Date.now() - 3600000, // 1 hour ago
  },
  {
    name: "connection-2",
    state: "blocked",
    channels: 1,
    client_properties: {
      connection_name: "Test Connection 2",
      platform: "Python",
      product: "Pika",
      version: "1.2.0",
    },
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
    connected_at: Date.now() - 1800000, // 30 minutes ago
  },
];

describe("ConnectionsList", () => {
  const mockClusterId = "test-cluster-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders connections list with data", async () => {
    render(<ConnectionsList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    // Check if the component renders
    expect(screen.getByText("Connections")).toBeInTheDocument();

    // Check if connections are displayed
    await waitFor(() => {
      expect(screen.getByText("connection-1")).toBeInTheDocument();
      expect(screen.getByText("connection-2")).toBeInTheDocument();
    });

    // Check connection states
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByText("blocked")).toBeInTheDocument();

    // Check client info
    expect(screen.getByText("Test Connection 1")).toBeInTheDocument();
    expect(screen.getByText("Test Connection 2")).toBeInTheDocument();
  });

  it("displays refresh controls", () => {
    render(<ConnectionsList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    // Check for refresh button
    const refreshButton = screen.getByRole("button", { name: /refresh data/i });
    expect(refreshButton).toBeInTheDocument();

    // Check for auto-refresh toggle
    expect(screen.getByText("Auto-refresh")).toBeInTheDocument();
  });

  it("displays search and filter controls", () => {
    render(<ConnectionsList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    // Check for search input
    const searchInput = screen.getByPlaceholderText(
      "Search connections by name..."
    );
    expect(searchInput).toBeInTheDocument();

    // Check for clear filters button (should not be visible initially)
    expect(screen.queryByText("Clear Filters")).not.toBeInTheDocument();
  });

  it("shows clear filters button when search term is entered", async () => {
    render(<ConnectionsList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    const searchInput = screen.getByPlaceholderText(
      "Search connections by name..."
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

  it("handles connection row click", async () => {
    const mockOnConnectionClick = vi.fn();
    render(
      <ConnectionsList
        clusterId={mockClusterId}
        onConnectionClick={mockOnConnectionClick}
      />,
      { wrapper: TestWrapper }
    );

    await waitFor(() => {
      expect(screen.getByText("connection-1")).toBeInTheDocument();
    });

    // Click on a connection row
    const connectionRow = screen
      .getByText("connection-1")
      .closest('[role="row"]');
    if (connectionRow) {
      fireEvent.click(connectionRow);
    }

    // The modal should open (we can check for modal elements)
    await waitFor(() => {
      expect(screen.getByText("Connection Details")).toBeInTheDocument();
    });
  });

  it("displays connection statistics correctly", async () => {
    render(<ConnectionsList clusterId={mockClusterId} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      // Check for formatted bytes display in the data grid cells
      const bytesReceivedElements = screen.getAllByText("1000 KB");
      const bytesSentElements = screen.getAllByText("500 KB");

      // Should have at least one element for each
      expect(bytesReceivedElements.length).toBeGreaterThan(0);
      expect(bytesSentElements.length).toBeGreaterThan(0);
    });
  });
});
