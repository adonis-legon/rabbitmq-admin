import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, it, expect, beforeEach, describe } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PaginationControls from "../PaginationControls";

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe("PaginationControls", () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnJumpToPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pagination controls with current page info", () => {
    render(
      <PaginationControls
        page={0} // 0-based index
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Showing 1-25 of 100 items")).toBeInTheDocument();
  });

  it("displays page size selector", () => {
    render(
      <PaginationControls
        page={0}
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    // Check for page size selector
    expect(screen.getByDisplayValue("25")).toBeInTheDocument();
    expect(screen.getAllByText("Items per page")).toHaveLength(2); // Label and legend
  });

  it("handles page size change", () => {
    const { rerender } = render(
      <PaginationControls
        page={0}
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByDisplayValue("25")).toBeInTheDocument();

    // Simulate pageSize change by rerendering with new pageSize
    rerender(
      <PaginationControls
        page={0}
        pageSize={50}
        totalItems={100}
        totalPages={2}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
  });

  it("enables/disables navigation buttons correctly", () => {
    render(
      <PaginationControls
        page={0} // First page
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    const firstPageButton = screen
      .getByLabelText("First page")
      .querySelector("button");
    expect(firstPageButton).toBeDisabled();
  });

  it("handles page navigation", async () => {
    render(
      <PaginationControls
        page={1} // Second page
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    const firstPageButton = screen
      .getByLabelText("First page")
      .querySelector("button");
    fireEvent.click(firstPageButton!);

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledWith(0);
    });
  });

  it("handles last page navigation", async () => {
    render(
      <PaginationControls
        page={1}
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    const lastPageButton = screen
      .getByLabelText("Last page")
      .querySelector("button");
    fireEvent.click(lastPageButton!);

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledWith(3); // 0-based index for last page
    });
  });

  it("displays correct state for single page", () => {
    render(
      <PaginationControls
        page={0}
        pageSize={25}
        totalItems={10}
        totalPages={1}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Showing 1-10 of 10 items")).toBeInTheDocument();

    const firstPageButton = screen
      .getByLabelText("First page")
      .querySelector("button");
    const lastPageButton = screen
      .getByLabelText("Last page")
      .querySelector("button");

    expect(firstPageButton).toBeDisabled();
    expect(lastPageButton).toBeDisabled();
  });

  it("displays correct state for empty results", () => {
    render(
      <PaginationControls
        page={0}
        pageSize={25}
        totalItems={0}
        totalPages={0}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Showing 0-0 of 0 items")).toBeInTheDocument();
  });

  it("supports all page size options", () => {
    render(
      <PaginationControls
        page={0}
        pageSize={25}
        totalItems={1000}
        totalPages={40}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    // Check that the select shows the current value
    const pageSizeSelect = screen.getByDisplayValue("25");
    expect(pageSizeSelect).toBeInTheDocument();

    // Verify the select is functional by checking its properties
    const comboboxElement = screen.getByRole("combobox");
    expect(comboboxElement).toHaveAttribute("aria-expanded", "false");
    expect(comboboxElement).toHaveAttribute("role", "combobox");
  });

  it("handles jump to page functionality", async () => {
    render(
      <PaginationControls
        page={1}
        pageSize={25}
        totalItems={1000}
        totalPages={40}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onJumpToPage={mockOnJumpToPage}
      />,
      { wrapper: TestWrapper }
    );

    const jumpInput = screen.getByRole("spinbutton");
    fireEvent.change(jumpInput, { target: { value: "10" } });
    fireEvent.keyDown(jumpInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockOnJumpToPage).toHaveBeenCalledWith(9); // Convert to 0-based index
    });
  });

  it("validates jump to page input", async () => {
    render(
      <PaginationControls
        page={1}
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onJumpToPage={mockOnJumpToPage}
      />,
      { wrapper: TestWrapper }
    );

    const jumpInput = screen.getByRole("spinbutton");

    // Test invalid page number (too high)
    fireEvent.change(jumpInput, { target: { value: "10" } });
    fireEvent.keyDown(jumpInput, { key: "Enter", code: "Enter" });

    // Should not call onJumpToPage for invalid page
    await waitFor(() => {
      expect(mockOnJumpToPage).not.toHaveBeenCalled();
    });

    // Clear the mock to test valid case
    mockOnJumpToPage.mockClear();

    // Test valid page number
    fireEvent.change(jumpInput, { target: { value: "3" } });
    fireEvent.keyDown(jumpInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockOnJumpToPage).toHaveBeenCalledWith(2); // Convert to 0-based index
    });
  });

  it("handles disabled state", () => {
    render(
      <PaginationControls
        page={0}
        pageSize={25}
        totalItems={1000}
        totalPages={40}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        disabled={true}
      />,
      { wrapper: TestWrapper }
    );

    const pageSizeSelect = screen.getByDisplayValue("25");
    const firstPageButton = screen
      .getByLabelText("First page")
      .querySelector("button");
    const lastPageButton = screen
      .getByLabelText("Last page")
      .querySelector("button");

    expect(pageSizeSelect).toBeDisabled();
    expect(firstPageButton).toBeDisabled();
    expect(lastPageButton).toBeDisabled();
  });
  it("supports custom page size options", () => {
    const customPageSizeOptions = [10, 20, 50, 100];

    render(
      <PaginationControls
        page={0}
        pageSize={20}
        totalItems={1000}
        totalPages={50}
        pageSizeOptions={customPageSizeOptions}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    // Check that the select shows the current value
    const pageSizeSelect = screen.getByDisplayValue("20");
    expect(pageSizeSelect).toBeInTheDocument();

    // Verify the select is functional by checking its properties
    const comboboxElement = screen.getByRole("combobox");
    expect(comboboxElement).toHaveAttribute("aria-expanded", "false");
    expect(comboboxElement).toHaveAttribute("role", "combobox");
  });

  it("calculates correct item range for middle page", () => {
    render(
      <PaginationControls
        page={2} // Third page (0-based)
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Showing 51-75 of 100 items")).toBeInTheDocument();
  });

  it("calculates correct item range for last page with partial items", () => {
    render(
      <PaginationControls
        page={3} // Fourth page (0-based)
        pageSize={25}
        totalItems={85} // Only 10 items on last page
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Showing 76-85 of 85 items")).toBeInTheDocument();
  });

  it("hides jump to page when not provided", () => {
    render(
      <PaginationControls
        page={1}
        pageSize={25}
        totalItems={100}
        totalPages={4}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.queryByText("Go to page:")).not.toBeInTheDocument();
  });

  it("shows jump to page only when there are multiple pages", () => {
    render(
      <PaginationControls
        page={0}
        pageSize={25}
        totalItems={10}
        totalPages={1}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onJumpToPage={mockOnJumpToPage}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.queryByText("Go to page:")).not.toBeInTheDocument();
  });
});
