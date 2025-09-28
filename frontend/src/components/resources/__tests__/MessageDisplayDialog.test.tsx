import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MessageDisplayDialog from "../MessageDisplayDialog";
import { useNotification } from "../../../contexts/NotificationContext";
import { Message } from "../../../types/rabbitmq";

// Mock the notification context
vi.mock("../../../contexts/NotificationContext");
const mockUseNotification = vi.mocked(useNotification);

const mockNotifications = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  showNotification: vi.fn(),
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

const mockMessages: Message[] = [
  {
    payloadEncoding: "string",
    payload: '{"message": "Hello World", "timestamp": "2023-01-01T00:00:00Z"}',
    properties: {
      delivery_mode: 2,
      priority: 1,
      correlation_id: "test-correlation-id",
      headers: {
        "x-custom-header": "custom-value",
        "x-retry-count": 3,
      },
    },
    routingKey: "test.routing.key",
    redelivered: false,
    exchange: "test-exchange",
    messageCount: 5,
  },
  {
    payloadEncoding: "base64",
    payload: "SGVsbG8gV29ybGQ=", // "Hello World" in base64
    properties: {
      delivery_mode: 1,
      message_id: "msg-123",
    },
    routingKey: "another.key",
    redelivered: true,
    exchange: "another-exchange",
    messageCount: 3,
  },
];

const mockEmptyMessages: Message[] = [];

describe("MessageDisplayDialog", () => {
  const defaultProps = {
    open: true,
    messages: mockMessages,
    queueName: "test-queue",
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotification.mockReturnValue(mockNotifications);
  });

  it("renders dialog with correct title and message count", () => {
    renderWithTheme(<MessageDisplayDialog {...defaultProps} />);

    expect(
      screen.getByText('Messages from Queue "test-queue"')
    ).toBeInTheDocument();
    expect(screen.getByText("2 messages")).toBeInTheDocument();
  });

  it("renders empty state when no messages", () => {
    renderWithTheme(
      <MessageDisplayDialog {...defaultProps} messages={mockEmptyMessages} />
    );

    expect(
      screen.getByText("No messages were retrieved from the queue.")
    ).toBeInTheDocument();
  });

  it("displays message summary information", () => {
    renderWithTheme(<MessageDisplayDialog {...defaultProps} />);

    // Check first message summary
    expect(screen.getByText("Message 1")).toBeInTheDocument();
    expect(screen.getByText("Exchange: test-exchange")).toBeInTheDocument();
    expect(screen.getByText("Key: test.routing.key")).toBeInTheDocument();
    expect(screen.getByText("STRING")).toBeInTheDocument();
    expect(screen.getByText("FIRST DELIVERY")).toBeInTheDocument();
    expect(screen.getByText("Queue depth: 5")).toBeInTheDocument();

    // Check second message summary
    expect(screen.getByText("Message 2")).toBeInTheDocument();
    expect(screen.getByText("Exchange: another-exchange")).toBeInTheDocument();
    expect(screen.getByText("Key: another.key")).toBeInTheDocument();
    expect(screen.getByText("BASE64")).toBeInTheDocument();
    expect(screen.getByText("REDELIVERED")).toBeInTheDocument();
    expect(screen.getByText("Queue depth: 3")).toBeInTheDocument();
  });

  it("expands first message by default", () => {
    renderWithTheme(<MessageDisplayDialog {...defaultProps} />);

    // First message should be expanded (payload visible)
    expect(
      screen.getByText(
        '{"message": "Hello World", "timestamp": "2023-01-01T00:00:00Z"}'
      )
    ).toBeInTheDocument();
  });

  it("can expand and collapse messages", async () => {
    renderWithTheme(<MessageDisplayDialog {...defaultProps} />);

    // Wait for initial render - both accordions should be present
    await waitFor(() => {
      expect(screen.getByText("Message 1")).toBeInTheDocument();
      expect(screen.getByText("Message 2")).toBeInTheDocument();
    });

    // Check that accordions can be found and are in correct initial state
    const allAccordions = document.querySelectorAll('.MuiAccordion-root');
    expect(allAccordions).toHaveLength(2);

    // Verify first accordion is expanded (has Mui-expanded class)
    expect(allAccordions[0]).toHaveClass('Mui-expanded');
    // Verify second accordion is collapsed (no Mui-expanded class)
    expect(allAccordions[1]).not.toHaveClass('Mui-expanded');

    // Click to expand the second accordion
    const secondAccordionSummary = allAccordions[1].querySelector('.MuiAccordionSummary-root');
    expect(secondAccordionSummary).toBeTruthy();

    await act(() => {
      fireEvent.click(secondAccordionSummary as Element);
    });

    // Verify both accordions are now expanded
    await waitFor(() => {
      const updatedAccordions = document.querySelectorAll('.MuiAccordion-root');
      expect(updatedAccordions[0]).toHaveClass('Mui-expanded');
      expect(updatedAccordions[1]).toHaveClass('Mui-expanded');
    });

    // Click to collapse the first accordion
    const firstAccordionSummary = allAccordions[0].querySelector('.MuiAccordionSummary-root');

    await act(() => {
      fireEvent.click(firstAccordionSummary as Element);
    });

    // Verify first is collapsed and second is still expanded
    await waitFor(() => {
      const finalAccordions = document.querySelectorAll('.MuiAccordion-root');
      expect(finalAccordions[0]).not.toHaveClass('Mui-expanded');
      expect(finalAccordions[1]).toHaveClass('Mui-expanded');
    });
  });

  it("displays message properties correctly", () => {
    renderWithTheme(<MessageDisplayDialog {...defaultProps} />);

    // Check properties section - both messages have properties so use getAllBy
    const propertiesSections = screen.getAllByText("Properties");
    expect(propertiesSections.length).toBeGreaterThan(0);

    // Use getAllBy for properties that exist in multiple messages
    expect(screen.getAllByText("delivery_mode:")[0]).toBeInTheDocument();
    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Use getAllBy since multiple messages can have same values
    expect(screen.getByText("priority:")).toBeInTheDocument();
    expect(screen.getAllByText("1")[0]).toBeInTheDocument(); // Use getAllBy for repeated values
    expect(screen.getByText("correlation_id:")).toBeInTheDocument();
    expect(screen.getByText("test-correlation-id")).toBeInTheDocument();
  });

  it("displays message headers correctly", () => {
    renderWithTheme(<MessageDisplayDialog {...defaultProps} />);

    // Check headers section
    expect(screen.getByText("Headers")).toBeInTheDocument();
    expect(screen.getByText("x-custom-header:")).toBeInTheDocument();
    expect(screen.getByText("custom-value")).toBeInTheDocument();
    expect(screen.getByText("x-retry-count:")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("handles base64 payload decoding", async () => {
    const user = userEvent.setup();
    renderWithTheme(<MessageDisplayDialog {...defaultProps} />);

    // Expand second message (base64 encoded)
    const message2Header = screen.getByText("Message 2");
    await user.click(message2Header);

    await waitFor(() => {
      // Should show decoded content
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  it("shows binary indicator for binary data", async () => {
    const binaryMessage: Message = {
      payloadEncoding: "base64",
      payload: "AAECAwQFBgcICQoLDA0ODw==", // Binary data
      properties: {},
    };

    renderWithTheme(
      <MessageDisplayDialog {...defaultProps} messages={[binaryMessage]} />
    );

    // Should show BINARY chip
    expect(screen.getByText("BINARY")).toBeInTheDocument();
  });

  it("displays empty payload message", () => {
    const emptyPayloadMessage: Message = {
      payloadEncoding: "string",
      payload: "",
      properties: {},
    };

    renderWithTheme(
      <MessageDisplayDialog
        {...defaultProps}
        messages={[emptyPayloadMessage]}
      />
    );

    expect(screen.getByText("(empty payload)")).toBeInTheDocument();
  });

  it("formats complex property values as JSON", async () => {
    const complexMessage: Message = {
      payloadEncoding: "string",
      payload: "test",
      properties: {
        complex_property: {
          nested: {
            value: "test",
            array: [1, 2, 3],
          },
        },
      },
    };

    renderWithTheme(
      <MessageDisplayDialog {...defaultProps} messages={[complexMessage]} />
    );

    // Should format complex object as JSON
    expect(screen.getByText("complex_property:")).toBeInTheDocument();
    expect(screen.getByText(/"nested"/)).toBeInTheDocument();
  });

  it("shows property types correctly", () => {
    renderWithTheme(<MessageDisplayDialog {...defaultProps} />);

    // Check type indicators - multiple types exist so use getAllBy
    const numberTypes = screen.getAllByText("(number)");
    expect(numberTypes.length).toBeGreaterThan(0);

    const stringTypes = screen.getAllByText("(string)");
    expect(stringTypes.length).toBeGreaterThan(0);
  });

  it("handles null and undefined property values", () => {
    const messageWithNulls: Message = {
      payloadEncoding: "string",
      payload: "test",
      properties: {
        null_value: null,
        undefined_value: undefined,
      },
    };

    renderWithTheme(
      <MessageDisplayDialog {...defaultProps} messages={[messageWithNulls]} />
    );

    expect(screen.getAllByText("null")).toHaveLength(2);
    expect(screen.getAllByText("(null)")).toHaveLength(2);
  });

  it("does not show properties section when no properties", () => {
    const messageWithoutProps: Message = {
      payloadEncoding: "string",
      payload: "test message",
      properties: {},
    };

    renderWithTheme(
      <MessageDisplayDialog
        {...defaultProps}
        messages={[messageWithoutProps]}
      />
    );

    expect(screen.queryByText("Properties")).not.toBeInTheDocument();
  });

  it("does not show headers section when no headers", () => {
    const messageWithoutHeaders: Message = {
      payloadEncoding: "string",
      payload: "test message",
      properties: {
        delivery_mode: 2,
        // no headers property
      },
    };

    renderWithTheme(
      <MessageDisplayDialog
        {...defaultProps}
        messages={[messageWithoutHeaders]}
      />
    );

    expect(screen.queryByText("Headers")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();

    renderWithTheme(
      <MessageDisplayDialog {...defaultProps} onClose={onClose} />
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    await userEvent.setup().click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("handles messages without optional fields", () => {
    const minimalMessage: Message = {
      payloadEncoding: "string",
      payload: "minimal message",
    };

    renderWithTheme(
      <MessageDisplayDialog {...defaultProps} messages={[minimalMessage]} />
    );

    expect(screen.getByText("Message 1")).toBeInTheDocument();
    expect(screen.getByText("minimal message")).toBeInTheDocument();
    // Should not show chips for missing fields
    expect(screen.queryByText("Exchange:")).not.toBeInTheDocument();
    expect(screen.queryByText("Key:")).not.toBeInTheDocument();
    expect(screen.queryByText("REDELIVERED")).not.toBeInTheDocument();
    expect(screen.queryByText("Queue depth:")).not.toBeInTheDocument();
  });

  it("handles invalid base64 payload gracefully", async () => {
    const invalidBase64Message: Message = {
      payloadEncoding: "base64",
      payload: "invalid-base64-content!@#$",
      properties: {},
    };

    renderWithTheme(
      <MessageDisplayDialog
        {...defaultProps}
        messages={[invalidBase64Message]}
      />
    );

    // Should show original payload when base64 decoding fails
    expect(screen.getByText("invalid-base64-content!@#$")).toBeInTheDocument();
    expect(screen.getByText("BINARY")).toBeInTheDocument();
  });
});
