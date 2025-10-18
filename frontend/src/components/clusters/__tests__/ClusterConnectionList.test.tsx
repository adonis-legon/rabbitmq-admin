import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi, type MockedFunction } from "vitest";
import ClusterConnectionList from "../ClusterConnectionList";
import { useClusters } from "../../../hooks/useClusters";
import { NotificationProvider } from "../../../contexts/NotificationContext";

// Mock the hooks and dependencies
const mockUseClusters = useClusters as MockedFunction<typeof useClusters>;

vi.mock("../../../hooks/useClusters");
vi.mock("../../../contexts/NotificationContext", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockClusters = [
  {
    id: "1",
    name: "Production Cluster",
    apiUrl: "https://prod.example.com:15672",
    username: "admin",
    password: "password123",
    description: "Production environment",
    active: true,
    assignedUsers: [],
  },
  {
    id: "2",
    name: "Development Cluster",
    apiUrl: "https://dev.example.com:15672",
    username: "dev-admin",
    password: "devpass123",
    description: "Development environment",
    active: false,
    assignedUsers: [],
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <NotificationProvider>
        <ClusterConnectionList />
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe("ClusterConnectionList", () => {
  beforeEach(() => {
    mockUseClusters.mockReturnValue({
      clusters: mockClusters,
      loading: false,
      error: null,
      loadClusters: vi.fn(),
      createCluster: vi.fn(),
      updateCluster: vi.fn(),
      deleteCluster: vi.fn(),
      testConnection: vi.fn(),
      testNewConnection: vi.fn(),
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders cluster list correctly", () => {
    renderComponent();

    expect(screen.getByText("Production Cluster")).toBeInTheDocument();
    expect(screen.getByText("Development Cluster")).toBeInTheDocument();
  });

  it("shows correct empty state when no clusters exist", () => {
    mockUseClusters.mockReturnValue({
      clusters: [],
      loading: false,
      error: null,
      loadClusters: vi.fn(),
      createCluster: vi.fn(),
      updateCluster: vi.fn(),
      deleteCluster: vi.fn(),
      testConnection: vi.fn(),
      testNewConnection: vi.fn(),
      clearError: vi.fn(),
    });

    renderComponent();

    expect(
      screen.getByText(
        "No cluster connections found. Create your first connection to get started."
      )
    ).toBeInTheDocument();
  });

  it("filters clusters by search term", async () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(
      "Search clusters by name, URL, username, or description..."
    );

    fireEvent.change(searchInput, { target: { value: "Production" } });

    await waitFor(() => {
      expect(screen.getByText("Production Cluster")).toBeInTheDocument();
      expect(screen.queryByText("Development Cluster")).not.toBeInTheDocument();
    });
  });

  it("shows filtered empty state when no clusters match filters", async () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(
      "Search clusters by name, URL, username, or description..."
    );

    fireEvent.change(searchInput, { target: { value: "NonExistent" } });

    await waitFor(() => {
      expect(
        screen.getByText("No clusters match the current filters.")
      ).toBeInTheDocument();
    });
  });

  it("filters clusters by status", async () => {
    renderComponent();

    // Open status filter dropdown
    const statusFilter = screen.getByLabelText("Status");
    fireEvent.mouseDown(statusFilter);

    // Select "Active" option from the dropdown menu (not from the table)
    const dropdownMenu = screen.getByRole("listbox");
    const activeOption = within(dropdownMenu).getByText("Active");
    fireEvent.click(activeOption);

    await waitFor(() => {
      expect(screen.getByText("Production Cluster")).toBeInTheDocument();
      expect(screen.queryByText("Development Cluster")).not.toBeInTheDocument();
    });
  });

  it("clears all filters when clear button is clicked", async () => {
    renderComponent();

    // Apply search filter
    const searchInput = screen.getByPlaceholderText(
      "Search clusters by name, URL, username, or description..."
    );
    fireEvent.change(searchInput, { target: { value: "Production" } });

    await waitFor(() => {
      expect(screen.queryByText("Development Cluster")).not.toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByText("Clear All");
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText("Production Cluster")).toBeInTheDocument();
      expect(screen.getByText("Development Cluster")).toBeInTheDocument();
    });
  });

  it("shows loading state", () => {
    mockUseClusters.mockReturnValue({
      clusters: [],
      loading: true,
      error: null,
      loadClusters: vi.fn(),
      createCluster: vi.fn(),
      updateCluster: vi.fn(),
      deleteCluster: vi.fn(),
      testConnection: vi.fn(),
      testNewConnection: vi.fn(),
      clearError: vi.fn(),
    });

    renderComponent();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows error state", () => {
    const errorMessage = "Failed to load clusters";
    mockUseClusters.mockReturnValue({
      clusters: [],
      loading: false,
      error: errorMessage,
      loadClusters: vi.fn(),
      createCluster: vi.fn(),
      updateCluster: vi.fn(),
      deleteCluster: vi.fn(),
      testConnection: vi.fn(),
      testNewConnection: vi.fn(),
      clearError: vi.fn(),
    });

    renderComponent();

    expect(screen.getAllByText(errorMessage)).toHaveLength(2);
  });
});
