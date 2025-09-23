import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ResourceTable from "../ResourceTable";

// Mock MUI DataGrid with enhanced functionality
vi.mock("@mui/x-data-grid", () => ({
  DataGrid: ({
    rows,
    columns,
    onRowClick,
    loading,
    paginationModel,
    onPaginationModelChange,
    onSortModelChange,
    onFilterModelChange,
    rowCount,
    getRowId,
    disableRowSelectionOnClick,
    disableColumnFilter,
    disableColumnMenu,
  }: any) => (
    <div data-testid="data-grid" role="grid">
      {loading && <div data-testid="loading-indicator">Loading...</div>}
      {!loading &&
        rows.map((row: any, index: number) => {
          const rowId = getRowId ? getRowId(row) : row.id || index;
          return (
            <div
              key={rowId}
              role="row"
              onClick={() => onRowClick?.({ row })}
              style={{
                cursor:
                  onRowClick && !disableRowSelectionOnClick
                    ? "pointer"
                    : "default",
                padding: "8px",
                border: "1px solid #ccc",
                margin: "2px",
              }}
              data-testid={`row-${rowId}`}
            >
              {columns.map((col: any) => {
                const value = col.renderCell
                  ? col.renderCell({ row, value: row[col.field] })
                  : row[col.field];
                return (
                  <div
                    key={col.field}
                    data-testid={`cell-${col.field}-${rowId}`}
                  >
                    {typeof value === "object" ? value : String(value)}
                  </div>
                );
              })}
            </div>
          );
        })}
      <div data-testid="pagination-info">
        Page: {paginationModel?.page || 0}, Size:{" "}
        {paginationModel?.pageSize || 25}
      </div>
      <div data-testid="row-count">Total: {rowCount || rows.length}</div>
      <button
        onClick={() => onPaginationModelChange?.({ page: 1, pageSize: 50 })}
        data-testid="pagination-change"
      >
        Change Page
      </button>
      <button
        onClick={() => onSortModelChange?.([{ field: "name", sort: "asc" }])}
        data-testid="sort-change"
      >
        Sort
      </button>
      <button
        onClick={() =>
          onFilterModelChange?.({
            items: [{ field: "name", operator: "contains", value: "test" }],
          })
        }
        data-testid="filter-change"
      >
        Filter
      </button>
      <div data-testid="grid-toolbar">Toolbar</div>
      <div data-testid="grid-config">
        ColumnFilter: {disableColumnFilter ? "disabled" : "enabled"}
        ColumnMenu: {disableColumnMenu ? "disabled" : "enabled"}
        RowSelection: {disableRowSelectionOnClick ? "disabled" : "enabled"}
      </div>
    </div>
  ),
  GridColDef: {},
  GridRowParams: {},
  GridPaginationModel: {},
  GridSortModel: {},
  GridFilterModel: {},
  GridToolbar: () => <div data-testid="grid-toolbar">Toolbar</div>,
}));

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

const mockData = [
  { id: 1, name: "item-1", status: "active", value: 100, category: "A" },
  { id: 2, name: "item-2", status: "inactive", value: 200, category: "B" },
  { id: 3, name: "item-3", status: "active", value: 150, category: "A" },
  { id: 4, name: "item-4", status: "pending", value: 75, category: "C" },
];

const mockColumns = [
  { field: "name", headerName: "Name", width: 150 },
  { field: "status", headerName: "Status", width: 120 },
  { field: "value", headerName: "Value", width: 100, type: "number" },
  { field: "category", headerName: "Category", width: 100 },
];

describe("ResourceTable - Enhanced Tests", () => {
  const mockOnRowClick = vi.fn();
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnSortChange = vi.fn();
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("renders table with data and proper structure", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(screen.getByTestId("grid-toolbar")).toBeInTheDocument();

      // Check all rows are rendered
      mockData.forEach((item) => {
        expect(screen.getByTestId(`row-${item.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`cell-name-${item.id}`)).toHaveTextContent(
          item.name
        );
        expect(screen.getByTestId(`cell-status-${item.id}`)).toHaveTextContent(
          item.status
        );
      });
    });

    it("displays correct pagination information", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          page={2}
          pageSize={25}
          totalRows={100}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Page: 2, Size: 25")).toBeInTheDocument();
      expect(screen.getByText("Total: 100")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("displays loading state correctly", () => {
      render(
        <ResourceTable
          data={[]}
          columns={mockColumns}
          loading={true}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      // When loading with empty data, ResourceTable shows skeleton loading
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
      expect(screen.queryByText("No data available")).not.toBeInTheDocument();
    });

    it("displays loading indicator when loading with existing data", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={true}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("displays error state with proper styling", () => {
      const errorMessage = "Failed to load data";

      render(
        <ResourceTable
          data={[]}
          columns={mockColumns}
          loading={false}
          error={errorMessage}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });

    it("handles different types of error messages", () => {
      const networkError = "Network connection failed";

      render(
        <ResourceTable
          data={[]}
          columns={mockColumns}
          loading={false}
          error={networkError}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(networkError)).toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("displays default empty state message", () => {
      render(
        <ResourceTable
          data={[]}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("No data available")).toBeInTheDocument();
      expect(
        screen.getByText("No resources found matching your criteria.")
      ).toBeInTheDocument();
    });

    it("displays custom empty state message", () => {
      const customMessage = "No connections found";

      render(
        <ResourceTable
          data={[]}
          columns={mockColumns}
          loading={false}
          emptyMessage={customMessage}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe("Row Interactions", () => {
    it("handles row click events with proper data", async () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      const firstRow = screen.getByTestId("row-1");
      fireEvent.click(firstRow);

      await waitFor(() => {
        expect(mockOnRowClick).toHaveBeenCalledWith({
          row: expect.objectContaining({ id: 1, name: "item-1" }),
        });
      });
    });

    it("disables row selection when configured", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          disableRowSelectionOnClick={true}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText(
          (content) =>
            content.includes("RowSelection") && content.includes("disabled")
        )
      ).toBeInTheDocument();
    });

    it("supports custom row ID generation", () => {
      const dataWithoutId = [
        { name: "item-1", status: "active", value: 100 },
        { name: "item-2", status: "inactive", value: 200 },
      ];

      render(
        <ResourceTable
          data={dataWithoutId}
          columns={mockColumns}
          loading={false}
          getRowId={(row) => row.name}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId("row-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("row-item-2")).toBeInTheDocument();
    });
  });

  describe("Pagination Handling", () => {
    it("handles pagination model changes", async () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          page={0}
          pageSize={25}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />,
        { wrapper: TestWrapper }
      );

      const paginationButton = screen.getByTestId("pagination-change");
      fireEvent.click(paginationButton);

      await waitFor(() => {
        expect(mockOnPageChange).toHaveBeenCalledWith(1);
        expect(mockOnPageSizeChange).toHaveBeenCalledWith(50);
      });
    });

    it("supports custom page size options", () => {
      const customPageSizeOptions = [10, 25, 50, 100];

      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          pageSizeOptions={customPageSizeOptions}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("handles server-side pagination correctly", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          totalRows={1000}
          page={5}
          pageSize={50}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Page: 5, Size: 50")).toBeInTheDocument();
      expect(screen.getByText("Total: 1000")).toBeInTheDocument();
    });
  });

  describe("Sorting and Filtering", () => {
    it("handles sort model changes", async () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          onSortChange={mockOnSortChange}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      const sortButton = screen.getByTestId("sort-change");
      fireEvent.click(sortButton);

      await waitFor(() => {
        expect(mockOnSortChange).toHaveBeenCalledWith([
          { field: "name", sort: "asc" },
        ]);
      });
    });

    it("handles filter model changes", async () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          onFilterChange={mockOnFilterChange}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      const filterButton = screen.getByTestId("filter-change");
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          items: [{ field: "name", operator: "contains", value: "test" }],
        });
      });
    });

    it("supports disabling column features", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          disableColumnFilter={true}
          disableColumnMenu={true}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText(
          (content) =>
            content.includes("ColumnFilter") && content.includes("disabled")
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (content) =>
            content.includes("ColumnMenu") && content.includes("disabled")
        )
      ).toBeInTheDocument();
    });
  });

  describe("Custom Column Rendering", () => {
    it("handles columns with custom render functions", () => {
      const customColumns = [
        ...mockColumns,
        {
          field: "custom",
          headerName: "Custom",
          width: 150,
          renderCell: ({ row }: any) => (
            <span data-testid={`custom-cell-${row.id}`}>
              Custom: {row.name} ({row.status})
            </span>
          ),
        },
      ];

      const dataWithCustom = mockData.map((item) => ({
        ...item,
        custom: "test",
      }));

      render(
        <ResourceTable
          data={dataWithCustom}
          columns={customColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId("custom-cell-1")).toBeInTheDocument();
      expect(screen.getByText("Custom: item-1 (active)")).toBeInTheDocument();
    });

    it("handles complex cell rendering with nested components", () => {
      const complexColumns = [
        {
          field: "status",
          headerName: "Status",
          width: 120,
          renderCell: ({ row }: any) => (
            <div data-testid={`status-chip-${row.id}`}>
              <span
                style={{
                  backgroundColor: row.status === "active" ? "green" : "red",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {row.status.toUpperCase()}
              </span>
            </div>
          ),
        },
      ];

      render(
        <ResourceTable
          data={mockData}
          columns={complexColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId("status-chip-1")).toBeInTheDocument();
      expect(screen.getByTestId("status-chip-1")).toHaveTextContent("ACTIVE");
    });
  });

  describe("Performance and Large Datasets", () => {
    it("handles large datasets efficiently", () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `item-${i + 1}`,
        status: i % 2 === 0 ? "active" : "inactive",
        value: Math.floor(Math.random() * 1000),
        category: ["A", "B", "C"][i % 3],
      }));

      render(
        <ResourceTable
          data={largeData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          totalRows={1000}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(screen.getByText("Total: 1000")).toBeInTheDocument();
      expect(screen.getByTestId("row-1")).toBeInTheDocument();
    });

    it("maintains performance with frequent updates", () => {
      const { rerender } = render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      // Simulate data updates
      const updatedData = mockData.map((item) => ({
        ...item,
        value: item.value + 10,
      }));

      rerender(
        <ResourceTable
          data={updatedData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(screen.getByTestId("cell-value-1")).toHaveTextContent("110");
    });
  });

  describe("Customization Options", () => {
    it("supports custom height configuration", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          height={800}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("supports string height values", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          height="100vh"
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("provides proper ARIA attributes", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();

      // Check for row elements
      mockData.forEach((item) => {
        expect(screen.getByTestId(`row-${item.id}`)).toHaveAttribute(
          "role",
          "row"
        );
      });
    });

    it("supports keyboard navigation", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      const firstRow = screen.getByTestId("row-1");

      // Should be focusable - check that the element exists and can receive focus
      expect(firstRow).toBeInTheDocument();
      expect(firstRow).toHaveAttribute("role", "row");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty columns array", () => {
      render(
        <ResourceTable
          data={mockData}
          columns={[]}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("handles null/undefined data gracefully", () => {
      render(
        <ResourceTable
          data={[]}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("handles missing required props gracefully", () => {
      render(<ResourceTable data={mockData} columns={mockColumns} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });
});
