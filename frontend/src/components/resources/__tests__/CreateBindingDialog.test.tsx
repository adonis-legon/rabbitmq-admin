import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CreateBindingDialog, { BindingContext } from "../CreateBindingDialog";
import { rabbitmqResourcesApi } from "../../../services/api/rabbitmqResourcesApi";
import { useVirtualHosts } from "../../../hooks/useVirtualHosts";
import { useNotification } from "../../../contexts/NotificationContext";

// Mock dependencies
vi.mock("../../../services/api/rabbitmqResourcesApi");
vi.mock("../../../hooks/useVirtualHosts");
vi.mock("../../../contexts/NotificationContext");
vi.mock("../../common/KeyValueEditor", () => ({
  default: ({ value, onChange, disabled }: any) => (
    <div data-testid="key-value-editor">
      <input
        data-testid="arguments-input"
        value={JSON.stringify(value)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            onChange({});
          }
        }}
        disabled={disabled}
      />
    </div>
  ),
}));

const mockRabbitmqResourcesApi = rabbitmqResourcesApi as any;
const mockUseVirtualHosts = useVirtualHosts as any;
const mockUseNotification = useNotification as any;

const mockVirtualHosts = [
  { name: "/", description: "Default virtual host" },
  { name: "test-vhost", description: "Test virtual host" },
];

const mockNotification = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

describe("CreateBindingDialog", () => {
  const defaultProps = {
    open: true,
    clusterId: "test-cluster-id",
    context: "exchange" as BindingContext,
    sourceResource: {
      name: "test-exchange",
      vhost: "/",
    },
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVirtualHosts.mockReturnValue({
      virtualHosts: mockVirtualHosts,
      loading: false,
      error: null,
    });
    mockUseNotification.mockReturnValue(mockNotification);
    mockRabbitmqResourcesApi.createExchangeToQueueBinding = vi
      .fn()
      .mockResolvedValue(undefined);
    mockRabbitmqResourcesApi.createExchangeToExchangeBinding = vi
      .fn()
      .mockResolvedValue(undefined);
  });

  describe("Dialog Rendering", () => {
    it("renders dialog with correct title for exchange context", () => {
      render(<CreateBindingDialog {...defaultProps} />);
      expect(
        screen.getByText('Create Binding from Exchange "test-exchange"')
      ).toBeInTheDocument();
    });

    it("renders dialog with correct title for queue context", () => {
      const queueProps = {
        ...defaultProps,
        context: "queue" as BindingContext,
        sourceResource: {
          name: "test-queue",
          vhost: "/",
        },
      };
      render(<CreateBindingDialog {...queueProps} />);
      expect(
        screen.getByText('Create Binding to Queue "test-queue"')
      ).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      render(<CreateBindingDialog {...defaultProps} open={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("renders all required form fields", () => {
      render(<CreateBindingDialog {...defaultProps} />);

      // Check that form fields are rendered by looking for form controls and unique elements
      expect(screen.getAllByText("Virtual Host").length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Source Exchange")).toBeInTheDocument();
      expect(screen.getAllByText("Destination Type").length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Routing Key")).toBeInTheDocument();
      expect(screen.getByTestId("key-value-editor")).toBeInTheDocument();
    });

    it("pre-fills source exchange when in exchange context", () => {
      render(<CreateBindingDialog {...defaultProps} />);
      const sourceField = screen.getByDisplayValue("test-exchange");
      expect(sourceField).toBeDisabled();
    });

    it("enables source exchange input when in queue context", () => {
      const queueProps = {
        ...defaultProps,
        context: "queue" as BindingContext,
        sourceResource: {
          name: "test-queue",
          vhost: "/",
        },
      };
      render(<CreateBindingDialog {...queueProps} />);
      const sourceField = screen.getByLabelText(/Source Exchange Name/);
      expect(sourceField).not.toBeDisabled();
    });

    it("pre-selects virtual host from source resource", () => {
      render(<CreateBindingDialog {...defaultProps} />);
      expect(screen.getByText("/ (default)")).toBeInTheDocument();
      expect(screen.getByText("Default virtual host")).toBeInTheDocument();
    });
  });

  describe("Virtual Host Loading", () => {
    it("shows loading state when virtual hosts are loading", () => {
      mockUseVirtualHosts.mockReturnValue({
        virtualHosts: [],
        loading: true,
        error: null,
      });

      render(<CreateBindingDialog {...defaultProps} />);

      // Check that the select is disabled during loading
      // Find the Virtual Host select by getting all comboboxes and taking the first one
      const allComboboxes = screen.getAllByRole("combobox");
      const vhostSelect = allComboboxes[0]; // First combobox should be Virtual Host
      expect(vhostSelect).toHaveAttribute("aria-disabled", "true");
    });

    it("shows error when virtual hosts fail to load", () => {
      mockUseVirtualHosts.mockReturnValue({
        virtualHosts: [],
        loading: false,
        error: "Failed to load",
      });

      render(<CreateBindingDialog {...defaultProps} />);
      expect(
        screen.getByText("Failed to load virtual hosts: Failed to load")
      ).toBeInTheDocument();
    });

    it("populates virtual host dropdown with available options", async () => {
      // Test without sourceResource so the dropdown is enabled
      const propsWithoutVhost = {
        ...defaultProps,
        sourceResource: undefined,
      };
      render(<CreateBindingDialog {...propsWithoutVhost} />);

      // Wait for the dialog to be fully rendered and find the select by role
      await waitFor(() => {
        const comboboxes = screen.getAllByRole("combobox");
        expect(comboboxes.length).toBeGreaterThan(0);
      });

      // Find the Virtual Host select - it should be the first combobox when sourceResource is undefined
      const allComboboxes = screen.getAllByRole("combobox");
      const vhostSelect = allComboboxes[0]; // First combobox should be Virtual Host
      fireEvent.mouseDown(vhostSelect);

      await waitFor(() => {
        // Check that the dropdown menu is open by looking for menu items
        const menuItems = screen.getAllByRole("option");
        expect(menuItems.length).toBe(2); // Should have 2 virtual hosts

        // Verify the content of the options (allow for multiple instances since text might appear in selected value too)
        expect(
          screen.getAllByText("/ (default)").length
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("test-vhost").length).toBeGreaterThanOrEqual(
          1
        );
      });
    });
  });

  describe("Destination Type Selection", () => {
    it("shows destination type selector in exchange context", () => {
      render(<CreateBindingDialog {...defaultProps} />);
      // The destination type selector is the second combobox (first one is Virtual Host which is disabled)
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes).toHaveLength(2);
      expect(comboboxes[1]).toBeInTheDocument();
      expect(comboboxes[1]).not.toBeDisabled();
    });

    it("does not show destination type selector in queue context", () => {
      const queueProps = {
        ...defaultProps,
        context: "queue" as BindingContext,
      };
      render(<CreateBindingDialog {...queueProps} />);
      expect(
        screen.queryByLabelText("Destination Type")
      ).not.toBeInTheDocument();
    });

    it("updates destination label when destination type changes", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      // Initially should show queue destination
      expect(
        await screen.findByLabelText(/Destination.*Queue.*Name/)
      ).toBeInTheDocument();

      // Change to exchange destination - use the second combobox (destination type)
      const comboboxes = screen.getAllByRole("combobox");
      const destinationTypeSelect = comboboxes[1];
      await user.click(destinationTypeSelect);
      await user.click(screen.getByText("Bind to Exchange"));

      expect(
        screen.getByLabelText(/Destination.*Exchange.*Name/)
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("validates required destination field", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Create Binding")).toBeInTheDocument();
      });

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      expect(
        screen.getByText("Destination queue name is required")
      ).toBeInTheDocument();
    });

    it("validates source exchange in queue context", async () => {
      const user = userEvent.setup();
      const queueProps = {
        ...defaultProps,
        context: "queue" as BindingContext,
        sourceResource: undefined,
      };
      render(<CreateBindingDialog {...queueProps} />);

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      expect(
        screen.getByText("Source exchange name is required")
      ).toBeInTheDocument();
    });

    it("validates resource name format", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "invalid name with spaces");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      expect(
        screen.getByText(
          /can only contain letters, numbers, dots, underscores, and hyphens/
        )
      ).toBeInTheDocument();
    });

    it("validates routing key length", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      const routingKeyField = screen.getByLabelText("Routing Key");
      const longRoutingKey = "a".repeat(256);
      await user.type(routingKeyField, longRoutingKey);

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      expect(
        screen.getByText("Routing key cannot exceed 255 characters")
      ).toBeInTheDocument();
    });

    it("clears validation errors when user corrects input", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      // Trigger validation error
      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);
      expect(
        screen.getByText("Destination queue name is required")
      ).toBeInTheDocument();

      // Fix the error
      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "valid-queue");

      expect(
        screen.queryByText("Destination queue name is required")
      ).not.toBeInTheDocument();
    });
  });

  describe("Binding Creation", () => {
    it("creates exchange-to-queue binding successfully", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      // Fill form
      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const routingKeyField = screen.getByLabelText("Routing Key");
      await user.type(routingKeyField, "test.routing.key");

      // Submit form
      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(
          mockRabbitmqResourcesApi.createExchangeToQueueBinding
        ).toHaveBeenCalledWith(
          "test-cluster-id",
          "/",
          "test-exchange",
          "test-queue",
          {
            routingKey: "test.routing.key",
            arguments: {},
          }
        );
      });

      expect(mockNotification.success).toHaveBeenCalledWith(
        'Binding "test-exchange → test-queue (queue) (routing key: "test.routing.key")" created successfully',
        4000
      );
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("creates exchange-to-exchange binding successfully", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      // Initially should show queue destination
      expect(
        screen.getByLabelText(/Destination.*Queue.*Name/)
      ).toBeInTheDocument();

      // Change destination type to exchange - use the second combobox (destination type)
      const comboboxes = screen.getAllByRole("combobox");
      const destinationTypeSelect = comboboxes[1];
      await user.click(destinationTypeSelect);
      await user.click(screen.getByText("Bind to Exchange"));

      // Wait for the destination field to update to exchange type
      await waitFor(() => {
        expect(
          screen.queryByLabelText(/Destination.*Queue.*Name/)
        ).not.toBeInTheDocument();
        expect(
          screen.getByLabelText(/Destination.*Exchange.*Name/)
        ).toBeInTheDocument();
      });

      // Fill form
      const destinationField = screen.getByLabelText(
        /Destination.*Exchange.*Name/
      );
      await user.type(destinationField, "target-exchange");

      const routingKeyField = screen.getByLabelText("Routing Key");
      await user.type(routingKeyField, "exchange.routing");

      // Submit form
      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(
          mockRabbitmqResourcesApi.createExchangeToExchangeBinding
        ).toHaveBeenCalledWith(
          "test-cluster-id",
          "/",
          "test-exchange",
          "target-exchange",
          {
            routingKey: "exchange.routing",
            arguments: {},
          }
        );
      });
    });

    it("creates binding with arguments", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      // Fill form
      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      // Add arguments
      const argumentsInput = screen.getByTestId("arguments-input");
      fireEvent.change(argumentsInput, {
        target: { value: '{"x-match": "all", "format": "json"}' },
      });

      // Submit form
      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(
          mockRabbitmqResourcesApi.createExchangeToQueueBinding
        ).toHaveBeenCalledWith(
          "test-cluster-id",
          "/",
          "test-exchange",
          "test-queue",
          {
            routingKey: "",
            arguments: { "x-match": "all", format: "json" },
          }
        );
      });
    });

    it("handles empty routing key correctly", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      // Fill form without routing key
      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      // Submit form
      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(
          mockRabbitmqResourcesApi.createExchangeToQueueBinding
        ).toHaveBeenCalledWith(
          "test-cluster-id",
          "/",
          "test-exchange",
          "test-queue",
          {
            routingKey: "",
            arguments: {},
          }
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("handles 409 conflict error", async () => {
      const user = userEvent.setup();
      const conflictError = {
        response: { status: 409 },
        message: "Conflict",
      };
      mockRabbitmqResourcesApi.createExchangeToQueueBinding.mockRejectedValue(
        conflictError
      );

      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(mockNotification.error).toHaveBeenCalledWith(
          'Binding "test-exchange → test-queue" already exists',
          10000
        );
      });
    });

    it("handles 400 bad request error", async () => {
      const user = userEvent.setup();
      const badRequestError = {
        response: {
          status: 400,
          data: { message: "Invalid routing key format" },
        },
      };
      mockRabbitmqResourcesApi.createExchangeToQueueBinding.mockRejectedValue(
        badRequestError
      );

      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(mockNotification.error).toHaveBeenCalledWith(
          "Invalid routing key format",
          10000
        );
      });
    });

    it("handles 403 permission error", async () => {
      const user = userEvent.setup();
      const permissionError = {
        response: { status: 403 },
      };
      mockRabbitmqResourcesApi.createExchangeToQueueBinding.mockRejectedValue(
        permissionError
      );

      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(mockNotification.error).toHaveBeenCalledWith(
          "You do not have permission to create bindings on this cluster",
          10000
        );
      });
    });

    it("handles 404 not found error", async () => {
      const user = userEvent.setup();
      const notFoundError = {
        response: { status: 404 },
      };
      mockRabbitmqResourcesApi.createExchangeToQueueBinding.mockRejectedValue(
        notFoundError
      );

      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(mockNotification.error).toHaveBeenCalledWith(
          'Binding "test-exchange → test-queue" not found',
          10000
        );
      });
    });

    it("handles generic error", async () => {
      const user = userEvent.setup();
      const genericError = new Error("Network error");
      mockRabbitmqResourcesApi.createExchangeToQueueBinding.mockRejectedValue(
        genericError
      );

      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(mockNotification.error).toHaveBeenCalledWith("Network error", 10000);
      });
    });

    it("displays submit error in dialog", async () => {
      const user = userEvent.setup();
      const error = new Error("Test error");
      mockRabbitmqResourcesApi.createExchangeToQueueBinding.mockRejectedValue(
        error
      );

      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("Test error")).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockRabbitmqResourcesApi.createExchangeToQueueBinding.mockReturnValue(
        promise
      );

      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      // Should show loading spinner
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(createButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!();
      await waitFor(() => {
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      });
    });

    it("disables form fields during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockRabbitmqResourcesApi.createExchangeToQueueBinding.mockReturnValue(
        promise
      );

      render(<CreateBindingDialog {...defaultProps} />);

      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );
      await user.type(destinationField, "test-queue");

      const createButton = screen.getByText("Create Binding");
      await user.click(createButton);

      // Form fields should be disabled
      expect(destinationField).toBeDisabled();
      expect(screen.getByLabelText("Routing Key")).toBeDisabled();

      resolvePromise!();
    });
  });

  describe("Dialog Lifecycle", () => {
    it("resets form when dialog opens", () => {
      const { rerender } = render(
        <CreateBindingDialog {...defaultProps} open={false} />
      );

      // Open dialog
      rerender(<CreateBindingDialog {...defaultProps} open={true} />);

      // Form should be reset to initial values
      expect(screen.getByDisplayValue("test-exchange")).toBeInTheDocument();

      // Check that destination field is empty
      const destinationField = screen.getByLabelText(/Destination.*Name/);
      expect(destinationField).toHaveValue("");
    });

    it("calls onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe("Binding Preview", () => {
    it("shows binding preview with current form values", async () => {
      const user = userEvent.setup();
      render(<CreateBindingDialog {...defaultProps} />);

      // Wait for the dialog to be fully rendered
      await waitFor(() => {
        expect(
          screen.getByText('Create Binding from Exchange "test-exchange"')
        ).toBeInTheDocument();
      });

      // Find the destination field
      const destinationField = await screen.findByLabelText(
        /Destination.*Name/
      );

      await user.type(destinationField, "my-queue");

      const routingKeyField = screen.getByLabelText("Routing Key");
      await user.type(routingKeyField, "user.created");

      // Check preview with more flexible text matching
      expect(screen.getByText("Binding Preview")).toBeInTheDocument();

      // Check the preview section specifically
      const previewSection = screen.getByText("Binding Preview").closest("div");
      expect(previewSection).toBeInTheDocument();

      // Check individual parts of the preview within the preview section
      expect(previewSection).toHaveTextContent("Source:");
      expect(previewSection).toHaveTextContent("test-exchange");
      expect(previewSection).toHaveTextContent("(exchange)");

      expect(previewSection).toHaveTextContent("Destination:");
      expect(previewSection).toHaveTextContent("my-queue");
      expect(previewSection).toHaveTextContent("(queue)");

      expect(previewSection).toHaveTextContent("Routing Key:");
      expect(previewSection).toHaveTextContent("user.created");
    });

    it("shows empty values in preview when form is not filled", () => {
      const propsWithoutSource = {
        ...defaultProps,
        sourceResource: undefined,
      };
      render(<CreateBindingDialog {...propsWithoutSource} />);

      // Check for the preview section
      expect(screen.getByText("Binding Preview")).toBeInTheDocument();

      // Check for empty routing key - use a more flexible matcher
      expect(screen.getByText(/\(empty\)/)).toBeInTheDocument();

      // Check for not specified destination (when destination field is empty)
      const previewSection = screen.getByText("Binding Preview").closest("div");
      expect(previewSection).toHaveTextContent("(not specified)");
    });
  });
});
