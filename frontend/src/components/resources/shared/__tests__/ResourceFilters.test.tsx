import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ResourceFilters from "../ResourceFilters";

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe("ResourceFilters", () => {
  const mockOnSearchChange = vi.fn();
  const mockOnStateFilterChange = vi.fn();
  const mockOnTypeFilterChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input with placeholder", () => {
    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
      />,
      { wrapper: TestWrapper }
    );

    const searchInput = screen.getByPlaceholderText("Search resources...");
    expect(searchInput).toBeInTheDocument();
  });

  it("handles search input changes with debounce", async () => {
    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
      />,
      { wrapper: TestWrapper }
    );

    const searchInput = screen.getByPlaceholderText("Search resources...");
    fireEvent.change(searchInput, { target: { value: "test search" } });

    // Should debounce the search
    await waitFor(
      () => {
        expect(mockOnSearchChange).toHaveBeenCalledWith("test search");
      },
      { timeout: 1000 }
    );
  });

  it("displays current search term", () => {
    render(
      <ResourceFilters
        searchTerm="existing search"
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
      />,
      { wrapper: TestWrapper }
    );

    const searchInput = screen.getByDisplayValue("existing search");
    expect(searchInput).toBeInTheDocument();
  });

  it("shows clear filters button when search term exists", () => {
    render(
      <ResourceFilters
        searchTerm="test"
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
      />,
      { wrapper: TestWrapper }
    );

    const clearButton = screen.getByText("Clear Filters");
    expect(clearButton).toBeInTheDocument();
  });

  it("hides clear filters button when no search term", () => {
    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
      />,
      { wrapper: TestWrapper }
    );

    const clearButton = screen.queryByText("Clear Filters");
    expect(clearButton).not.toBeInTheDocument();
  });

  it("handles clear filters click", async () => {
    render(
      <ResourceFilters
        searchTerm="test"
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
      />,
      { wrapper: TestWrapper }
    );

    const clearButton = screen.getByText("Clear Filters");
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  it("renders state filter when provided", async () => {
    const stateOptions = [
      { value: "running", label: "Running" },
      { value: "blocked", label: "Blocked" },
      { value: "idle", label: "Idle" },
    ];

    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        stateFilter={[]}
        stateOptions={stateOptions}
        onStateFilterChange={mockOnStateFilterChange}
      />,
      { wrapper: TestWrapper }
    );

    // Click to expand advanced filters
    const filterButton = screen.getByRole("button", {
      name: "Advanced filters",
    });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "State" })
      ).toBeInTheDocument();
    });
  });

  it("handles state filter changes", async () => {
    const stateOptions = [
      { value: "running", label: "Running" },
      { value: "blocked", label: "Blocked" },
    ];

    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        stateFilter={[]}
        stateOptions={stateOptions}
        onStateFilterChange={mockOnStateFilterChange}
      />,
      { wrapper: TestWrapper }
    );

    // Click to expand advanced filters
    const filterButton = screen.getByRole("button", {
      name: "Advanced filters",
    });
    fireEvent.click(filterButton);

    // Wait for the filters to be expanded and find the state select
    const stateSelect = await screen.findByRole("combobox", { name: "State" });
    fireEvent.mouseDown(stateSelect);

    await waitFor(() => {
      const runningOption = screen.getByRole("option", { name: "Running" });
      fireEvent.click(runningOption);
    });

    await waitFor(() => {
      expect(mockOnStateFilterChange).toHaveBeenCalledWith(["running"]);
    });
  });

  it("renders type filter when provided", async () => {
    const typeOptions = [
      { value: "direct", label: "Direct" },
      { value: "topic", label: "Topic" },
      { value: "fanout", label: "Fanout" },
    ];

    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        typeFilter={[]}
        typeOptions={typeOptions}
        onTypeFilterChange={mockOnTypeFilterChange}
      />,
      { wrapper: TestWrapper }
    );

    // Click to expand advanced filters
    const filterButton = screen.getByRole("button", {
      name: "Advanced filters",
    });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Type" })
      ).toBeInTheDocument();
    });
  });

  it("handles type filter changes", async () => {
    const typeOptions = [
      { value: "direct", label: "Direct" },
      { value: "topic", label: "Topic" },
    ];

    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        typeFilter={[]}
        typeOptions={typeOptions}
        onTypeFilterChange={mockOnTypeFilterChange}
      />,
      { wrapper: TestWrapper }
    );

    // Click to expand advanced filters
    const filterButton = screen.getByRole("button", {
      name: "Advanced filters",
    });
    fireEvent.click(filterButton);

    // Wait for the filters to be expanded and find the type select
    const typeSelect = await screen.findByRole("combobox", { name: "Type" });
    fireEvent.mouseDown(typeSelect);

    await waitFor(() => {
      const directOption = screen.getByRole("option", { name: "Direct" });
      fireEvent.click(directOption);
    });

    await waitFor(() => {
      expect(mockOnTypeFilterChange).toHaveBeenCalledWith(["direct"]);
    });
  });

  it("displays selected filters", async () => {
    const stateOptions = [
      { value: "running", label: "Running" },
      { value: "blocked", label: "Blocked" },
    ];

    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        stateFilter={["running", "blocked"]}
        stateOptions={stateOptions}
        onStateFilterChange={mockOnStateFilterChange}
      />,
      { wrapper: TestWrapper }
    );

    // Should show clear filters button when filters are active
    expect(screen.getByText("Clear Filters")).toBeInTheDocument();
  });

  it("shows clear filters button when filters are active", () => {
    const stateOptions = [{ value: "running", label: "Running" }];

    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        stateFilter={["running"]}
        stateOptions={stateOptions}
        onStateFilterChange={mockOnStateFilterChange}
      />,
      { wrapper: TestWrapper }
    );

    const clearButton = screen.getByText("Clear Filters");
    expect(clearButton).toBeInTheDocument();
  });

  it("handles multiple filter types simultaneously", () => {
    const stateOptions = [{ value: "running", label: "Running" }];
    const typeOptions = [{ value: "direct", label: "Direct" }];

    render(
      <ResourceFilters
        searchTerm="test"
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        stateFilter={["running"]}
        stateOptions={stateOptions}
        onStateFilterChange={mockOnStateFilterChange}
        typeFilter={["direct"]}
        typeOptions={typeOptions}
        onTypeFilterChange={mockOnTypeFilterChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByDisplayValue("test")).toBeInTheDocument();
    expect(screen.getByText("Clear Filters")).toBeInTheDocument();
  });

  it("supports disabling filters", () => {
    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        disabled={true}
      />,
      { wrapper: TestWrapper }
    );

    const searchInput = screen.getByPlaceholderText("Search resources...");
    expect(searchInput).toBeDisabled();
  });

  it("handles search clear button", async () => {
    render(
      <ResourceFilters
        searchTerm="test search"
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
      />,
      { wrapper: TestWrapper }
    );

    const clearSearchButton = screen.getByRole("button", {
      name: "Clear search",
    }); // Clear icon button
    fireEvent.click(clearSearchButton);

    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith("");
    });
  });

  it("supports custom filters", async () => {
    const customFilters = <div data-testid="custom-filter">Custom Filter</div>;

    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        customFilters={customFilters}
      />,
      { wrapper: TestWrapper }
    );

    // Click to expand advanced filters
    const filterButton = screen.getByRole("button", {
      name: "Advanced filters",
    });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByTestId("custom-filter")).toBeInTheDocument();
    });
  });

  it("hides advanced filters when showAdvancedFilters is false", () => {
    const stateOptions = [{ value: "running", label: "Running" }];

    render(
      <ResourceFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        stateFilter={[]}
        stateOptions={stateOptions}
        onStateFilterChange={mockOnStateFilterChange}
        showAdvancedFilters={false}
      />,
      { wrapper: TestWrapper }
    );

    // When showAdvancedFilters is false, there should be no filter toggle button
    // We can check by counting buttons - should only have search clear button if search has text
    const buttons = screen.queryAllByRole("button");
    // Should not have the advanced filters button (no search term means no clear button either)
    expect(buttons.length).toBe(0); // No buttons when no search term and no advanced filters
  });

  it("displays active filters summary when expanded", async () => {
    const stateOptions = [{ value: "running", label: "Running" }];

    render(
      <ResourceFilters
        searchTerm="test search"
        onSearchChange={mockOnSearchChange}
        onClearFilters={mockOnClearFilters}
        searchPlaceholder="Search resources..."
        stateFilter={[]}
        stateOptions={stateOptions}
        onStateFilterChange={mockOnStateFilterChange}
      />,
      { wrapper: TestWrapper }
    );

    // Click to expand advanced filters
    const filterButton = screen.getByRole("button", {
      name: "Advanced filters",
    });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText("Active filters:")).toBeInTheDocument();
      expect(screen.getByText('Search: "test search"')).toBeInTheDocument();
    });
  });
});
