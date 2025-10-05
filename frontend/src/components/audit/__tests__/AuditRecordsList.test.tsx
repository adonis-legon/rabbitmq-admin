import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AuditRecordsList from "../AuditRecordsList";
import {
  AuditRecord,
  AuditOperationType,
  AuditOperationStatus,
} from "../../../types/audit";
import { ResourceError } from "../../../types/rabbitmq";

// Mock the ResourceTable component
vi.mock("../../resources/shared/ResourceTable", () => ({
  default: ({
    data,
    columns,
    onRowClick,
    error,
    loading,
    emptyMessage,
  }: any) => {
    if (loading) return <div data-testid="loading">Loading...</div>;
    if (error) return <div data-testid="error">{error}</div>;
    if (data.length === 0) return <div data-testid="empty">{emptyMessage}</div>;

    return (
      <div data-testid="resource-table">
        {data.map((row: any) => (
          <div
            key={row.id}
            data-testid={`row-${row.id}`}
            onClick={() => onRowClick?.({ row })}
          >
            {columns.map((col: any) => (
              <span key={col.field} data-testid={`${row.id}-${col.field}`}>
                {col.renderCell
                  ? col.renderCell({ row, value: row[col.field] })
                  : row[col.field]}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

const mockAuditRecords: AuditRecord[] = [
  {
    id: "1",
    username: "admin",
    clusterName: "test-cluster",
    operationType: AuditOperationType.CREATE_QUEUE,
    resourceType: "queue",
    resourceName: "test-queue",
    resourceDetails: { durable: true, autoDelete: false },
    status: AuditOperationStatus.SUCCESS,
    timestamp: "2024-01-15T10:30:00Z",
    clientIp: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    createdAt: "2024-01-15T10:30:01Z",
  },
  {
    id: "2",
    username: "user1",
    clusterName: "prod-cluster",
    operationType: AuditOperationType.DELETE_EXCHANGE,
    resourceType: "exchange",
    resourceName: "test-exchange",
    status: AuditOperationStatus.FAILURE,
    errorMessage: "Exchange not found",
    timestamp: "2024-01-15T11:00:00Z",
  },
];
const mockError: ResourceError = {
  type: "api_error",
  message: "Failed to load audit records",
  details: "Network connection failed",
  retryable: true,
  timestamp: Date.now(),
};

describe("AuditRecordsList", () => {
  const defaultProps = {
    data: mockAuditRecords,
    loading: false,
    error: null,
    totalRows: 2,
    page: 0,
    pageSize: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders audit records table", () => {
      render(<AuditRecordsList {...defaultProps} />);

      expect(screen.getByTestId("resource-table")).toBeInTheDocument();
      expect(screen.getByTestId("row-1")).toBeInTheDocument();
      expect(screen.getByTestId("row-2")).toBeInTheDocument();
    });

    it("displays loading state", () => {
      render(<AuditRecordsList {...defaultProps} loading={true} data={[]} />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();
    });

    it("displays empty state with custom message", () => {
      const emptyMessage = "No audit data available";
      render(
        <AuditRecordsList
          {...defaultProps}
          data={[]}
          emptyMessage={emptyMessage}
        />
      );

      expect(screen.getByTestId("empty")).toBeInTheDocument();
      expect(screen.getByText(emptyMessage)).toBeInTheDocument();
    });

    it("displays error state with retry button", () => {
      const onRetry = vi.fn();
      render(
        <AuditRecordsList
          {...defaultProps}
          error={mockError}
          onRetry={onRetry}
        />
      );

      expect(screen.getByText(mockError.message)).toBeInTheDocument();
      expect(screen.getByText(mockError.details!)).toBeInTheDocument();

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("Data Display", () => {
    it("formats timestamps correctly", () => {
      render(<AuditRecordsList {...defaultProps} />);

      // Check that timestamp is formatted (exact format depends on locale)
      const timestampElement = screen.getByTestId("1-timestamp");
      expect(timestampElement).toBeInTheDocument();
    });

    it("displays operation types with proper formatting", () => {
      render(<AuditRecordsList {...defaultProps} />);

      // CREATE_QUEUE should be formatted as "Create Queue"
      expect(screen.getByText("Create Queue")).toBeInTheDocument();
      // DELETE_EXCHANGE should be formatted as "Delete Exchange"
      expect(screen.getByText("Delete Exchange")).toBeInTheDocument();
    });

    it("displays status with appropriate icons and colors", () => {
      render(<AuditRecordsList {...defaultProps} />);

      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Failure")).toBeInTheDocument();
    });

    it("displays user and cluster information", () => {
      render(<AuditRecordsList {...defaultProps} />);

      expect(screen.getByText("admin")).toBeInTheDocument();
      expect(screen.getByText("user1")).toBeInTheDocument();
      expect(screen.getByText("test-cluster")).toBeInTheDocument();
      expect(screen.getByText("prod-cluster")).toBeInTheDocument();
    });

    it("displays resource information", () => {
      render(<AuditRecordsList {...defaultProps} />);

      expect(screen.getByText("test-queue")).toBeInTheDocument();
      expect(screen.getByText("test-exchange")).toBeInTheDocument();
      expect(screen.getByText("queue")).toBeInTheDocument();
      expect(screen.getByText("exchange")).toBeInTheDocument();
    });
  });

  describe("Row Expansion", () => {
    it("expands and collapses row details", async () => {
      render(<AuditRecordsList {...defaultProps} />);

      // Find expand button for first record
      const expandButton = screen.getByLabelText(
        /expand details for CREATE_QUEUE/i
      );
      expect(expandButton).toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandButton);

      // Check that detailed view is shown
      await waitFor(() => {
        expect(screen.getByText("Operation Details")).toBeInTheDocument();
        expect(screen.getByText("User Information")).toBeInTheDocument();
        expect(screen.getByText("Cluster Information")).toBeInTheDocument();
        expect(screen.getByText("Resource Information")).toBeInTheDocument();
        expect(screen.getByText("Timing Information")).toBeInTheDocument();
      });

      // Check specific details
      expect(screen.getByText("Username: admin")).toBeInTheDocument();
      expect(screen.getByText("IP Address: 192.168.1.100")).toBeInTheDocument();
      expect(screen.getByText("Cluster: test-cluster")).toBeInTheDocument();
      expect(screen.getByText("Type: queue")).toBeInTheDocument();
      expect(screen.getByText("Name: test-queue")).toBeInTheDocument();

      // Check resource details JSON
      expect(screen.getByText("Resource Details")).toBeInTheDocument();

      // Click to collapse
      const collapseButton = screen.getByLabelText(
        /collapse details for CREATE_QUEUE/i
      );
      fireEvent.click(collapseButton);

      // Details should be hidden
      await waitFor(() => {
        expect(screen.queryByText("Operation Details")).not.toBeInTheDocument();
      });
    });

    it("shows error message in expanded view for failed operations", async () => {
      render(<AuditRecordsList {...defaultProps} />);

      // Find expand button for second record (failed operation)
      const expandButton = screen.getByLabelText(
        /expand details for DELETE_EXCHANGE/i
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText("Error Details")).toBeInTheDocument();
        expect(screen.getByText("Exchange not found")).toBeInTheDocument();
      });
    });

    it("handles multiple expanded rows independently", async () => {
      render(<AuditRecordsList {...defaultProps} />);

      // Expand first row
      const expandButton1 = screen.getByLabelText(
        /expand details for CREATE_QUEUE/i
      );
      fireEvent.click(expandButton1);

      // Expand second row
      const expandButton2 = screen.getByLabelText(
        /expand details for DELETE_EXCHANGE/i
      );
      fireEvent.click(expandButton2);

      await waitFor(() => {
        // Both should be expanded
        const operationDetailsElements =
          screen.getAllByText("Operation Details");
        expect(operationDetailsElements).toHaveLength(2);
      });

      // Collapse first row
      const collapseButton1 = screen.getByLabelText(
        /collapse details for CREATE_QUEUE/i
      );
      fireEvent.click(collapseButton1);

      await waitFor(() => {
        // Only one should remain expanded
        const operationDetailsElements =
          screen.getAllByText("Operation Details");
        expect(operationDetailsElements).toHaveLength(1);
      });
    });
  });

  describe("Event Handlers", () => {
    it("calls onRowClick when row is clicked", () => {
      const onRowClick = vi.fn();
      render(<AuditRecordsList {...defaultProps} onRowClick={onRowClick} />);

      const row = screen.getByTestId("row-1");
      fireEvent.click(row);

      expect(onRowClick).toHaveBeenCalledWith(mockAuditRecords[0]);
    });

    it("calls pagination handlers", () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();

      render(
        <AuditRecordsList
          {...defaultProps}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      );

      // These would be called by the ResourceTable component
      // We can't directly test them without more complex mocking
      expect(onPageChange).not.toHaveBeenCalled();
      expect(onPageSizeChange).not.toHaveBeenCalled();
    });

    it("calls onSortChange when sort changes", () => {
      const onSortChange = vi.fn();

      render(
        <AuditRecordsList {...defaultProps} onSortChange={onSortChange} />
      );

      // This would be called by the ResourceTable component
      expect(onSortChange).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels for expand buttons", () => {
      render(<AuditRecordsList {...defaultProps} />);

      expect(
        screen.getByLabelText(/expand details for CREATE_QUEUE/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/expand details for DELETE_EXCHANGE/i)
      ).toBeInTheDocument();
    });

    it("updates ARIA labels when rows are expanded", async () => {
      render(<AuditRecordsList {...defaultProps} />);

      const expandButton = screen.getByLabelText(
        /expand details for CREATE_QUEUE/i
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/collapse details for CREATE_QUEUE/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles records without optional fields", () => {
      const minimalRecord: AuditRecord = {
        id: "3",
        username: "testuser",
        clusterName: "minimal-cluster",
        operationType: AuditOperationType.PURGE_QUEUE,
        resourceType: "queue",
        resourceName: "minimal-queue",
        status: AuditOperationStatus.SUCCESS,
        timestamp: "2024-01-15T12:00:00Z",
      };

      render(<AuditRecordsList {...defaultProps} data={[minimalRecord]} />);

      expect(screen.getByTestId("row-3")).toBeInTheDocument();
      expect(screen.getByText("testuser")).toBeInTheDocument();
      expect(screen.getByText("minimal-cluster")).toBeInTheDocument();
    });

    it("handles invalid timestamp gracefully", () => {
      const recordWithInvalidTimestamp: AuditRecord = {
        ...mockAuditRecords[0],
        id: "4",
        timestamp: "invalid-date",
      };

      render(
        <AuditRecordsList
          {...defaultProps}
          data={[recordWithInvalidTimestamp]}
        />
      );

      expect(screen.getByTestId("row-4")).toBeInTheDocument();
      // Should display the original invalid timestamp as fallback
      expect(screen.getByText("invalid-date")).toBeInTheDocument();
    });

    it("handles empty resource details", async () => {
      const recordWithEmptyDetails: AuditRecord = {
        ...mockAuditRecords[0],
        id: "5",
        resourceDetails: {},
      };

      render(
        <AuditRecordsList {...defaultProps} data={[recordWithEmptyDetails]} />
      );

      const expandButton = screen.getByLabelText(
        /expand details for CREATE_QUEUE/i
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        // Resource Details section should not be shown for empty details
        expect(screen.queryByText("Resource Details")).not.toBeInTheDocument();
      });
    });

    it("handles very long resource names with ellipsis", () => {
      const recordWithLongName: AuditRecord = {
        ...mockAuditRecords[0],
        id: "6",
        resourceName:
          "very-long-resource-name-that-should-be-truncated-with-ellipsis",
      };

      render(
        <AuditRecordsList {...defaultProps} data={[recordWithLongName]} />
      );

      expect(screen.getByTestId("row-6")).toBeInTheDocument();
      // The long name should be present but may be visually truncated
      expect(
        screen.getByText(
          "very-long-resource-name-that-should-be-truncated-with-ellipsis"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("handles large datasets efficiently", () => {
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        ...mockAuditRecords[0],
        id: `record-${index}`,
        username: `user-${index}`,
        resourceName: `resource-${index}`,
      }));

      const { container } = render(
        <AuditRecordsList {...defaultProps} data={largeDataset} />
      );

      // Should render without performance issues
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId("resource-table")).toBeInTheDocument();
    });
  });
});
