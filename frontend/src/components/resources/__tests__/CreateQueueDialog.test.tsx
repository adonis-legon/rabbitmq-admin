import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CreateQueueDialog from "../CreateQueueDialog";
import { useVirtualHosts } from "../../../hooks/useVirtualHosts";
import { useNotification } from "../../../contexts/NotificationContext";
import { rabbitmqResourcesApi } from "../../../services/api/rabbitmqResourcesApi";

// Mock the useVirtualHosts hook
vi.mock("../../../hooks/useVirtualHosts");
const mockedUseVirtualHosts = vi.mocked(useVirtualHosts);

// Mock the useNotification hook
vi.mock("../../../contexts/NotificationContext");
const mockedUseNotification = vi.mocked(useNotification);

// Mock the API
vi.mock("../../../services/api/rabbitmqResourcesApi");
const mockedApi = vi.mocked(rabbitmqResourcesApi);

// Mock KeyValueEditor component
vi.mock("../../common/KeyValueEditor", () => {
  return {
    __esModule: true,
    default: () => <div data-testid="key-value-editor" />,
  };
});

const theme = createTheme();

describe("CreateQueueDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnQueueCreated = vi.fn();

  const defaultProps = {
    open: true,
    clusterId: "test-cluster",
    onClose: mockOnClose,
    onSuccess: mockOnQueueCreated,
  };

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <CreateQueueDialog {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockedUseVirtualHosts.mockReturnValue({
      virtualHosts: [
        { name: "/", description: "Default virtual host" },
        { name: "test-vhost", description: "Test virtual host" },
        { name: "production", description: "Production virtual host" },
      ],
      loading: false,
      error: null,
      refresh: vi.fn(),
      loadVirtualHosts: vi.fn(),
      clearError: vi.fn(),
    });

    mockedUseNotification.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      showNotification: vi.fn(),
    });

    mockedApi.createQueue.mockResolvedValue();
  });

  describe("Rendering", () => {
    it("renders dialog with all form fields", () => {
      renderComponent();
      expect(screen.getByText("Create New Queue")).toBeInTheDocument();
      expect(screen.getByLabelText(/Queue Name/)).toBeInTheDocument();
      // Check for Virtual Host FormControl by finding the select with label
      const virtualHostSelect = screen.getByRole("combobox");
      expect(virtualHostSelect).toBeInTheDocument();
      // Verify the Virtual Host label exists by checking the select's accessible name
      expect(virtualHostSelect).toHaveAccessibleName("Virtual Host");
    });

    it("populates virtual host dropdown with available hosts", async () => {
      renderComponent();

      const vhostSelect = screen.getByRole("combobox");
      // Open the dropdown
      await userEvent.click(vhostSelect);

      // Wait for the dropdown options to appear
      await waitFor(() => {
        // There may be multiple "/ (default)" elements (selected value and dropdown)
        const defaultOptions = screen.queryAllByText("/ (default)");
        expect(defaultOptions.length).toBeGreaterThan(1);
        expect(screen.getByText("test-vhost")).toBeInTheDocument();
        expect(screen.getByText("production")).toBeInTheDocument();
      });
    });

    it("shows loading state for virtual hosts", async () => {

      mockedUseVirtualHosts.mockReturnValue({
        virtualHosts: [],
        loading: true,
        error: null,
        refresh: vi.fn(),
        loadVirtualHosts: vi.fn(),
        clearError: vi.fn(),
      });

      renderComponent();

      // When loading, the select should be disabled and not openable
      const vhostSelect = screen.getByRole("combobox");
      expect(vhostSelect).toHaveAttribute('aria-disabled', 'true');
      // Do not attempt to open the dropdown or check for progressbar, as it is not rendered
    });
  });

  describe("Queue Creation", () => {
    it("creates queue with valid form data", async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/Queue Name/);
      await user.type(nameInput, "test-queue");

      const createButton = screen.getByRole("button", { name: /Create Queue/ });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockedApi.createQueue).toHaveBeenCalled();
      });
    });
  });
});
