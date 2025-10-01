import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PublishMessageDialog from "../PublishMessageDialog";
import { useVirtualHosts } from "../../../hooks/useVirtualHosts";
import { useNotification } from "../../../contexts/NotificationContext";
import { rabbitmqResourcesApi } from "../../../services/api/rabbitmqResourcesApi";

// Mock the useVirtualHosts hook
vi.mock("../../../hooks/useVirtualHosts");
const mockUseVirtualHosts = vi.mocked(useVirtualHosts);

// Mock the notification context
vi.mock("../../../contexts/NotificationContext");
const mockUseNotification = vi.mocked(useNotification);

// Mock the API
vi.mock("../../../services/api/rabbitmqResourcesApi", () => ({
  rabbitmqResourcesApi: {
    publishMessage: vi.fn(),
    publishToQueue: vi.fn(),
  },
}));

const mockPublishMessage = vi.mocked(rabbitmqResourcesApi.publishMessage);
const mockPublishToQueue = vi.mocked(rabbitmqResourcesApi.publishToQueue);

// Mock the KeyValueEditor component
vi.mock("../../common/KeyValueEditor", () => ({
  default: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (value: Record<string, any>) => void;
  }) => (
    <div data-testid={`key-value-editor-${label.toLowerCase()}`}>
      <button
        onClick={() => onChange({ testKey: "testValue" })}
        data-testid={`add-${label.toLowerCase()}`}
      >
        Add
      </button>
    </div>
  ),
}));

const mockVirtualHosts = [
  { name: "/", description: "Default virtual host" },
  { name: "test-vhost", description: "Test virtual host" },
];

const mockNotificationContext = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  showNotification: vi.fn(),
};

describe("PublishMessageDialog", () => {
  const defaultProps = {
    open: true,
    clusterId: "test-cluster",
    context: "exchange" as const,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: mockVirtualHosts,
      loading: false,
      error: null,
      loadVirtualHosts: vi.fn(),
      clearError: vi.fn(),
      refresh: vi.fn(),
    });
    mockUseNotification.mockReturnValue(mockNotificationContext);
    mockPublishMessage.mockResolvedValue({ routed: true });
    mockPublishToQueue.mockResolvedValue({ routed: true });
  });

  const renderComponent = (props = {}) => {
    const theme = createTheme();
    return render(
      <ThemeProvider theme={theme}>
        <PublishMessageDialog {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  describe("Dialog Rendering", () => {
    it("renders with correct title for exchange context", () => {
      renderComponent({ context: "exchange" });
      expect(
        screen.getByText("Publish Message to Exchange")
      ).toBeInTheDocument();
    });

    it("renders with correct title for queue context", () => {
      renderComponent({ context: "queue" });
      expect(screen.getByText("Publish Message to Queue")).toBeInTheDocument();
    });

    it("renders with target resource name in title", () => {
      const targetResource = { name: "test-exchange", vhost: "/" };
      renderComponent({
        context: "exchange",
        targetResource,
      });

      expect(
        screen.getByText('Publish Message to Exchange "test-exchange"')
      ).toBeInTheDocument();
    });

    it("renders all required form fields", () => {
      renderComponent();

      expect(screen.getByDisplayValue("/")).toBeInTheDocument(); // Virtual host field
      expect(
        screen.getByRole("textbox", { name: /target exchange/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /routing key/i })
      ).toBeInTheDocument();
      expect(screen.getByText("String (UTF-8)")).toBeInTheDocument(); // Payload encoding field
      expect(
        screen.getByRole("textbox", { name: /message payload/i })
      ).toBeInTheDocument();
    });

    it("shows queue-specific fields for queue context", () => {
      renderComponent({ context: "queue" });

      expect(
        screen.getByRole("textbox", { name: /target queue/i })
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("validates required fields", async () => {
      const user = userEvent.setup();
      renderComponent();

      const publishButton = screen.getByRole("button", {
        name: /publish message/i,
      });
      await user.click(publishButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Target exchange name is required/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Message payload is required/i)
        ).toBeInTheDocument();
      });
    });

    it("validates target resource name format", async () => {
      const user = userEvent.setup();
      renderComponent();

      const targetInput = screen.getByRole("textbox", {
        name: /target exchange/i,
      });
      await user.type(targetInput, "invalid name!");

      const publishButton = screen.getByRole("button", {
        name: /publish message/i,
      });
      await user.click(publishButton);

      await waitFor(() => {
        expect(
          screen.getByText(/can only contain letters, numbers/i)
        ).toBeInTheDocument();
      });
    });

    it("validates routing key length", async () => {
      const user = userEvent.setup();
      renderComponent();

      const targetInput = screen.getByRole("textbox", {
        name: /target exchange/i,
      });
      const payloadInput = screen.getByRole("textbox", {
        name: /message payload/i,
      });

      await user.type(targetInput, "test-exchange");
      await user.type(payloadInput, "test payload");

      // Find the routing key input and set its value directly to avoid typing timeout
      const routingKeyInput = screen.getByRole("textbox", {
        name: /routing key/i,
      });

      // Set a long routing key value directly using fireEvent
      const longRoutingKey = "a".repeat(256);
      fireEvent.change(routingKeyInput, { target: { value: longRoutingKey } });

      const publishButton = screen.getByRole("button", {
        name: /publish message/i,
      });
      await user.click(publishButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Routing key cannot exceed 255 characters/i)
        ).toBeInTheDocument();
      });
    });

    it("validates base64 payload format", async () => {
      const user = userEvent.setup();
      renderComponent();

      const targetInput = screen.getByRole("textbox", {
        name: /target exchange/i,
      });
      const payloadInput = screen.getByRole("textbox", {
        name: /message payload/i,
      });

      await user.type(targetInput, "test-exchange");

      // Select Base64 encoding - find the select element
      const encodingSelect = screen.getByText("String (UTF-8)");
      await user.click(encodingSelect);
      await user.click(screen.getByText("Base64"));
      await user.type(payloadInput, "invalid base64!");

      const publishButton = screen.getByRole("button", {
        name: /publish message/i,
      });
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid Base64 format/i)).toBeInTheDocument();
      });
    });
  });

  describe("Message Publishing", () => {
    it("publishes message to exchange successfully", async () => {
      const user = userEvent.setup();
      renderComponent({ context: "exchange" });

      // Wait for virtual hosts to load and form to initialize
      await waitFor(() => {
        expect(screen.getByDisplayValue("/")).toBeInTheDocument();
      });

      const targetInput = screen.getByRole("textbox", {
        name: /target exchange/i,
      });
      const routingKeyInput = screen.getByRole("textbox", {
        name: /routing key/i,
      });
      const payloadInput = screen.getByRole("textbox", {
        name: /message payload/i,
      });

      // Clear and type new values
      await user.clear(targetInput);
      await user.type(targetInput, "test-exchange");
      await user.clear(routingKeyInput);
      await user.type(routingKeyInput, "test.routing");
      await user.clear(payloadInput);
      await user.type(payloadInput, "Hello World");

      const publishButton = screen.getByRole("button", {
        name: /publish message/i,
      });
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockPublishMessage).toHaveBeenCalledWith(
          "test-cluster",
          "/",
          "test-exchange",
          {
            routingKey: "test.routing",
            properties: {},
            payload: "Hello World",
            payloadEncoding: "string",
          }
        );
      });

      expect(mockNotificationContext.success).toHaveBeenCalledWith(
        'Message published to exchange "test-exchange" with routing key "test.routing" and routed successfully',
        6000
      );
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("publishes message to queue successfully", async () => {
      const user = userEvent.setup();
      renderComponent({ context: "queue" });

      // Wait for virtual hosts to load and form to initialize
      await waitFor(() => {
        expect(screen.getByDisplayValue("/")).toBeInTheDocument();
      });

      const targetInput = screen.getByRole("textbox", {
        name: /target queue/i,
      });
      const payloadInput = screen.getByRole("textbox", {
        name: /message payload/i,
      });

      // Clear and type new values
      await user.clear(targetInput);
      await user.type(targetInput, "test-queue");
      await user.clear(payloadInput);
      await user.type(payloadInput, "Hello World");

      const publishButton = screen.getByRole("button", {
        name: /publish message/i,
      });
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockPublishToQueue).toHaveBeenCalledWith(
          "test-cluster",
          "/",
          "test-queue",
          {
            routingKey: "",
            properties: {},
            payload: "Hello World",
            payloadEncoding: "string",
          }
        );
      });

      expect(mockNotificationContext.success).toHaveBeenCalledWith(
        'Message published to queue "test-queue" and routed successfully',
        4000
      );
    });

    it("shows warning when message is not routed", async () => {
      mockPublishMessage.mockResolvedValue({ routed: false });
      const user = userEvent.setup();
      renderComponent();

      // Wait for virtual hosts to load and form to initialize
      await waitFor(() => {
        expect(screen.getByDisplayValue("/")).toBeInTheDocument();
      });

      const targetInput = screen.getByRole("textbox", {
        name: /target exchange/i,
      });
      const payloadInput = screen.getByRole("textbox", {
        name: /message payload/i,
      });

      // Use fireEvent.change for faster test execution
      fireEvent.change(targetInput, { target: { value: "test-exchange" } });
      fireEvent.change(payloadInput, { target: { value: "Hello World" } });

      const publishButton = screen.getByRole("button", {
        name: /publish message/i,
      });
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockNotificationContext.warning).toHaveBeenCalledWith(
          'Message published to exchange "test-exchange" but was not routed to any queue',
          8000
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("handles 400 API errors gracefully", async () => {
      mockPublishMessage.mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Invalid message format" },
        },
      });
      const user = userEvent.setup();
      renderComponent();

      // Wait for virtual hosts to load and form to initialize
      await waitFor(() => {
        expect(screen.getByDisplayValue("/")).toBeInTheDocument();
      });

      const targetInput = screen.getByRole("textbox", {
        name: /target exchange/i,
      });
      const payloadInput = screen.getByRole("textbox", {
        name: /message payload/i,
      });

      // Clear and type new values
      await user.clear(targetInput);
      await user.type(targetInput, "test-exchange");
      await user.clear(payloadInput);
      await user.type(payloadInput, "Hello World");

      const publishButton = screen.getByRole("button", {
        name: /publish message/i,
      });
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockNotificationContext.error).toHaveBeenCalledWith(
          "Invalid message format",
          10000
        );
      });
    });
  });
});
