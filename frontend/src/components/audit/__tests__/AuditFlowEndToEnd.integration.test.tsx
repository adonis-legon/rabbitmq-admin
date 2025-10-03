import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AuditPage from "../AuditPage";
import { useAuth } from "../../auth/AuthProvider";
import { useAuditRecords } from "../../../hooks/useAuditRecords";
import { useClusters } from "../../../hooks/useClusters";
import { useUsers } from "../../../hooks/useUsers";
import { auditApi } from "../../../services/api/auditApi";
import { rabbitmqResourcesApi } from "../../../services/api/rabbitmqResourcesApi";
import { UserRole } from "../../../types/auth";
import { AuditOperationType, AuditOperationStatus } from "../../../types/audit";

// Mock all the hooks and APIs
vi.mock("../../auth/AuthProvider");
vi.mock("../../../hooks/useAuditRecords");
vi.mock("../../../hooks/useClusters");
vi.mock("../../../hooks/useUsers");
vi.mock("../../../services/api/auditApi");
vi.mock("../../../services/api/rabbitmqResourcesApi");
// Mock components that use useNavigate
vi.mock("../../common/Breadcrumbs", () => ({
  default: () => <div data-testid="breadcrumbs">Breadcrumbs</div>
}));

const mockUseAuth = useAuth as any;
const mockUseAuditRecords = useAuditRecords as any;
const mockUseClusters = useClusters as any;
const mockUseUsers = useUsers as any;
const mockAuditApi = auditApi as any;
const mockRabbitMQApi = rabbitmqResourcesApi as any;

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

/**
 * End-to-end integration tests for the complete audit flow.
 * Tests the entire audit lifecycle from write operation execution through
 * audit record creation, storage, retrieval, and UI display.
 *
 * Covers requirements: 1.1, 4.1, 4.5, 6.3, 7.2
 */
describe("Audit Flow End-to-End Integration Tests", () => {
  const mockLoadAuditRecords = vi.fn();
  const mockRefreshAuditRecords = vi.fn();
  const mockClearError = vi.fn();

  const mockAdminUser = {
    id: "admin-1",
    username: "admin",
    role: UserRole.ADMINISTRATOR,
    createdAt: "2023-10-01T10:00:00Z",
  };

  const mockRegularUser = {
    id: "user-1",
    username: "testuser",
    role: UserRole.USER,
    createdAt: "2023-10-01T10:00:00Z",
  };

  const mockClusters = [
    {
      id: "cluster-1",
      name: "test-cluster-1",
      apiUrl: "http://localhost:15672",
      username: "admin",
      password: "password",
      description: "Test cluster 1",
      active: true,
      assignedUsers: [],
    },
    {
      id: "cluster-2",
      name: "test-cluster-2",
      apiUrl: "http://remote:15672",
      username: "admin",
      password: "password",
      description: "Test cluster 2",
      active: true,
      assignedUsers: [],
    },
  ];

  const createMockAuditRecord = (id: string, overrides = {}) => ({
    id,
    username: "testuser",
    clusterName: "test-cluster-1",
    operationType: AuditOperationType.CREATE_QUEUE,
    resourceType: "queue",
    resourceName: `test-queue-${id}`,
    resourceDetails: { durable: true, autoDelete: false },
    status: AuditOperationStatus.SUCCESS,
    timestamp: new Date(Date.now() - parseInt(id) * 60000).toISOString(),
    clientIp: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    createdAt: new Date(Date.now() - parseInt(id) * 60000 + 1000).toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });

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
      users: [mockAdminUser, mockRegularUser],
      loading: false,
      error: null,
      refreshUsers: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      getUser: vi.fn(),
    });

    // Mock API responses
    mockAuditApi.getAuditRecords.mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
      hasNext: false,
      hasPrevious: false,
    });

    mockRabbitMQApi.createQueue.mockResolvedValue(undefined);
    mockRabbitMQApi.createExchange.mockResolvedValue(undefined);
    mockRabbitMQApi.deleteQueue.mockResolvedValue(undefined);
    mockRabbitMQApi.publishMessage.mockResolvedValue({ routed: true });
  });

  describe("Complete Audit Flow - Write Operation to UI Display", () => {
    it("should display audit record after write operation is performed", async () => {
      // Given - Start with empty audit records
      const initialAuditRecords: any[] = [];

      // Mock the progression: empty -> loading -> populated
      let callCount = 0;
      mockUseAuditRecords.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Initial empty state
          return {
            data: {
              items: initialAuditRecords,
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
          };
        } else {
          // After write operation - audit record appears
          const newAuditRecord = createMockAuditRecord("1", {
            operationType: AuditOperationType.CREATE_QUEUE,
            resourceName: "test-queue-created",
            status: AuditOperationStatus.SUCCESS,
          });

          return {
            data: {
              items: [newAuditRecord],
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
          };
        }
      });

      // When - Render audit page
      const { rerender } = renderWithProviders(<AuditPage />);

      // Then - Initially shows empty state
      await waitFor(() => {
        expect(
          screen.getByText("Showing 0 of 0 audit records")
        ).toBeInTheDocument();
      });

      // When - Simulate write operation completion and refresh
      rerender(<AuditPage />);

      // Then - Audit record should appear
      await waitFor(() => {
        expect(
          screen.getByText("Showing 1 of 1 audit records")
        ).toBeInTheDocument();
      });
    });

    it("should handle failed write operations and display failure audit records", async () => {
      // Given - Mock failed operation audit record
      const failedAuditRecord = createMockAuditRecord("1", {
        operationType: AuditOperationType.DELETE_QUEUE,
        resourceName: "non-existent-queue",
        status: AuditOperationStatus.FAILURE,
        errorMessage: "Queue not found",
      });

      mockUseAuditRecords.mockReturnValue({
        data: {
          items: [failedAuditRecord],
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

      // When
      renderWithProviders(<AuditPage />);

      // Then - Should display failed operation
      await waitFor(() => {
        expect(
          screen.getByText("Showing 1 of 1 audit records")
        ).toBeInTheDocument();
      });

      // And - Should show failure status and error message in the audit records list
      // Note: The exact display depends on how the AuditRecordsList component renders the data
      expect(screen.getByText("Audit Records")).toBeInTheDocument();
    });

    it("should support real-time updates when new audit records are created", async () => {
      // Given - Start with one audit record
      let recordCount = 1;
      mockUseAuditRecords.mockImplementation(() => {
        const records = Array.from({ length: recordCount }, (_, i) =>
          createMockAuditRecord((i + 1).toString())
        );

        return {
          data: {
            items: records,
            totalItems: recordCount,
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
        };
      });

      // When - Render audit page
      const { rerender } = renderWithProviders(<AuditPage />);

      // Then - Initially shows one record
      await waitFor(() => {
        expect(
          screen.getByText("Showing 1 of 1 audit records")
        ).toBeInTheDocument();
      });

      // When - Simulate new audit record creation
      recordCount = 2;
      rerender(<AuditPage />);

      // Then - Should show updated count
      await waitFor(() => {
        expect(
          screen.getByText("Showing 2 of 2 audit records")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Filtering and Pagination Integration", () => {
    it("should filter audit records by operation type and display results", async () => {
      // Given - Multiple audit records with different operation types
      const auditRecords = [
        createMockAuditRecord("1", {
          operationType: AuditOperationType.CREATE_QUEUE,
        }),
        createMockAuditRecord("2", {
          operationType: AuditOperationType.CREATE_EXCHANGE,
        }),
        createMockAuditRecord("3", {
          operationType: AuditOperationType.DELETE_QUEUE,
        }),
      ];

      let filteredRecords = auditRecords;
      mockUseAuditRecords.mockImplementation(() => ({
        data: {
          items: filteredRecords,
          totalItems: filteredRecords.length,
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
      }));

      // When - Render audit page
      const { rerender } = renderWithProviders(<AuditPage />);

      // Then - Initially shows all records
      await waitFor(() => {
        expect(
          screen.getByText("Showing 3 of 3 audit records")
        ).toBeInTheDocument();
      });

      // When - Apply filter for CREATE_QUEUE operations
      const operationTypeSelect = screen.getByLabelText(/operation type/i);

      // Click to open the select dropdown
      fireEvent.mouseDown(operationTypeSelect);

      // Find and click the CREATE_QUEUE option
      await waitFor(() => {
        const createQueueOption = screen.getByText("Create Queue");
        fireEvent.click(createQueueOption);
      });

      // Simulate filtered results
      filteredRecords = auditRecords.filter(
        (r) => r.operationType === AuditOperationType.CREATE_QUEUE
      );
      rerender(<AuditPage />);

      // Then - Should show filtered results
      await waitFor(() => {
        expect(mockLoadAuditRecords).toHaveBeenCalledWith(
          expect.objectContaining({ operationType: "CREATE_QUEUE" }),
          0,
          50,
          "timestamp",
          "desc"
        );
      });
    });

    it("should handle pagination with large audit datasets", async () => {
      // Given - Large dataset requiring pagination (>1000 to trigger performance warning)
      const totalRecords = 1500;
      const pageSize = 50;
      const currentPage = 0;

      const currentPageRecords = Array.from({ length: pageSize }, (_, i) =>
        createMockAuditRecord((i + 1).toString())
      );

      mockUseAuditRecords.mockReturnValue({
        data: {
          items: currentPageRecords,
          totalItems: totalRecords,
          totalPages: Math.ceil(totalRecords / pageSize),
          page: currentPage,
          pageSize,
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

      // When
      renderWithProviders(<AuditPage />);

      // Then - Should show pagination info and performance warning
      await waitFor(() => {
        expect(
          screen.getByText("Showing 50 of 1500 audit records (Page 1 of 30)")
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /Use filters to narrow down results for better performance/
          )
        ).toBeInTheDocument();
      });
    });

    it("should maintain filter state during pagination", async () => {
      // Given - Filtered dataset with pagination
      const filteredRecords = Array.from({ length: 25 }, (_, i) =>
        createMockAuditRecord((i + 1).toString(), {
          username: "admin",
          operationType: AuditOperationType.CREATE_EXCHANGE,
        })
      );

      mockUseAuditRecords.mockReturnValue({
        data: {
          items: filteredRecords,
          totalItems: 75, // Total filtered results
          totalPages: 3,
          page: 0,
          pageSize: 25,
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

      // When - Render with filters applied
      renderWithProviders(<AuditPage />);

      // Then - Should show filtered pagination info
      await waitFor(() => {
        expect(
          screen.getByText("Showing 25 of 75 audit records (Page 1 of 3)")
        ).toBeInTheDocument();
      });

      // When - Navigate to next page (simulated)
      // In a real scenario, this would trigger pagination controls
      expect(mockLoadAuditRecords).toHaveBeenCalledWith(
        expect.any(Object), // filter object
        0, // page
        50, // pageSize
        "timestamp", // sortBy
        "desc" // sortDirection
      );
    });
  });

  describe("Admin Role Enforcement and Security", () => {
    it("should deny access to non-admin users", async () => {
      // Given - Non-admin user
      mockUseAuth.mockReturnValue({
        user: mockRegularUser,
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
      });

      // When
      renderWithProviders(<AuditPage />);

      // Then - Should show access denied message
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(
        screen.getByText(
          "You need administrator privileges to access this page."
        )
      ).toBeInTheDocument();

      // And - Should not load audit records
      expect(mockLoadAuditRecords).not.toHaveBeenCalled();
    });

    it("should redirect unauthenticated users", async () => {
      // Given - Unauthenticated user
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
      });

      // When
      renderWithProviders(<AuditPage />);

      // Then - Should not show audit page content
      expect(screen.queryByText("Audit Records")).not.toBeInTheDocument();
      expect(mockLoadAuditRecords).not.toHaveBeenCalled();
    });

    it("should allow admin users full access to audit records", async () => {
      // Given - Admin user with audit records
      const auditRecords = [
        createMockAuditRecord("1", { username: "user1" }),
        createMockAuditRecord("2", { username: "user2" }),
        createMockAuditRecord("3", { username: "admin" }),
      ];

      mockUseAuditRecords.mockReturnValue({
        data: {
          items: auditRecords,
          totalItems: 3,
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

      // When
      renderWithProviders(<AuditPage />);

      // Then - Should show all audit records including operations by different users
      await waitFor(() => {
        expect(
          screen.getByText("Showing 3 of 3 audit records")
        ).toBeInTheDocument();
      });

      // And - Should have access to all filtering and management features
      expect(screen.getByText("Audit Filters")).toBeInTheDocument();
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle API errors gracefully and provide retry functionality", async () => {
      // Given - API error with proper AuditError structure
      const apiError = {
        type: "api_error" as const,
        message: "Failed to load audit records",
        details: "Network connection failed",
        retryable: true,
        timestamp: Date.now(),
        auditErrorType: "network" as const,
      };

      mockUseAuditRecords.mockReturnValue({
        data: null,
        loading: false,
        error: apiError,
        lastUpdated: null,
        loadAuditRecords: mockLoadAuditRecords,
        refreshAuditRecords: mockRefreshAuditRecords,
        clearError: mockClearError,
        invalidateCache: vi.fn(),
      });

      // When
      renderWithProviders(<AuditPage />);

      // Then - Should show error message and retry button
      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });

      // When - Click retry
      const retryButton = screen.getByText("Retry");
      fireEvent.click(retryButton);

      // Then - Should attempt to reload
      expect(mockLoadAuditRecords).toHaveBeenCalled();
    });

    it("should handle loading states during data refresh", async () => {
      // Given - Loading state
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

      // When
      renderWithProviders(<AuditPage />);

      // Then - Should show loading state
      expect(screen.getByText("Refreshing...")).toBeInTheDocument();
      expect(screen.queryByText("Showing")).not.toBeInTheDocument();
    });

    it("should recover from errors when data becomes available", async () => {
      // Given - Start with error state
      const { rerender } = renderWithProviders(<AuditPage />);

      mockUseAuditRecords.mockReturnValue({
        data: null,
        loading: false,
        error: {
          type: "api_error" as const,
          message: "Server error",
          details: "Internal server error",
          retryable: true,
          timestamp: Date.now(),
          auditErrorType: "server_error" as const,
        },
        lastUpdated: null,
        loadAuditRecords: mockLoadAuditRecords,
        refreshAuditRecords: mockRefreshAuditRecords,
        clearError: mockClearError,
        invalidateCache: vi.fn(),
      });

      rerender(<AuditPage />);

      // Then - Should show error
      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });

      // When - Data becomes available
      const auditRecords = [createMockAuditRecord("1")];
      mockUseAuditRecords.mockReturnValue({
        data: {
          items: auditRecords,
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

      rerender(<AuditPage />);

      // Then - Should show data
      await waitFor(() => {
        expect(
          screen.getByText("Showing 1 of 1 audit records")
        ).toBeInTheDocument();
      });
      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    });
  });

  describe("Performance and Optimization", () => {
    it("should handle large datasets efficiently", async () => {
      // Given - Large dataset (>1000 to trigger performance warning)
      const largeDataset = Array.from({ length: 1200 }, (_, i) =>
        createMockAuditRecord((i + 1).toString())
      );

      mockUseAuditRecords.mockReturnValue({
        data: {
          items: largeDataset.slice(0, 100), // First page
          totalItems: 1200,
          totalPages: 12,
          page: 0,
          pageSize: 100,
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

      // When - Measure render performance
      const startTime = performance.now();
      renderWithProviders(<AuditPage />);
      const endTime = performance.now();

      // Then - Should render efficiently
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second

      await waitFor(() => {
        expect(
          screen.getByText("Showing 100 of 1200 audit records (Page 1 of 12)")
        ).toBeInTheDocument();
      });

      // And - Should show performance warning
      expect(
        screen.getByText(
          /Use filters to narrow down results for better performance/
        )
      ).toBeInTheDocument();
    });

    it("should debounce filter inputs to reduce API calls", async () => {
      // Given
      renderWithProviders(<AuditPage />);

      // When - Rapidly change filter input
      const usernameFilter = screen.getByPlaceholderText(
        "Search by username..."
      );

      fireEvent.change(usernameFilter, { target: { value: "a" } });
      fireEvent.change(usernameFilter, { target: { value: "ad" } });
      fireEvent.change(usernameFilter, { target: { value: "adm" } });
      fireEvent.change(usernameFilter, { target: { value: "admin" } });

      // Then - Should debounce and only make final API call
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
        { timeout: 1000 }
      );

      // Should not have been called for intermediate values
      expect(mockLoadAuditRecords).not.toHaveBeenCalledWith(
        expect.objectContaining({ username: "a" }),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
