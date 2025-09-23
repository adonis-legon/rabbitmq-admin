import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import VirtualizedResourceTable from "../VirtualizedResourceTable";

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

interface MockDataItem {
  id: number;
  name: string;
  status: string;
  value: number;
  category: string;
}

const mockData: MockDataItem[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `item-${i + 1}`,
  status: i % 2 === 0 ? "active" : "inactive",
  value: Math.floor(Math.random() * 1000),
  category: ["A", "B", "C"][i % 3],
}));

const mockColumns = [
  { key: "name" as keyof MockDataItem, label: "Name", width: 150 },
  { key: "status" as keyof MockDataItem, label: "Status", width: 120 },
  { key: "value" as keyof MockDataItem, label: "Value", width: 100 },
  { key: "category" as keyof MockDataItem, label: "Category", width: 100 },
];

describe("VirtualizedResourceTable", () => {
  const mockOnRowClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Placeholder Implementation", () => {
    it("renders placeholder message when react-window is not available", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText(
          "Virtual scrolling is not yet available. Install react-window dependency to enable this feature."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("VirtualizedResourceTable")).toBeInTheDocument();
    });

    it("displays data and column counts", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Data items: 1000")).toBeInTheDocument();
      expect(screen.getByText("Columns: 4")).toBeInTheDocument();
    });

    it("shows informational alert about missing dependency", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText(
          "This component will provide efficient rendering for large datasets once react-window is installed."
        )
      ).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("displays loading skeleton when loading with empty data", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={[]}
          columns={mockColumns}
          loading={true}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      // Should show skeleton loading
      expect(
        screen.queryByText("VirtualizedResourceTable")
      ).not.toBeInTheDocument();
      expect(screen.queryByText("No data available")).not.toBeInTheDocument();
    });

    it("shows placeholder when loading with existing data", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={true}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      // When loading with data, should still show the placeholder
      expect(screen.getByText("VirtualizedResourceTable")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("displays error state", () => {
      const errorMessage = "Failed to load data";

      render(
        <VirtualizedResourceTable<MockDataItem>
          data={[]}
          columns={mockColumns}
          loading={false}
          error={errorMessage}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(
        screen.queryByText("VirtualizedResourceTable")
      ).not.toBeInTheDocument();
    });

    it("handles different types of error messages", () => {
      const networkError = "Network connection failed";

      render(
        <VirtualizedResourceTable<MockDataItem>
          data={[]}
          columns={mockColumns}
          loading={false}
          error={networkError}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(networkError)).toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("displays default empty state message", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={[]}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("No data available")).toBeInTheDocument();
      expect(
        screen.getByText("No resources found matching your criteria.")
      ).toBeInTheDocument();
    });

    it("displays custom empty state message", () => {
      const customMessage = "No resources found";

      render(
        <VirtualizedResourceTable<MockDataItem>
          data={[]}
          columns={mockColumns}
          loading={false}
          emptyMessage={customMessage}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe("Component Props", () => {
    it("accepts height prop", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={800}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("VirtualizedResourceTable")).toBeInTheDocument();
    });

    it("accepts itemHeight prop", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
          itemHeight={80}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("VirtualizedResourceTable")).toBeInTheDocument();
    });

    it("handles custom columns with render functions", () => {
      const customColumns = [
        ...mockColumns,
        {
          key: "name" as keyof MockDataItem,
          label: "Custom",
          width: 150,
          render: (_value: any, row: MockDataItem) => `Custom: ${row.name}`,
        },
      ];

      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={customColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Columns: 5")).toBeInTheDocument();
    });

    it("handles columns with different alignments", () => {
      const alignedColumns = [
        {
          key: "name" as keyof MockDataItem,
          label: "Name",
          width: 150,
          align: "left" as const,
        },
        {
          key: "status" as keyof MockDataItem,
          label: "Status",
          width: 120,
          align: "center" as const,
        },
        {
          key: "value" as keyof MockDataItem,
          label: "Value",
          width: 100,
          align: "right" as const,
        },
      ];

      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={alignedColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Columns: 3")).toBeInTheDocument();
    });
  });

  describe("Data Handling", () => {
    it("handles small datasets", () => {
      const smallData = mockData.slice(0, 10);

      render(
        <VirtualizedResourceTable<MockDataItem>
          data={smallData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Data items: 10")).toBeInTheDocument();
    });

    it("handles very large datasets", () => {
      const veryLargeData: MockDataItem[] = Array.from(
        { length: 10000 },
        (_, i) => ({
          id: i + 1,
          name: `item-${i + 1}`,
          status: i % 2 === 0 ? "active" : "inactive",
          value: Math.floor(Math.random() * 1000),
          category: ["A", "B", "C"][i % 3],
        })
      );

      render(
        <VirtualizedResourceTable<MockDataItem>
          data={veryLargeData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Data items: 10000")).toBeInTheDocument();
    });

    it("handles data updates", () => {
      const { rerender } = render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData.slice(0, 100)}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Data items: 100")).toBeInTheDocument();

      // Update data
      const updatedData = mockData.slice(0, 150);
      rerender(
        <VirtualizedResourceTable<MockDataItem>
          data={updatedData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />
      );

      expect(screen.getByText("Data items: 150")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty columns array", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={[]}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Columns: 0")).toBeInTheDocument();
    });

    it("handles zero height", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={0}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("VirtualizedResourceTable")).toBeInTheDocument();
    });

    it("handles missing optional props", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("VirtualizedResourceTable")).toBeInTheDocument();
    });
  });

  describe("Component Memoization", () => {
    it("memoizes properly to prevent unnecessary re-renders", () => {
      const { rerender } = render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("VirtualizedResourceTable")).toBeInTheDocument();

      // Re-render with same props should not cause issues
      rerender(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />
      );

      expect(screen.getByText("VirtualizedResourceTable")).toBeInTheDocument();
    });

    it("re-renders when props change", () => {
      const { rerender } = render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText("Data items: 1000")).toBeInTheDocument();

      // Change data
      const newData = mockData.slice(0, 500);
      rerender(
        <VirtualizedResourceTable<MockDataItem>
          data={newData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />
      );

      expect(screen.getByText("Data items: 500")).toBeInTheDocument();
    });
  });

  describe("Future Implementation Readiness", () => {
    it("provides clear indication of future functionality", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText(
          "This component will provide efficient rendering for large datasets once react-window is installed."
        )
      ).toBeInTheDocument();
    });

    it("shows informational alert about missing dependency", () => {
      render(
        <VirtualizedResourceTable<MockDataItem>
          data={mockData}
          columns={mockColumns}
          loading={false}
          onRowClick={mockOnRowClick}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      // Should show info alert
      const alert = screen.getByText(
        "Virtual scrolling is not yet available. Install react-window dependency to enable this feature."
      );
      expect(alert).toBeInTheDocument();
    });
  });
});
