import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ChannelDetailModal from "../ChannelDetailModal";
import { RabbitMQChannel } from "../../../types/rabbitmq";

// Mock the hooks
vi.mock("../../../hooks/useChannels", () => ({
  useChannels: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
    loadChannels: vi.fn(),
    refreshChannels: vi.fn(),
    clearError: vi.fn(),
  })),
}));

// Mock useDetailRefresh hook
vi.mock("../../../hooks/useDetailRefresh", () => ({
  useDetailRefresh: vi.fn(() => ({
    refreshing: false,
    lastUpdated: null,
    autoRefresh: false,
    refreshInterval: 30,
    handleRefresh: vi.fn(),
    setAutoRefresh: vi.fn(),
    setRefreshInterval: vi.fn(),
  })),
}));

// Mock NotificationContext
vi.mock("../../../contexts/NotificationContext", () => ({
  useNotification: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  })),
}));

// Mock RefreshControls component
vi.mock("../shared/RefreshControls", () => ({
  default: ({ onRefresh, loading }: any) => (
    <div data-testid="refresh-controls">
      <button onClick={onRefresh} disabled={loading}>
        Refresh
      </button>
    </div>
  ),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

const mockChannel: RabbitMQChannel = {
  name: "test-channel-1",
  connection_details: {
    name: "test-connection",
    peer_host: "192.168.1.100",
  },
  number: 1,
  state: "running",
  consumer_count: 2,
  messages_unacknowledged: 5,
  messages_unconfirmed: 3,
  messages_uncommitted: 1,
  acks_uncommitted: 2,
  prefetch_count: 10,
  global_prefetch_count: 0,
  transactional: true,
  confirm: true,
  user: "test-user",
  vhost: "/test",
  consumer_details: [
    {
      consumer_tag: "consumer-1",
      queue: {
        name: "test-queue-1",
        vhost: "/test",
      },
      ack_required: true,
      prefetch_count: 5,
      arguments: {
        "x-priority": 10,
        "x-consumer-timeout": 30000,
      },
    },
    {
      consumer_tag: "consumer-2",
      queue: {
        name: "test-queue-2",
        vhost: "/test",
      },
      ack_required: false,
      prefetch_count: 0,
      arguments: {},
    },
  ],
  message_stats: {
    ack: 100,
    ack_details: { rate: 5.2 },
    deliver: 150,
    deliver_details: { rate: 7.8 },
    deliver_get: 120,
    deliver_get_details: { rate: 6.1 },
    deliver_no_ack: 30,
    deliver_no_ack_details: { rate: 1.5 },
    get: 80,
    get_details: { rate: 4.0 },
    get_no_ack: 20,
    get_no_ack_details: { rate: 1.0 },
    publish: 200,
    publish_details: { rate: 10.5 },
    redeliver: 5,
    redeliver_details: { rate: 0.2 },
  },
};

const mockChannelWithoutConsumers: RabbitMQChannel = {
  ...mockChannel,
  name: "test-channel-no-consumers",
  consumer_count: 0,
  consumer_details: [],
};

describe("ChannelDetailModal", () => {
  const mockClusterId = "test-cluster-id";
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal when open with channel data", () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={mockChannel}
        clusterId={mockClusterId}
      />
    );

    // Check modal title and channel info
    expect(screen.getByText("Channel Details")).toBeInTheDocument();
    expect(screen.getByText("test-channel-1 (Channel #1)")).toBeInTheDocument();

    // Check channel overview section exists
    expect(screen.getByText("Channel Overview")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByText("test-connection")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ChannelDetailModal
        open={false}
        onClose={mockOnClose}
        channel={mockChannel}
        clusterId={mockClusterId}
      />
    );

    expect(screen.queryByText("Channel Details")).not.toBeInTheDocument();
  });

  it("does not render when channel is null", () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={null}
        clusterId={mockClusterId}
      />
    );

    expect(screen.queryByText("Channel Details")).not.toBeInTheDocument();
  });

  it("displays channel information correctly", () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={mockChannel}
        clusterId={mockClusterId}
      />
    );

    // Check channel information section
    expect(screen.getByText("test-user")).toBeInTheDocument();
    expect(screen.getAllByText("/test").length).toBeGreaterThanOrEqual(2); // vhost appears in multiple places
    expect(screen.getByText("192.168.1.100")).toBeInTheDocument();
  });

  it("displays prefetch settings and transaction state", () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={mockChannel}
        clusterId={mockClusterId}
      />
    );

    // Check prefetch settings section exists
    expect(screen.getByText("Prefetch Settings")).toBeInTheDocument();
    expect(screen.getByText("Local Prefetch Count:")).toBeInTheDocument();
    expect(screen.getByText("Global Prefetch Count:")).toBeInTheDocument();

    // Check transaction state section exists
    expect(screen.getByText("Transaction State")).toBeInTheDocument();
    expect(screen.getByText("Transactional:")).toBeInTheDocument();
    expect(screen.getByText("Publisher Confirms:")).toBeInTheDocument();

    // Check transaction state chips
    const yesChips = screen.getAllByText("Yes");
    expect(yesChips.length).toBeGreaterThanOrEqual(2); // transactional and confirm both true
  });

  it("displays message statistics correctly", () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={mockChannel}
        clusterId={mockClusterId}
      />
    );

    // Check that message statistics section exists
    expect(screen.getByText("Message Statistics")).toBeInTheDocument();
    expect(screen.getByText("Unacknowledged Messages")).toBeInTheDocument();
    expect(screen.getByText("Unconfirmed Messages")).toBeInTheDocument();
    expect(screen.getByText("Uncommitted Messages")).toBeInTheDocument();

    // Check message rates section exists
    expect(screen.getByText("Message Rates")).toBeInTheDocument();
    expect(screen.getByText("Publish Rate")).toBeInTheDocument();
    expect(screen.getByText("Deliver Rate")).toBeInTheDocument();
    expect(screen.getByText("Acknowledge Rate")).toBeInTheDocument();
  });

  it("displays consumer details correctly", () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={mockChannel}
        clusterId={mockClusterId}
      />
    );

    // Check consumer details section
    expect(screen.getByText("Consumer Details (2)")).toBeInTheDocument();

    // Check individual consumers
    expect(screen.getByText("consumer-1")).toBeInTheDocument();
    expect(screen.getByText("consumer-2")).toBeInTheDocument();
    expect(screen.getByText("test-queue-1")).toBeInTheDocument();
    expect(screen.getByText("test-queue-2")).toBeInTheDocument();

    // Check acknowledgment modes
    expect(screen.getByText("Manual Ack")).toBeInTheDocument();
    expect(screen.getByText("Auto Ack")).toBeInTheDocument();

    // Check consumer arguments
    expect(screen.getByText("x-priority: 10")).toBeInTheDocument();
    expect(screen.getByText("x-consumer-timeout: 30000")).toBeInTheDocument();
  });

  it("displays no consumers message when no consumers exist", () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={mockChannelWithoutConsumers}
        clusterId={mockClusterId}
      />
    );

    expect(screen.getByText("Consumer Details (0)")).toBeInTheDocument();
    expect(
      screen.getByText("No consumers are currently active on this channel.")
    ).toBeInTheDocument();
  });

  it("handles close button click", () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={mockChannel}
        clusterId={mockClusterId}
      />
    );

    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles copy to clipboard functionality", async () => {
    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={mockChannel}
        clusterId={mockClusterId}
      />
    );

    // Find and click a copy button (there should be multiple)
    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it("formats numbers correctly", () => {
    const channelWithLargeNumbers: RabbitMQChannel = {
      ...mockChannel,
      messages_unacknowledged: 1234567,
      messages_unconfirmed: 987654,
      messages_uncommitted: 456789,
    };

    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={channelWithLargeNumbers}
        clusterId={mockClusterId}
      />
    );

    // Check formatted large numbers
    expect(screen.getByText("1,234,567")).toBeInTheDocument();
    expect(screen.getByText("987,654")).toBeInTheDocument();
    expect(screen.getByText("456,789")).toBeInTheDocument();
  });

  it("handles channel without message stats", () => {
    const channelWithoutStats: RabbitMQChannel = {
      ...mockChannel,
      message_stats: undefined,
    };

    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={channelWithoutStats}
        clusterId={mockClusterId}
      />
    );

    // Should still render without errors
    expect(screen.getByText("Channel Details")).toBeInTheDocument();
    expect(screen.getByText("Message Statistics")).toBeInTheDocument();
  });

  it("displays correct state icons and colors", () => {
    const flowChannel: RabbitMQChannel = {
      ...mockChannel,
      state: "flow",
    };

    render(
      <ChannelDetailModal
        open={true}
        onClose={mockOnClose}
        channel={flowChannel}
        clusterId={mockClusterId}
      />
    );

    // Check that flow state is displayed
    expect(screen.getByText("flow")).toBeInTheDocument();
  });
});
