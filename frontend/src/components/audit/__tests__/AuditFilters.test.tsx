import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import AuditFilters, { AuditFiltersProps } from "../AuditFilters";
import {
  AuditOperationType,
  AuditOperationStatus,
} from "../../../types/audit";
import { ClusterConnection } from "../../../types/cluster";
import { User } from "../../../types/user";
import { UserRole } from "../../../types/auth";

// Mock data
const mockClusters: ClusterConnection[] = [
  {
    id: "1",
    name: "Production Cluster",
    apiUrl: "http://prod.rabbitmq.com",
    username: "admin",
    password: "password",
    description: "Production environment",
    active: true,
    assignedUsers: [],
  },
  {
    id: "2",
    name: "Development Cluster",
    apiUrl: "http://dev.rabbitmq.com",
    username: "admin",
    password: "password",
    description: "Development environment",
    active: true,
    assignedUsers: [],
  },
];

const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    role: UserRole.ADMINISTRATOR,
    createdAt: "2023-01-01T00:00:00Z",
    assignedClusters: [],
  },
  {
    id: "2",
    username: "user1",
    role: UserRole.USER,
    createdAt: "2023-01-02T00:00:00Z",
    assignedClusters: [],
  },
];

const defaultProps: AuditFiltersProps = {
  filters: {},
  onFiltersChange: vi.fn(),
  clusters: mockClusters,
  users: mockUsers,
  disabled: false,
  onReset: vi.fn(),
  onApply: vi.fn(),
};

const renderAuditFilters = (props: Partial<AuditFiltersProps> = {}) => {
  return render(<AuditFilters {...defaultProps} {...props} />);
};

describe("AuditFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all filter fields", () => {
      renderAuditFilters();

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cluster/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/operation type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/resource name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/resource type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it("renders action buttons", async () => {
      const user = userEvent.setup();
      renderAuditFilters();

      // First expand the accordion to access the buttons
      const accordionButton = screen.getByRole("button", {
        name: /audit filters/i,
      });
      await user.click(accordionButton);

      expect(
        screen.getByRole("button", { name: /apply filters/i })
      ).toBeInTheDocument();
    });

    it("shows reset button only when filters are active", async () => {
      const user = userEvent.setup();
      const { rerender } = renderAuditFilters();

      // First expand the accordion to access the buttons
      const accordionButton = screen.getByRole("button", {
        name: /audit filters/i,
      });
      await user.click(accordionButton);

      // No reset button when no filters
      expect(
        screen.queryByRole("button", { name: /reset filters/i })
      ).not.toBeInTheDocument();

      // Reset button appears when filters are active
      await act(async () => {
        rerender(
          <AuditFilters {...defaultProps} filters={{ username: "test" }} />
        );
      });

      // Need to expand accordion again after rerender
      const accordionButtonAfterRerender = screen.getByRole("button", {
        name: /audit filters/i,
      });

      await act(async () => {
        await user.click(accordionButtonAfterRerender);
      });

      // Wait for accordion to expand and reset button to appear
      await waitFor(
        async () => {
          const button = screen.getByRole("button", { name: /reset filters/i });
          expect(button).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("renders cluster options correctly", async () => {
      const user = userEvent.setup();
      renderAuditFilters();

      const clusterSelect = screen.getByLabelText(/cluster/i);
      await user.click(clusterSelect);

      expect(screen.getByText("All Clusters")).toBeInTheDocument();
      expect(screen.getByText("Production Cluster")).toBeInTheDocument();
      expect(screen.getByText("Development Cluster")).toBeInTheDocument();
    });

    it("renders operation type options correctly", async () => {
      const user = userEvent.setup();
      renderAuditFilters();

      const operationTypeSelect = screen.getByLabelText(/operation type/i);
      await user.click(operationTypeSelect);

      expect(screen.getByText("All Operations")).toBeInTheDocument();
      expect(screen.getByText("Create Exchange")).toBeInTheDocument();
    });

    it("renders operation status options correctly", async () => {
      const user = userEvent.setup();
      renderAuditFilters();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.click(statusSelect);

      expect(screen.getByText("All Statuses")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Failure")).toBeInTheDocument();
      expect(screen.getByText("Partial")).toBeInTheDocument();
    });
  });

  describe("Filter Interactions", () => {
    it("handles username input with debouncing", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();
      renderAuditFilters({ onFiltersChange });

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, "admin");

      // Should call after debounce delay
      await waitFor(
        () => {
          expect(onFiltersChange).toHaveBeenCalledWith({ username: "admin" });
        },
        { timeout: 500 }
      );
    });

    it("handles cluster selection", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();
      renderAuditFilters({ onFiltersChange });

      const clusterSelect = screen.getByLabelText(/cluster/i);
      await user.click(clusterSelect);
      await user.click(screen.getByText("Production Cluster"));

      expect(onFiltersChange).toHaveBeenCalledWith({
        clusterName: "Production Cluster",
      });
    });

    it("handles operation type selection", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();
      renderAuditFilters({ onFiltersChange });

      const operationTypeSelect = screen.getByLabelText(/operation type/i);
      await user.click(operationTypeSelect);
      await user.click(screen.getByText("Create Exchange"));

      expect(onFiltersChange).toHaveBeenCalledWith({
        operationType: AuditOperationType.CREATE_EXCHANGE,
      });
    });

    it("handles status selection", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();
      renderAuditFilters({ onFiltersChange });

      const statusSelect = screen.getByLabelText(/status/i);
      await user.click(statusSelect);
      await user.click(screen.getByText("Success"));

      expect(onFiltersChange).toHaveBeenCalledWith({
        status: AuditOperationStatus.SUCCESS,
      });
    });

    it("handles resource name input with debouncing", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();
      renderAuditFilters({ onFiltersChange });

      const resourceNameInput = screen.getByLabelText(/resource name/i);
      await user.type(resourceNameInput, "test-queue");

      // Should call after debounce delay
      await waitFor(
        () => {
          expect(onFiltersChange).toHaveBeenCalledWith({
            resourceName: "test-queue",
          });
        },
        { timeout: 500 }
      );
    });
  });

  describe("Clear Functionality", () => {
    it("clears individual text fields", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();
      renderAuditFilters({
        onFiltersChange,
        filters: { username: "admin", resourceName: "test-queue" },
      });

      // Clear username
      const usernameClearButton = screen.getByLabelText(
        /clear username filter/i
      );
      await user.click(usernameClearButton);

      expect(onFiltersChange).toHaveBeenCalledWith({
        username: undefined,
        resourceName: "test-queue",
      });
    });

    it("resets all filters when reset button is clicked", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();
      const onReset = vi.fn();

      renderAuditFilters({
        onFiltersChange,
        onReset,
        filters: {
          username: "admin",
          clusterName: "Production Cluster",
          operationType: AuditOperationType.CREATE_EXCHANGE,
        },
      });

      // First expand the accordion to access the buttons
      const accordionButton = screen.getByRole("button", {
        name: /audit filters/i,
      });

      await act(async () => {
        await user.click(accordionButton);
      });

      // Wait for the accordion to expand and buttons to be available
      await waitFor(async () => {
        expect(screen.getByRole("button", {
          name: /reset filters/i,
        })).toBeInTheDocument();
      });

      const resetButton = screen.getByRole("button", {
        name: /reset filters/i,
      });
      await user.click(resetButton);

      expect(onFiltersChange).toHaveBeenCalledWith({});
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe("Apply Functionality", () => {
    it("calls onApply when apply button is clicked", async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      renderAuditFilters({ onApply });

      // First expand the accordion to access the buttons
      const accordionButton = screen.getByRole("button", {
        name: /audit filters/i,
      });

      await act(async () => {
        await user.click(accordionButton);
      });

      // Wait for the accordion to expand and buttons to be available
      await waitFor(async () => {
        expect(screen.getByRole("button", {
          name: /apply filters/i,
        })).toBeInTheDocument();
      });

      const applyButton = screen.getByRole("button", {
        name: /apply filters/i,
      });
      await user.click(applyButton);

      expect(onApply).toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("disables all inputs when disabled prop is true", async () => {
      const user = userEvent.setup();
      renderAuditFilters({ disabled: true });

      // First expand the accordion to access the buttons
      const accordionButton = screen.getByRole("button", {
        name: /audit filters/i,
      });

      await act(async () => {
        await user.click(accordionButton);
      });

      // Wait for the accordion to expand and buttons to be available
      await waitFor(async () => {
        expect(screen.getByRole("button", {
          name: /apply filters/i,
        })).toBeInTheDocument();
      });

      const applyButton = screen.getByRole("button", {
        name: /apply filters/i,
      });

      // TextField components should use toBeDisabled()
      expect(screen.getByLabelText(/username/i)).toBeDisabled();
      expect(screen.getByLabelText(/resource name/i)).toBeDisabled();
      expect(screen.getByLabelText(/start date/i)).toBeDisabled();
      expect(screen.getByLabelText(/end date/i)).toBeDisabled();
      expect(applyButton).toBeDisabled();

      // For MUI Select components, check aria-disabled instead of disabled attribute
      expect(screen.getByLabelText(/cluster/i)).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByLabelText(/resource type/i)).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByLabelText(/operation type/i)).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByLabelText(/status/i)).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Props Updates", () => {
    it("updates local state when filters prop changes", () => {
      const { rerender } = renderAuditFilters({ filters: {} });

      const usernameInput = screen.getByLabelText(
        /username/i
      ) as HTMLInputElement;
      expect(usernameInput.value).toBe("");

      rerender(
        <AuditFilters {...defaultProps} filters={{ username: "admin" }} />
      );

      expect(usernameInput.value).toBe("admin");
    });
  });

  describe("Date Formatting", () => {
    it("handles empty date values", () => {
      renderAuditFilters({ filters: {} });

      const startDateInput = screen.getByLabelText(
        /start date/i
      ) as HTMLInputElement;
      const endDateInput = screen.getByLabelText(
        /end date/i
      ) as HTMLInputElement;

      expect(startDateInput.value).toBe("");
      expect(endDateInput.value).toBe("");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty clusters array", () => {
      renderAuditFilters({ clusters: [] });

      // Should still render the cluster select
      expect(screen.getByLabelText(/cluster/i)).toBeInTheDocument();
    });

    it("handles empty users array", () => {
      renderAuditFilters({ users: [] });

      // Should still render all components
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
  });
});
