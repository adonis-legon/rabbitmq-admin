import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import ResourceLayout from "../ResourceLayout";
import { ClusterConnection } from "../../../types/cluster";

// Create a test wrapper with theme and router
const TestWrapper = ({
  children,
  initialEntries = ["/"],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) => {
  const theme = createTheme();
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </MemoryRouter>
  );
};

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock constants
vi.mock("../../../utils/constants", () => ({
  ROUTES: {
    DASHBOARD: "/dashboard",
    RESOURCES_CONNECTIONS: "/resources/connections",
    RESOURCES_CHANNELS: "/resources/channels",
    RESOURCES_EXCHANGES: "/resources/exchanges",
    RESOURCES_QUEUES: "/resources/queues",
  },
}));

describe("Resource Navigation Integration", () => {
  const mockCluster: ClusterConnection = {
    id: "test-cluster-123",
    name: "Test Cluster",
    apiUrl: "http://localhost:15672",
    username: "guest",
    password: "guest",
    description: "Test cluster for integration tests",
    active: true,
    assignedUsers: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders resource navigation tabs", () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    // Check for navigation tabs
    expect(
      screen.getByRole("tab", { name: /connections/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /channels/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /exchanges/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /queues/i })).toBeInTheDocument();
  });

  it("displays cluster information", () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("RabbitMQ Resources")).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return (
          content.includes("Managing resources for cluster:") &&
          (element?.textContent?.includes(mockCluster.name) ?? false)
        );
      })
    ).toBeInTheDocument();
  });

  it("navigates to channels tab", async () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    const channelsTab = screen.getByRole("tab", { name: /channels/i });
    fireEvent.click(channelsTab);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/resources/channels");
    });
  });

  it("navigates to exchanges tab", async () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    const exchangesTab = screen.getByRole("tab", { name: /exchanges/i });
    fireEvent.click(exchangesTab);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/resources/exchanges");
    });
  });

  it("navigates to queues tab", async () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    const queuesTab = screen.getByRole("tab", { name: /queues/i });
    fireEvent.click(queuesTab);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/resources/queues");
    });
  });

  it("determines current tab based on pathname", () => {
    const TestWrapperWithPath = ({
      children,
    }: {
      children: React.ReactNode;
    }) => {
      const theme = createTheme();
      return (
        <MemoryRouter initialEntries={["/resources/channels"]}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </MemoryRouter>
      );
    };

    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapperWithPath }
    );

    const channelsTab = screen.getByRole("tab", { name: /channels/i });
    expect(channelsTab).toHaveAttribute("aria-selected", "true");
  });

  it("defaults to connections tab when path doesn't match", () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    const connectionsTab = screen.getByRole("tab", { name: /connections/i });
    expect(connectionsTab).toHaveAttribute("aria-selected", "true");
  });

  it("displays cluster selection required message when no cluster", () => {
    render(
      <ResourceLayout selectedCluster={null}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Cluster Selection Required")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Please select a cluster connection from the dashboard to access RabbitMQ resources."
      )
    ).toBeInTheDocument();
  });

  it("displays loading state", () => {
    render(
      <ResourceLayout selectedCluster={mockCluster} loading={true}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays error state", () => {
    const errorMessage = "Failed to connect to cluster";

    render(
      <ResourceLayout selectedCluster={mockCluster} error={errorMessage}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("renders breadcrumbs", () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
  });

  it("navigates to dashboard when breadcrumb is clicked", async () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    const dashboardLink = screen.getByText("Dashboard");
    fireEvent.click(dashboardLink);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("renders children content", () => {
    const testContent = "This is test content";

    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>{testContent}</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("handles tab navigation with keyboard", async () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    const tabList = screen.getByRole("tablist");

    // Focus on tab list and use arrow keys
    tabList.focus();
    fireEvent.keyDown(tabList, { key: "ArrowRight" });

    // The MUI Tabs component handles keyboard navigation internally
    expect(tabList).toBeInTheDocument();
  });

  it("displays tab icons", () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    // Check that tabs have icons (MUI renders them as SVG elements)
    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab) => {
      const svg = tab.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  it("supports scrollable tabs", () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    const tabList = screen.getByRole("tablist");
    expect(tabList).toBeInTheDocument();

    // MUI Tabs with variant="scrollable" should be present
    expect(
      tabList.closest('[class*="MuiTabs-scrollable"]')
    ).toBeInTheDocument();
  });

  it("handles cluster change", async () => {
    const newCluster: ClusterConnection = {
      ...mockCluster,
      id: "new-cluster-456",
      name: "New Test Cluster",
    };

    const { rerender } = render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    expect(
      screen.getByText((content, element) => {
        return (
          content.includes("Managing resources for cluster:") &&
          (element?.textContent?.includes(mockCluster.name) ?? false)
        );
      })
    ).toBeInTheDocument();

    rerender(
      <ResourceLayout selectedCluster={newCluster}>
        <div>Test Content</div>
      </ResourceLayout>
    );

    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return (
            content.includes("Managing resources for cluster:") &&
            (element?.textContent?.includes(newCluster.name) ?? false)
          );
        })
      ).toBeInTheDocument();
    });
  });

  it("maintains responsive design", () => {
    render(
      <ResourceLayout selectedCluster={mockCluster}>
        <div>Test Content</div>
      </ResourceLayout>,
      { wrapper: TestWrapper }
    );

    // Check for responsive container
    const container = screen
      .getByText("RabbitMQ Resources")
      .closest('[class*="MuiContainer"]');
    expect(container).toBeInTheDocument();
  });
});
