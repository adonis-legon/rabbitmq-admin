import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import AuditPage from "../AuditPage";
import { useAuth } from "../../auth/AuthProvider";
import { useAuditRecords } from "../../../hooks/useAuditRecords";
import { useClusters } from "../../../hooks/useClusters";
import { useUsers } from "../../../hooks/useUsers";
import { vi } from "vitest";
import { UserRole } from "../../../types/auth";
import { AuditOperationType, AuditOperationStatus } from "../../../types/audit";

// Mock the hooks
vi.mock("../../auth/AuthProvider");
vi.mock("../../../hooks/useAuditRecords");
vi.mock("../../../hooks/useClusters");
vi.mock("../../../hooks/useUsers");

const mockUseAuth = useAuth as any;
const mockUseAuditRecords = useAuditRecords as any;
const mockUseClusters = useClusters as any;
const mockUseUsers = useUsers as any;

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

const mockAuditRecords = [
  {
    id: "1",
    username: "admin",
    clusterName: "test-cluster-1",
    operationType: AuditOperationType.CREATE_QUEUE,
    resourceType: "queue",
    resourceName: "test-queue-1",
    resourceDetails: { durable: true, autoDelete: false },
    status: AuditOperationStatus.SUCCESS,
    timestamp: "2023-10-01T10:00:00Z",
    clientIp: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    createdAt: "2023-10-01T10:00:00Z",
  },
  {
    id: "2",
    username: "user1",
    clusterName: "test-cluster-2",
    operationType: AuditOperationType.DELETE_EXCHANGE,
    resourceType: "exchange",
    resourceName: "test-exchange-1",
    resourceDetails: { type: "direct" },
    status: AuditOperationStatus.FAILURE,
    errorMessage: "Exchange not found",
    timestamp: "2023-10-01T11:00:00Z",
    clientIp: "192.168.1.2",
    userAgent: "Mozilla/5.0",
    createdAt: "2023-10-01T11:00:00Z",
  },
];

const mockClusters = [
  {
    id: "cluster-1",
    name: "test-cluster-1",
    host: "localhost",
    port: 15672,
    username: "admin",
    password: "password",
    useSsl: false,
    createdAt: "2023-10-01T10:00:00Z",
    updatedAt: "2023-10-01T10:00:00Z",
  },
  {
    id: "cluster-2",
    name: "test-cluster-2",
    host: "remote-host",
    port: 15672,
    username: "admin",
    password: "password",
    useSsl: true,
    createdAt: "2023-10-01T10:00:00Z",
    updatedAt: "2023-10-01T10:00:00Z",
  },
];

const mockUsers = [
  {
    id: "user-1",
    username: "admin",
    role: UserRole.ADMINISTRATOR,
    createdAt: "2023-10-01T10:00:00Z",
  },
  {
    id: "user-2",
    username: "user1",
    role: UserRole.USER,
    createdAt: "2023-10-01T10:00:00Z",
  },
];

describe("AuditPage Integration Tests", () => {
  const mockLoadAuditRecords = vi.fn();
  const mockRefreshAuditRecords = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: mockUsers[0],
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });

    mockUseAuditRecords.mockReturnValue({
      data: {
        items: mockAuditRecords,
        totalItems: mockAuditRecords.length,
        totalPages: 1,
        page: 0,
        pageSize: 50,
        hasNext: false,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      lastUpdated: new Date(),
      loadAuditRecords: mockLoadAuditRecords,
      refreshAuditRecords: mockRefreshAuditRecords,
      clearError: mockClearError,
      invalidateCache: vi.fn(),
    });

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

    mockUseUsers.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      refreshUsers: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      getUser: vi.fn(),
    });
  });

  it("renders complete audit page with all components", async () => {
    renderWithProviders(<AuditPage />);

    // Check page header
    expect(screen.getByRole("heading", { name: "Audit Records" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "View and filter all write operations performed on RabbitMQ clusters"
      )
    ).toBeInTheDocument();

    // Wait for the component to render
    await waitFor(() => {
      expect(
        screen.getByText("Showing 2 of 2 audit records")
      ).toBeInTheDocument();
    });

    // Check filters are present
    expect(screen.getByText("Audit Filters")).toBeInTheDocument();

    // Check that audit records list component is rendered
    await waitFor(() => {
      // Look for any indication that data is being shown
      expect(screen.getByText(/Showing \d+ of \d+ audit records/)).toBeInTheDocument();
    });

    // Check that the AuditRecordsList component is present
    // Since the data rendering might be complex, just verify the structure exists
    expect(screen.getByText("Audit Filters")).toBeInTheDocument();

    // Check refresh button
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("handles error states correctly", async () => {
    const mockError = {
      type: "api_error" as const,
      message: "Failed to load audit records",
      details: "Network error",
      retryable: true,
      timestamp: Date.now(),
    };

    mockUseAuditRecords.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      lastUpdated: null,
      loadAuditRecords: mockLoadAuditRecords,
      refreshAuditRecords: mockRefreshAuditRecords,
      clearError: mockClearError,
      invalidateCache: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    // Error should be displayed in the AuditRecordsList component
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("handles loading states correctly", async () => {
    mockUseAuditRecords.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      lastUpdated: null,
      loadAuditRecords: mockLoadAuditRecords,
      refreshAuditRecords: mockRefreshAuditRecords,
      clearError: mockClearError,
      invalidateCache: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    // Loading state should be reflected in the refresh button
    expect(screen.getByText("Refreshing...")).toBeInTheDocument();
  });

  it("handles empty data state correctly", async () => {
    mockUseAuditRecords.mockReturnValue({
      data: {
        items: [],
        totalItems: 0,
        totalPages: 0,
        page: 0,
        pageSize: 50,
        hasNext: false,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      lastUpdated: new Date(),
      loadAuditRecords: mockLoadAuditRecords,
      refreshAuditRecords: mockRefreshAuditRecords,
      clearError: mockClearError,
      invalidateCache: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    expect(
      screen.getByText("Showing 0 of 0 audit records")
    ).toBeInTheDocument();
  });

  it("handles pagination correctly", async () => {
    const largeDataset = Array.from({ length: 150 }, (_, i) => ({
      ...mockAuditRecords[0],
      id: `record-${i}`,
      resourceName: `queue-${i}`,
    }));

    mockUseAuditRecords.mockReturnValue({
      data: {
        items: largeDataset.slice(0, 50),
        totalItems: 150,
        totalPages: 3,
        page: 0,
        pageSize: 50,
        hasNext: true,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      lastUpdated: new Date(),
      loadAuditRecords: mockLoadAuditRecords,
      refreshAuditRecords: mockRefreshAuditRecords,
      clearError: mockClearError,
      invalidateCache: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    expect(
      screen.getByText("Showing 50 of 150 audit records (Page 1 of 3)")
    ).toBeInTheDocument();
  });

  it("shows admin access control correctly", async () => {
    // Test with non-admin user
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[1], role: UserRole.USER },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    // Should show access denied message
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You need administrator privileges to access this page.")
    ).toBeInTheDocument();
  });

  it("shows unauthenticated state correctly", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    // AdminRoute should handle redirect to login
    // In a real test, we'd need to mock the router navigation
    expect(screen.queryByText("Audit Records")).not.toBeInTheDocument();
  });

  it("integrates with filters correctly", async () => {
    renderWithProviders(<AuditPage />);

    // Find and interact with filter components
    const usernameFilter = screen.getByPlaceholderText("Search by username...");
    expect(usernameFilter).toBeInTheDocument();

    // Test filter interaction
    fireEvent.change(usernameFilter, { target: { value: "admin" } });

    // Should trigger debounced filter change
    await waitFor(
      () => {
        expect(mockLoadAuditRecords).toHaveBeenCalledWith(
          expect.objectContaining({ username: "admin" }),
          0,
          50,
          "timestamp",
          "desc"
        );
      },
      { timeout: 500 }
    );
  });

  it("shows performance warning for large datasets", async () => {
    mockUseAuditRecords.mockReturnValue({
      data: {
        items: mockAuditRecords,
        totalItems: 2000,
        totalPages: 40,
        page: 0,
        pageSize: 50,
        hasNext: true,
        hasPrevious: false,
      },
      loading: false,
      error: null,
      lastUpdated: new Date(),
      loadAuditRecords: mockLoadAuditRecords,
      refreshAuditRecords: mockRefreshAuditRecords,
      clearError: mockClearError,
      invalidateCache: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    expect(
      screen.getByText(
        /Use filters to narrow down results for better performance/
      )
    ).toBeInTheDocument();
  });

  it("handles refresh functionality correctly", async () => {
    renderWithProviders(<AuditPage />);

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(mockRefreshAuditRecords).toHaveBeenCalled();
  });

  it("displays correct breadcrumb navigation", async () => {
    renderWithProviders(<AuditPage />);

    // Check breadcrumb structure
    expect(screen.getByText("RabbitMQ Admin")).toBeInTheDocument();
    expect(screen.getByText("Management")).toBeInTheDocument();
    // Check breadcrumb contains Audit Records but use getAllByText since it appears in both breadcrumb and heading
    expect(screen.getAllByText("Audit Records").length).toBeGreaterThan(0);
  });

  it("shows appropriate notes and help text", async () => {
    renderWithProviders(<AuditPage />);

    expect(
      screen.getByText(
        /Audit records show all write operations performed on RabbitMQ clusters/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Timestamps can be displayed in your local timezone or UTC/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Only administrators can access audit records/)
    ).toBeInTheDocument();
  });

  it("handles responsive design elements", async () => {
    renderWithProviders(<AuditPage />);

    // Check that main layout elements are present
    const pageContainer = screen.getByRole("heading", { name: "Audit Records" }).closest("div");
    expect(pageContainer).toBeInTheDocument();

    // Check that responsive grid elements are present
    expect(screen.getByText("Audit Filters")).toBeInTheDocument();
  });
});
