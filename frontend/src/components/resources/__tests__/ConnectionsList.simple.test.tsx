import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Mock the hook with a factory function
vi.mock("../../../hooks/useConnections", () => ({
  useConnections: vi.fn(),
}));

// Mock all the components
vi.mock("../shared/ResourceTable", () => ({
  default: ({ data }: any) => (
    <div data-testid="resource-table">
      {data.map((item: any) => (
        <div key={item.id}>
          <span>{item.bytesReceived}</span>
          <span>{item.bytesSent}</span>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../shared/ResourceFilters", () => ({
  default: () => <div data-testid="resource-filters">Filters</div>,
}));

vi.mock("../shared/RefreshControls", () => ({
  default: () => <div data-testid="refresh-controls">Refresh</div>,
}));

vi.mock("../ConnectionDetailModal", () => ({
  default: () => null,
}));

import ConnectionsList from "../ConnectionsList";
import { useConnections } from "../../../hooks/useConnections";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe("ConnectionsList Simple Test", () => {
  it("displays formatted bytes correctly", () => {
    // Mock the hook to return test data
    vi.mocked(useConnections).mockReturnValue({
      data: {
        items: [
          {
            name: "test-connection",
            state: "running" as const,
            channels: 2,
            client_properties: {
              connection_name: "Test Connection",
              platform: "Test Platform",
              product: "Test Product",
              version: "1.0.0",
            },
            host: "localhost",
            peer_host: "127.0.0.1",
            port: 5672,
            peer_port: 54321,
            protocol: "AMQP 0-9-1",
            user: "test-user",
            vhost: "/",
            timeout: 60,
            frame_max: 131072,
            recv_oct: 1024000,
            recv_cnt: 100,
            send_oct: 512000,
            send_cnt: 50,
            connected_at: Date.now() - 3600000, // 1 hour ago
          },
        ],
        page: 0,
        pageSize: 50,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      lastUpdated: new Date(),
      loadConnections: vi.fn(),
      refreshConnections: vi.fn(),
      clearError: vi.fn(),
      invalidateCache: vi.fn(),
    });

    render(<ConnectionsList clusterId="test" />, { wrapper: TestWrapper });

    // Check if the formatted bytes are displayed
    expect(screen.getByText("1000 KB")).toBeInTheDocument();
    expect(screen.getByText("500 KB")).toBeInTheDocument();
  });
});
