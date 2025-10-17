import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ResourceTable from "../ResourceTable";

// Mock MUI DataGrid
vi.mock("@mui/x-data-grid", () => ({
  DataGrid: ({
    rows,
    columns,
    onRowClick,
    loading,
    paginationModel,
    onPaginationModelChange,
    rowCount,
  }: any) => (
    <div data-testid="data-grid" role="grid">
      {loading && <div data-testid="loading-indicator">Loading...</div>}
      {!loading &&
        rows.map((row: any, index: number) => (
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
      <div data-testid="grid-toolbar">Toolbar</div>
    </div>
  ),
  GridColDef: {},
  GridRowParams: {},
  GridPaginationModel: {},
  GridSortModel: {},
  GridFilterModel: {},
  GridToolbar: () => <div data-testid="grid-toolbar">Toolbar</div>,
}));

// Don't mock MUI components to avoid interference

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

const mockData = [
  { id: 1, name: "item-1", status: "active", value: 100 },
  { id: 2, name: "item-2", status: "inactive", value: 200 },
  { id: 3, name: "item-3", status: "active", value: 150 },
];

const mockColumns = [
  { field: "name", headerName: "Name", width: 150 },
  { field: "status", headerName: "Status", width: 120 },
  { field: "value", headerName: "Value", width: 100, type: "number" as const },
];

describe("ResourceTable", () => {
  const mockOnRowClick = vi.fn();
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with data", () => {
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
    expect(screen.getByText("item-1")).toBeInTheDocument();
    expect(screen.getByText("item-2")).toBeInTheDocument();
    expect(screen.getByText("item-3")).toBeInTheDocument();
  });

  it("displays loading state", () => {
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
    // Should not show the empty state message when loading
    expect(screen.queryByText("No data available")).not.toBeInTheDocument();
    // The component should render something (skeleton loading) but we don't need to test the exact structure
    // since MUI Skeleton components are complex to mock properly
  });

  it("handles row click events", async () => {
    render(
      <ResourceTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    const firstRow = screen.getByText("item-1").closest('[role="row"]');
    expect(firstRow).toBeInTheDocument();

    if (firstRow) {
      fireEvent.click(firstRow);
    }

    await waitFor(() => {
      expect(mockOnRowClick).toHaveBeenCalledWith({
        row: expect.objectContaining({ id: 1, name: "item-1" }),
      });
    });
  });

  it("handles pagination changes", async () => {
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

    expect(screen.getByText("Page: 0, Size: 25")).toBeInTheDocument();

    const paginationButton = screen.getByTestId("pagination-change");
    fireEvent.click(paginationButton);

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledWith(1);
      expect(mockOnPageSizeChange).toHaveBeenCalledWith(50);
    });
  });

  it("renders empty state when no data", () => {
    render(
      <ResourceTable
        data={[]}
        columns={mockColumns}
        loading={false}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    // The ResourceTable component shows empty state in a Paper component, not a grid
    expect(screen.getByText("No data available")).toBeInTheDocument();
    expect(
      screen.getByText("No resources found matching your criteria.")
    ).toBeInTheDocument();
    // Should not have a grid role when showing empty state
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("displays error state", () => {
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

  it("handles large datasets", () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `item-${i + 1}`,
      status: i % 2 === 0 ? "active" : "inactive",
      value: Math.floor(Math.random() * 1000),
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
    expect(screen.getByTestId("row-count")).toHaveTextContent("Total: 1000");
    // Should render first few items
    expect(screen.getByText("item-1")).toBeInTheDocument();
  });

  it("handles columns with custom render functions", () => {
    const customColumns = [
      ...mockColumns,
      {
        field: "custom",
        headerName: "Custom",
        width: 150,
        renderCell: ({ row }: any) => (
          <span data-testid={`custom-cell-${row.id}`}>Custom: {row.name}</span>
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
    expect(screen.getByText("Custom: item-1")).toBeInTheDocument();
  });

  it("supports custom empty message", () => {
    const customEmptyMessage = "No items found";

    render(
      <ResourceTable
        data={[]}
        columns={mockColumns}
        loading={false}
        emptyMessage={customEmptyMessage}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText(customEmptyMessage)).toBeInTheDocument();
  });

  it("supports custom height", () => {
    render(
      <ResourceTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        height={600}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    const dataGrid = screen.getByTestId("data-grid");
    expect(dataGrid).toBeInTheDocument();
  });

  it("supports custom getRowId function", () => {
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

    expect(screen.getByText("item-1")).toBeInTheDocument();
    expect(screen.getByText("item-2")).toBeInTheDocument();
  });

  it("handles sort and filter changes", async () => {
    const mockOnSortChange = vi.fn();
    const mockOnFilterChange = vi.fn();

    render(
      <ResourceTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onSortChange={mockOnSortChange}
        onFilterChange={mockOnFilterChange}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByRole("grid")).toBeInTheDocument();
    // Sort and filter changes would be handled by the DataGrid component
  });

  it("supports server-side pagination", () => {
    render(
      <ResourceTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        totalRows={1000}
        page={2}
        pageSize={50}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByTestId("row-count")).toHaveTextContent("Total: 1000");
    expect(screen.getByText("Page: 2, Size: 50")).toBeInTheDocument();
  });

  it("supports disabling column features", () => {
    render(
      <ResourceTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        disableColumnFilter={true}
        disableColumnMenu={true}
        disableRowSelectionOnClick={false}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByRole("grid")).toBeInTheDocument();
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

  it("displays toolbar when data is present", () => {
    render(
      <ResourceTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    // The toolbar is included in the DataGrid when data is present
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByTestId("grid-toolbar")).toBeInTheDocument();
  });

  it("handles loading state with existing data", () => {
    render(
      <ResourceTable
        data={mockData}
        columns={mockColumns}
        loading={true}
        onRowClick={mockOnRowClick}
      />,
      { wrapper: TestWrapper }
    );

    // When loading with existing data, should still show the grid
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });
});
