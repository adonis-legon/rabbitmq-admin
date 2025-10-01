import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import VirtualHostSelector from "../VirtualHostSelector";
import { useVirtualHosts } from "../../../hooks/useVirtualHosts";
import { VirtualHost } from "../../../types/rabbitmq";

// Mock the useVirtualHosts hook
vi.mock("../../../hooks/useVirtualHosts");
const mockUseVirtualHosts = useVirtualHosts as any;

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

const mockVirtualHosts: VirtualHost[] = [
  {
    name: "/",
    description: "Default virtual host",
    tags: "administrator",
  },
  {
    name: "test-vhost",
    description: "Test virtual host",
    tags: "management",
  },
  {
    name: "production",
    description: "Production virtual host",
  },
];

describe("VirtualHostSelector", () => {
  const mockOnVirtualHostSelect = vi.fn();
  const mockRefresh = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: mockVirtualHosts,
      loading: false,
      error: null,
      loadVirtualHosts: vi.fn(),
      clearError: mockClearError,
      refresh: mockRefresh,
    });
  });

  it("renders nothing when no clusterId is provided", () => {
    const { container } = renderWithTheme(
      <VirtualHostSelector
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders virtual host selector with default props", () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    expect(screen.getByLabelText("Virtual Host")).toBeInTheDocument();
  });

  it("renders custom label when provided", () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
        label="Select VHost"
      />
    );

    expect(screen.getByLabelText("Select VHost")).toBeInTheDocument();
  });

  it("displays virtual hosts in dropdown", async () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    // Click to open dropdown
    const selectElement = screen.getByLabelText("Virtual Host");
    fireEvent.mouseDown(selectElement);

    await waitFor(() => {
      expect(screen.getByText("/ (default)")).toBeInTheDocument();
      expect(screen.getByText("test-vhost")).toBeInTheDocument();
      expect(screen.getByText("production")).toBeInTheDocument();
    });
  });

  it("displays virtual host descriptions in dropdown", async () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    // Click to open dropdown
    const selectElement = screen.getByLabelText("Virtual Host");
    fireEvent.mouseDown(selectElement);

    await waitFor(() => {
      expect(screen.getByText("Default virtual host")).toBeInTheDocument();
      expect(screen.getByText("Test virtual host")).toBeInTheDocument();
      expect(screen.getByText("Production virtual host")).toBeInTheDocument();
    });
  });

  it("calls onVirtualHostSelect when a virtual host is selected", async () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    // Click to open dropdown
    const selectElement = screen.getByLabelText("Virtual Host");
    fireEvent.mouseDown(selectElement);

    await waitFor(() => {
      const testVhostOption = screen.getByText("test-vhost");
      fireEvent.click(testVhostOption);
    });

    expect(mockOnVirtualHostSelect).toHaveBeenCalledWith("test-vhost");
  });

  it("displays selected virtual host information", () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost="test-vhost"
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    expect(screen.getByText(/Selected Virtual Host:/)).toBeInTheDocument();
    // Look for the specific text in the selected virtual host display area
    const selectedVhostText = screen.getByText(
      /Selected Virtual Host:/
    ).parentElement;
    expect(selectedVhostText).toHaveTextContent("test-vhost");
  });

  it("displays default virtual host correctly when selected", () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost="/"
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    expect(screen.getByText(/Selected Virtual Host:/)).toBeInTheDocument();
    // Look for the specific text in the selected virtual host display area
    const selectedVhostText = screen.getByText(
      /Selected Virtual Host:/
    ).parentElement;
    expect(selectedVhostText).toHaveTextContent("/ (default)");
  });

  it("shows loading state", () => {
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: [],
      loading: true,
      error: null,
      loadVirtualHosts: vi.fn(),
      clearError: mockClearError,
      refresh: mockRefresh,
    });

    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays error message when there is an error", () => {
    const errorMessage = "Failed to load virtual hosts";
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: [],
      loading: false,
      error: errorMessage,
      loadVirtualHosts: vi.fn(),
      clearError: mockClearError,
      refresh: mockRefresh,
    });

    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("calls clearError when error alert is closed", () => {
    const errorMessage = "Failed to load virtual hosts";
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: [],
      loading: false,
      error: errorMessage,
      loadVirtualHosts: vi.fn(),
      clearError: mockClearError,
      refresh: mockRefresh,
    });

    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it("shows refresh button and calls refresh when clicked", () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    const refreshButton = screen.getByTestId("RefreshIcon").closest("button");
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton!);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("hides refresh button when showRefresh is false", () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
        showRefresh={false}
      />
    );

    expect(
      screen.queryByLabelText("Refresh virtual hosts")
    ).not.toBeInTheDocument();
  });

  it("disables selector when disabled prop is true", () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
        disabled={true}
      />
    );

    const selectElement = screen.getByLabelText("Virtual Host");
    expect(selectElement).toHaveAttribute("aria-disabled", "true");
  });

  it("disables selector when loading", () => {
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: [],
      loading: true,
      error: null,
      loadVirtualHosts: vi.fn(),
      clearError: mockClearError,
      refresh: mockRefresh,
    });

    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    const selectElement = screen.getByLabelText("Virtual Host");
    expect(selectElement).toHaveAttribute("aria-disabled", "true");
  });

  it('shows "No virtual hosts available" when list is empty', async () => {
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: [],
      loading: false,
      error: null,
      loadVirtualHosts: vi.fn(),
      clearError: mockClearError,
      refresh: mockRefresh,
    });

    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    // Click to open dropdown
    const selectElement = screen.getByLabelText("Virtual Host");
    fireEvent.mouseDown(selectElement);

    await waitFor(() => {
      expect(
        screen.getByText("No virtual hosts available")
      ).toBeInTheDocument();
    });
  });

  it("displays virtual host tags when available", async () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    // Click to open dropdown
    const selectElement = screen.getByLabelText("Virtual Host");
    fireEvent.mouseDown(selectElement);

    await waitFor(() => {
      expect(screen.getByText("administrator")).toBeInTheDocument();
      expect(screen.getByText("management")).toBeInTheDocument();
    });
  });

  it("clears error before refreshing", () => {
    renderWithTheme(
      <VirtualHostSelector
        clusterId="test-cluster"
        selectedVirtualHost={null}
        onVirtualHostSelect={mockOnVirtualHostSelect}
      />
    );

    const refreshButton = screen.getByTestId("RefreshIcon").closest("button");
    fireEvent.click(refreshButton!);

    expect(mockClearError).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
