import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import RefreshControls from "../RefreshControls";

// Create a test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe("RefreshControls", () => {
  const mockOnRefresh = vi.fn();
  const mockOnAutoRefreshChange = vi.fn();
  const mockOnRefreshIntervalChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders refresh button", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    const refreshButton = screen.getByRole("button");
    expect(refreshButton).toBeInTheDocument();
  });

  it("handles manual refresh click", async () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    const refreshButton = screen.getByRole("button");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it("displays auto-refresh toggle", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    const autoRefreshToggle = screen.getByRole("checkbox");
    expect(autoRefreshToggle).toBeInTheDocument();
    expect(autoRefreshToggle).not.toBeChecked();
  });

  it("handles auto-refresh toggle", async () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    const autoRefreshToggle = screen.getByRole("checkbox");
    fireEvent.click(autoRefreshToggle);

    await waitFor(() => {
      expect(mockOnAutoRefreshChange).toHaveBeenCalledWith(true);
    });
  });

  it("shows auto-refresh as enabled when prop is true", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    const autoRefreshToggle = screen.getByRole("checkbox");
    expect(autoRefreshToggle).toBeChecked();
  });

  it("displays refresh interval selector when auto-refresh is enabled", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    // Check for the FormControl and Select components
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByDisplayValue("30")).toBeInTheDocument();
  });

  it("hides refresh interval selector when auto-refresh is disabled", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("handles refresh interval change", () => {
    // Test that the component properly displays different interval values
    const { rerender } = render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    // Verify initial state
    expect(screen.getByDisplayValue("30")).toBeInTheDocument();
    expect(screen.getByText("Auto-refreshing every 30s")).toBeInTheDocument();

    // Test with different interval value (simulating what would happen after interval change)
    rerender(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={60}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />
    );

    // Verify the component updates correctly
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getByText("Auto-refreshing every 60s")).toBeInTheDocument();
  });

  it("displays last updated timestamp", () => {
    const lastUpdated = new Date("2023-01-01T12:00:00Z");

    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
        lastUpdated={lastUpdated}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it("displays loading state", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
        loading={true}
      />,
      { wrapper: TestWrapper }
    );

    const refreshButton = screen.getByRole("button");
    expect(refreshButton).toBeDisabled();
  });

  it("disables controls when disabled prop is true", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
        disabled={true}
      />,
      { wrapper: TestWrapper }
    );

    const refreshButton = screen.getByRole("button");
    const autoRefreshToggle = screen.getByRole("checkbox");

    expect(refreshButton).toBeDisabled();
    expect(autoRefreshToggle).toBeDisabled();
  });

  it("supports all refresh interval options", () => {
    // Test by checking if different interval values work correctly
    const { rerender } = render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={10}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    // Check 10 seconds
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    expect(screen.getByText("Auto-refreshing every 10s")).toBeInTheDocument();

    // Test 60 seconds (1 minute)
    rerender(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={60}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />
    );

    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getByText("Auto-refreshing every 60s")).toBeInTheDocument();

    // Test 300 seconds (5 minutes)
    rerender(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={300}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />
    );

    expect(screen.getByDisplayValue("300")).toBeInTheDocument();
    expect(screen.getByText("Auto-refreshing every 300s")).toBeInTheDocument();
  });

  it("displays auto-refresh status indicator", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={true}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Auto-refreshing every 30s")).toBeInTheDocument();
  });

  it("hides last updated when showLastUpdated is false", () => {
    const lastUpdated = new Date("2023-01-01T12:00:00Z");

    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
        lastUpdated={lastUpdated}
        showLastUpdated={false}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });

  it("formats last updated time correctly", () => {
    const now = new Date();
    const lastUpdated = new Date(now.getTime() - 30000); // 30 seconds ago

    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
        lastUpdated={lastUpdated}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText(/30s ago/)).toBeInTheDocument();
  });

  it("renders with minimal props", () => {
    render(
      <RefreshControls
        onRefresh={mockOnRefresh}
        autoRefresh={false}
        onAutoRefreshChange={mockOnAutoRefreshChange}
        refreshInterval={30}
        onRefreshIntervalChange={mockOnRefreshIntervalChange}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByText("Auto-refresh")).toBeInTheDocument();
  });
});
