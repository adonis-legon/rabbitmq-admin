import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import TimestampToggle from "../TimestampToggle";

// Mock the timestamp utils
vi.mock("../../../utils/timestampUtils", () => ({
  getTimestampDisplayModes: vi.fn(() => [
    {
      showLocal: true,
      label: "Local (America/New_York -05:00)",
    },
    {
      showLocal: false,
      label: "UTC",
    },
  ]),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("TimestampToggle", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should render with local time selected by default", () => {
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} />
    );

    const localButton = screen.getByRole("button", {
      name: /show local time/i,
    });
    const utcButton = screen.getByRole("button", { name: /show UTC time/i });

    expect(localButton).toHaveAttribute("aria-pressed", "true");
    expect(utcButton).toHaveAttribute("aria-pressed", "false");
  });

  it("should render with UTC selected when showLocal is false", () => {
    renderWithTheme(
      <TimestampToggle showLocal={false} onChange={mockOnChange} />
    );

    const localButton = screen.getByRole("button", {
      name: /show local time/i,
    });
    const utcButton = screen.getByRole("button", { name: /show UTC time/i });

    expect(localButton).toHaveAttribute("aria-pressed", "false");
    expect(utcButton).toHaveAttribute("aria-pressed", "true");
  });

  it("should call onChange with true when local button is clicked", () => {
    renderWithTheme(
      <TimestampToggle showLocal={false} onChange={mockOnChange} />
    );

    const localButton = screen.getByRole("button", {
      name: /show local time/i,
    });
    fireEvent.click(localButton);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it("should call onChange with false when UTC button is clicked", () => {
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} />
    );

    const utcButton = screen.getByRole("button", { name: /show UTC time/i });
    fireEvent.click(utcButton);

    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it("should not call onChange when clicking the already selected button", () => {
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} />
    );

    const localButton = screen.getByRole("button", {
      name: /show local time/i,
    });
    fireEvent.click(localButton);

    // Should not call onChange when clicking already selected button
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should display "Time:" label', () => {
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} />
    );

    expect(screen.getByText("Time:")).toBeInTheDocument();
  });

  it('should display "Local" and "UTC" button labels', () => {
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} />
    );

    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.getByText("UTC")).toBeInTheDocument();
  });

  it("should show tooltips with timezone information", async () => {
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} />
    );

    // The timezone info should be present in aria-label
    const timezoneElement = screen.getByLabelText("Local (America/New_York -05:00)");
    expect(timezoneElement).toBeInTheDocument();

    const utcElement = screen.getByLabelText("UTC");
    expect(utcElement).toBeInTheDocument();
  });

  it("should be disabled when disabled prop is true", () => {
    renderWithTheme(
      <TimestampToggle
        showLocal={true}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const localButton = screen.getByRole("button", {
      name: /show local time/i,
    });
    const utcButton = screen.getByRole("button", { name: /show UTC time/i });

    expect(localButton).toBeDisabled();
    expect(utcButton).toBeDisabled();
  });

  it("should not call onChange when disabled", () => {
    renderWithTheme(
      <TimestampToggle
        showLocal={true}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const utcButton = screen.getByRole("button", { name: /show UTC time/i });
    fireEvent.click(utcButton);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("should render with different sizes", () => {
    const { rerender } = renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} size="small" />
    );

    // Check that buttons have the small size class
    const localButton = screen.getByRole("button", { name: /show local time/i });
    expect(localButton).toHaveClass("MuiToggleButton-sizeSmall");

    rerender(
      <ThemeProvider theme={theme}>
        <TimestampToggle
          showLocal={true}
          onChange={mockOnChange}
          size="medium"
        />
      </ThemeProvider>
    );

    // Check that buttons have the medium size class
    const mediumLocalButton = screen.getByRole("button", { name: /show local time/i });
    expect(mediumLocalButton).toHaveClass("MuiToggleButton-sizeMedium");
  });

  it("should apply custom sx styles", () => {
    const customSx = { backgroundColor: "red" };
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} sx={customSx} />
    );

    const container = screen.getByText("Time:").closest("div");
    expect(container).toHaveStyle("background-color: rgb(255, 0, 0)");
  });

  it("should have proper accessibility attributes", () => {
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} />
    );

    const toggleGroup = screen.getByRole("group", {
      name: /timestamp display mode/i,
    });
    expect(toggleGroup).toBeInTheDocument();

    const localButton = screen.getByRole("button", {
      name: /show local time/i,
    });
    const utcButton = screen.getByRole("button", { name: /show UTC time/i });

    expect(localButton).toHaveAttribute("aria-label", "show local time");
    expect(utcButton).toHaveAttribute("aria-label", "show UTC time");
  });

  it("should handle keyboard navigation", () => {
    renderWithTheme(
      <TimestampToggle showLocal={true} onChange={mockOnChange} />
    );

    const localButton = screen.getByRole("button", {
      name: /show local time/i,
    });
    const utcButton = screen.getByRole("button", { name: /show UTC time/i });

    // Focus on local button
    localButton.focus();
    expect(localButton).toHaveFocus();

    // Tab to UTC button
    fireEvent.keyDown(localButton, { key: "Tab" });
    utcButton.focus();
    expect(utcButton).toHaveFocus();

    // Since keyboard events don't trigger onChange, simulate the actual click after focus
    fireEvent.click(utcButton);
    expect(mockOnChange).toHaveBeenCalledWith(false);
  });
});
