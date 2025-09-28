import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CreateExchangeDialog from "../CreateExchangeDialog";
import { useVirtualHosts } from "../../../hooks/useVirtualHosts";
import { useNotification } from "../../../contexts/NotificationContext";
import { rabbitmqResourcesApi } from "../../../services/api/rabbitmqResourcesApi";

// Mock the useVirtualHosts hook
vi.mock("../../../hooks/useVirtualHosts");

// Mock the notification context
vi.mock("../../../contexts/NotificationContext");

// Mock the API
vi.mock("../../../services/api/rabbitmqResourcesApi", () => ({
  rabbitmqResourcesApi: {
    createExchange: vi.fn(),
  },
}));

// Mock the KeyValueEditor component
vi.mock("../../common/KeyValueEditor", () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="key-value-editor">
      {label}
      <button>Add</button>
    </div>
  ),
}));

const mockUseVirtualHosts = useVirtualHosts as any;
const mockUseNotification = useNotification as any;
const mockCreateExchange = rabbitmqResourcesApi.createExchange as any;

const mockVirtualHosts = [
  { name: "/", description: "Default virtual host" },
  { name: "test-vhost", description: "Test environment" },
];

const mockNotificationContext = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  showNotification: vi.fn(),
};

describe("CreateExchangeDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onExchangeCreated: vi.fn(),
    onSuccess: vi.fn(),
    clusterId: "test-cluster",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: mockVirtualHosts,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    mockUseNotification.mockReturnValue(mockNotificationContext);
    mockCreateExchange.mockResolvedValue({});
  });

  const renderComponent = (props = {}) => {
    const theme = createTheme();
    return render(
      <ThemeProvider theme={theme}>
        <CreateExchangeDialog {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  it("handles API errors gracefully", async () => {
    mockCreateExchange.mockRejectedValue(new Error("API Error"));
    const user = userEvent.setup();
    renderComponent();

    const nameInput = screen.getByLabelText(/Exchange Name/i);
    await user.type(nameInput, "test-exchange");

    const createButton = screen.getByText("Create Exchange");
    await user.click(createButton);

    await waitFor(() => {
      expect(mockNotificationContext.error).toHaveBeenCalledWith("API Error", 10000);
    });
  });
});