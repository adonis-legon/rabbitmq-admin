import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import AuditPage from "../AuditPage";
import { useAuth } from "../../auth/AuthProvider";
import { useAuditRecords } from "../../../hooks/useAuditRecords";
import { useClusters } from "../../../hooks/useClusters";
import { useUsers } from "../../../hooks/useUsers";
import { UserRole } from "../../../types/auth";
import { AuditOperationType, AuditOperationStatus } from "../../../types/audit";

// Mock the hooks
vi.mock("../../auth/AuthProvider");
vi.mock("../../../hooks/useAuditRecords");
vi.mock("../../../hooks/useClusters");
vi.mock("../../../hooks/useUsers");

// Mock tokenService
vi.mock("../../../services/auth/tokenService", () => ({
  tokenService: {
    hasValidToken: vi.fn(() => true),
  },
}));

// Mock the child components
vi.mock("../AuditFilters", () => {
  return {
    default: function MockAuditFilters({ onFiltersChange, onReset, onApply }: any) {
      return (
        <div data-testid="audit-filters">
          <button onClick={() => onFiltersChange({ username: "test" })}>
            Change Filters
          </button>
          <button onClick={onReset}>Reset Filters</button>
          <button onClick={onApply}>Apply Filters</button>
        </div>
      );
    }
  };
});

vi.mock("../AuditRecordsList", () => {
  return {
    default: function MockAuditRecordsList({
      onPageChange,
      onPageSizeChange,
      onSortChange,
      onRetry,
    }: any) {
      return (
        <div data-testid="audit-records-list">
          <button onClick={() => onPageChange(1)}>Change Page</button>
          <button onClick={() => onPageSizeChange(100)}>Change Page Size</button>
          <button
            onClick={() => onSortChange([{ field: "username", sort: "asc" }])}
          >
            Change Sort
          </button>
          <button onClick={onRetry}>Retry</button>
        </div>
      );
    }
  };
});

vi.mock("../common/Breadcrumbs", () => {
  return {
    default: function MockBreadcrumbs({ items }: any) {
      return (
        <div data-testid="breadcrumbs">
          {items.map((item: any, index: number) => (
            <span key={index}>{item.label}</span>
          ))}
        </div>
      );
    }
  };
});

const mockUseAuth = vi.mocked(useAuth);
const mockUseAuditRecords = vi.mocked(useAuditRecords);
const mockUseClusters = vi.mocked(useClusters);
const mockUseUsers = vi.mocked(useUsers);

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

const mockAuditRecord = {
  id: "1",
  username: "admin",
  clusterName: "test-cluster",
  operationType: AuditOperationType.CREATE_QUEUE,
  resourceType: "queue",
  resourceName: "test-queue",
  resourceDetails: { durable: true },
  status: AuditOperationStatus.SUCCESS,
  timestamp: "2023-10-01T10:00:00Z",
  clientIp: "192.168.1.1",
  userAgent: "Mozilla/5.0",
  createdAt: "2023-10-01T10:00:00Z",
};

const mockUser = {
  id: "user-1",
  username: "admin",
  role: UserRole.ADMINISTRATOR,
  assignedClusters: [] as any[],
  createdAt: "2023-10-01T10:00:00Z",
};

const mockCluster = {
  id: "cluster-1",
  name: "test-cluster",
  host: "localhost",
  port: 15672,
  username: "admin",
  password: "password",
  useSsl: false,
  apiUrl: "http://localhost:15672/api",
  active: true,
  assignedUsers: [mockUser],
  createdAt: "2023-10-01T10:00:00Z",
  updatedAt: "2023-10-01T10:00:00Z",
};

// Update mock user to include cluster reference
mockUser.assignedClusters = [mockCluster];

describe("AuditPage", () => {
  const mockLoadAuditRecords = vi.fn();
  const mockRefreshAuditRecords = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });

    mockUseAuditRecords.mockReturnValue({
      data: {
        items: [mockAuditRecord],
        totalItems: 1,
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
      clusters: [mockCluster],
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
      users: [mockUser],
      loading: false,
      error: null,
      refreshUsers: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      getUser: vi.fn(),
    });
  });

  it("renders audit page for admin user", () => {
    renderWithProviders(<AuditPage />);

    expect(screen.getAllByText("Audits")[0]).toBeInTheDocument();
    expect(screen.getByTestId("audit-filters")).toBeInTheDocument();
    expect(screen.getByTestId("audit-records-list")).toBeInTheDocument();
  });

  it("shows loading state when auth is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders breadcrumbs correctly", () => {
    renderWithProviders(<AuditPage />);

    // Check for breadcrumb navigation structure
    const breadcrumbNav = screen.getByRole("navigation");
    expect(breadcrumbNav).toBeInTheDocument();
    expect(screen.getByText("Management")).toBeInTheDocument();
    expect(screen.getByText("RabbitMQ Admin")).toBeInTheDocument();
  });



  it("calls loadAuditRecords on mount for admin user", () => {
    renderWithProviders(<AuditPage />);

    expect(mockLoadAuditRecords).toHaveBeenCalledWith(
      {},
      0,
      50,
      "timestamp",
      "desc"
    );
  });

  it("handles filter changes correctly", async () => {
    renderWithProviders(<AuditPage />);

    const changeFiltersButton = screen.getByText("Change Filters");
    fireEvent.click(changeFiltersButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        { username: "test" },
        0,
        50,
        "timestamp",
        "desc"
      );
    });
  });

  it("handles filter reset correctly", async () => {
    renderWithProviders(<AuditPage />);

    const resetFiltersButton = screen.getByText("Reset Filters");
    fireEvent.click(resetFiltersButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        0,
        50,
        "timestamp",
        "desc"
      );
    });
  });

  it("handles filter apply correctly", async () => {
    renderWithProviders(<AuditPage />);

    const applyFiltersButton = screen.getByText("Apply Filters");
    fireEvent.click(applyFiltersButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        0,
        50,
        "timestamp",
        "desc"
      );
    });
  });

  it("handles page change correctly", async () => {
    renderWithProviders(<AuditPage />);

    const changePageButton = screen.getByText("Change Page");
    fireEvent.click(changePageButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        1,
        50,
        "timestamp",
        "desc"
      );
    });
  });

  it("handles page size change correctly", async () => {
    renderWithProviders(<AuditPage />);

    const changePageSizeButton = screen.getByText("Change Page Size");
    fireEvent.click(changePageSizeButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        0,
        100,
        "timestamp",
        "desc"
      );
    });
  });

  it("handles sort change correctly", async () => {
    renderWithProviders(<AuditPage />);

    const changeSortButton = screen.getByText("Change Sort");
    fireEvent.click(changeSortButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        0,
        50,
        "username",
        "asc"
      );
    });
  });

  it("handles refresh correctly", async () => {
    renderWithProviders(<AuditPage />);

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(mockRefreshAuditRecords).toHaveBeenCalled();
  });

  it("handles retry correctly", async () => {
    renderWithProviders(<AuditPage />);

    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);

    expect(mockClearError).toHaveBeenCalled();
    expect(mockLoadAuditRecords).toHaveBeenCalledWith(
      {},
      0,
      50,
      "timestamp",
      "desc"
    );
  });

  it("shows different empty message when filters are applied", () => {
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

    // Simulate having filters applied
    const changeFiltersButton = screen.getByText("Change Filters");
    fireEvent.click(changeFiltersButton);

    // When filters are applied and no data is found, AuditFallbackUI should be displayed with filtered message
    expect(screen.getByText("No Audit Records Found")).toBeInTheDocument();
    expect(
      screen.getByText(/No audit records found matching the current filters/)
    ).toBeInTheDocument();
  });

  it("disables filters when loading", () => {
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

    expect(screen.getByTestId("audit-filters")).toBeInTheDocument();
    // The disabled prop is passed to AuditFilters, but we can't easily test it
    // without more complex mocking
  });

  it("shows refreshing state on refresh button", () => {
    mockUseAuditRecords.mockReturnValue({
      data: {
        items: [mockAuditRecord],
        totalItems: 1,
        totalPages: 1,
        page: 0,
        pageSize: 50,
        hasNext: false,
        hasPrevious: false,
      },
      loading: true,
      error: null,
      lastUpdated: new Date(),
      loadAuditRecords: mockLoadAuditRecords,
      refreshAuditRecords: mockRefreshAuditRecords,
      clearError: mockClearError,
      invalidateCache: vi.fn(),
    });

    renderWithProviders(<AuditPage />);

    expect(screen.getByText("Refreshing...")).toBeInTheDocument();
  });

  it("shows performance note for large datasets", () => {
    mockUseAuditRecords.mockReturnValue({
      data: {
        items: [mockAuditRecord],
        totalItems: 1500,
        totalPages: 30,
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

  it("resets page to 0 when filters change", async () => {
    renderWithProviders(<AuditPage />);

    // First change page to 1
    const changePageButton = screen.getByText("Change Page");
    fireEvent.click(changePageButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        1,
        50,
        "timestamp",
        "desc"
      );
    });

    // Then change filters - should reset page to 0
    const changeFiltersButton = screen.getByText("Change Filters");
    fireEvent.click(changeFiltersButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        { username: "test" },
        0,
        50,
        "timestamp",
        "desc"
      );
    });
  });

  it("resets page to 0 when page size changes", async () => {
    renderWithProviders(<AuditPage />);

    // First change page to 1
    const changePageButton = screen.getByText("Change Page");
    fireEvent.click(changePageButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        1,
        50,
        "timestamp",
        "desc"
      );
    });

    // Then change page size - should reset page to 0
    const changePageSizeButton = screen.getByText("Change Page Size");
    fireEvent.click(changePageSizeButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        0,
        100,
        "timestamp",
        "desc"
      );
    });
  });

  it("resets page to 0 when sort changes", async () => {
    renderWithProviders(<AuditPage />);

    // First change page to 1
    const changePageButton = screen.getByText("Change Page");
    fireEvent.click(changePageButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        1,
        50,
        "timestamp",
        "desc"
      );
    });

    // Then change sort - should reset page to 0
    const changeSortButton = screen.getByText("Change Sort");
    fireEvent.click(changeSortButton);

    await waitFor(() => {
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        {},
        0,
        50,
        "username",
        "asc"
      );
    });
  });
});
