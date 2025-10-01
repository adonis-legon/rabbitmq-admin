import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import DeleteConfirmationDialog, {
  DeleteType,
} from "../DeleteConfirmationDialog";

describe("DeleteConfirmationDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    deleteType: "exchange" as DeleteType,
    resourceName: "test-exchange",
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Exchange Deletion", () => {
    it("renders exchange deletion dialog with correct title and message", () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(
        screen.getByRole("heading", { name: "Delete Exchange" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Are you sure you want to delete the exchange "test-exchange"?'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "This action cannot be undone. The exchange and all its bindings will be removed."
        )
      ).toBeInTheDocument();
    });

    it("shows if-unused option for exchange deletion", () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(screen.getByText("Only delete if unused")).toBeInTheDocument();
      expect(
        screen.getByText("Delete only if the exchange has no bindings")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Only delete if empty")
      ).not.toBeInTheDocument();
    });

    it("calls onConfirm with correct options when if-unused is checked", async () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      const ifUnusedCheckbox = screen.getByRole("checkbox", {
        name: /only delete if unused/i,
      });
      fireEvent.click(ifUnusedCheckbox);

      const deleteButton = screen.getByRole("button", {
        name: "Delete Exchange",
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith({
          ifUnused: true,
          ifEmpty: false,
        });
      });
    });
  });

  describe("Queue Deletion", () => {
    const queueProps = {
      ...defaultProps,
      deleteType: "queue" as DeleteType,
      resourceName: "test-queue",
    };

    it("renders queue deletion dialog with correct title and message", () => {
      render(<DeleteConfirmationDialog {...queueProps} />);

      expect(
        screen.getByRole("heading", { name: "Delete Queue" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Are you sure you want to delete the queue "test-queue"?'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "This action cannot be undone. The queue and all its messages will be removed."
        )
      ).toBeInTheDocument();
    });

    it("shows both if-unused and if-empty options for queue deletion", () => {
      render(<DeleteConfirmationDialog {...queueProps} />);

      expect(screen.getByText("Only delete if unused")).toBeInTheDocument();
      expect(
        screen.getByText("Delete only if the queue has no consumers")
      ).toBeInTheDocument();
      expect(screen.getByText("Only delete if empty")).toBeInTheDocument();
      expect(
        screen.getByText("Delete only if the queue has no messages")
      ).toBeInTheDocument();
    });

    it("calls onConfirm with correct options when both checkboxes are checked", async () => {
      render(<DeleteConfirmationDialog {...queueProps} />);

      const ifUnusedCheckbox = screen.getByRole("checkbox", {
        name: /only delete if unused/i,
      });
      const ifEmptyCheckbox = screen.getByRole("checkbox", {
        name: /only delete if empty/i,
      });

      fireEvent.click(ifUnusedCheckbox);
      fireEvent.click(ifEmptyCheckbox);

      const deleteButton = screen.getByRole("button", { name: "Delete Queue" });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith({
          ifUnused: true,
          ifEmpty: true,
        });
      });
    });
  });

  describe("Queue Purging", () => {
    const purgeProps = {
      ...defaultProps,
      deleteType: "purge" as DeleteType,
      resourceName: "test-queue",
    };

    it("renders queue purge dialog with correct title and message", () => {
      render(<DeleteConfirmationDialog {...purgeProps} />);

      expect(
        screen.getByRole("heading", { name: "Purge Queue" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Are you sure you want to purge all messages from the queue "test-queue"?'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "This action cannot be undone. All messages in the queue will be permanently removed."
        )
      ).toBeInTheDocument();
    });

    it("does not show conditional deletion options for purge", () => {
      render(<DeleteConfirmationDialog {...purgeProps} />);

      expect(
        screen.queryByText("Conditional Deletion Options:")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Only delete if unused")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Only delete if empty")
      ).not.toBeInTheDocument();
    });

    it("calls onConfirm with empty options for purge", async () => {
      render(<DeleteConfirmationDialog {...purgeProps} />);

      const purgeButton = screen.getByRole("button", { name: "Purge Queue" });
      fireEvent.click(purgeButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith({
          ifUnused: false,
          ifEmpty: false,
        });
      });
    });
  });

  describe("Dialog Behavior", () => {
    it("calls onClose when cancel button is clicked", () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("does not call onClose when loading", () => {
      render(<DeleteConfirmationDialog {...defaultProps} loading={true} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toBeDisabled();
    });

    it("shows loading spinner when loading is true", () => {
      render(<DeleteConfirmationDialog {...defaultProps} loading={true} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();

      // When loading, the button contains a spinner, so we need to find it differently
      const deleteButton = screen.getByRole("button", { name: "" });
      expect(deleteButton).toBeDisabled();
    });

    it("resets options when dialog is closed", async () => {
      const { rerender } = render(
        <DeleteConfirmationDialog {...defaultProps} />
      );

      // Check a checkbox
      const ifUnusedCheckbox = screen.getByRole("checkbox", {
        name: /only delete if unused/i,
      });
      fireEvent.click(ifUnusedCheckbox);
      expect(ifUnusedCheckbox).toBeChecked();

      // Close dialog
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      // Reopen dialog
      rerender(<DeleteConfirmationDialog {...defaultProps} open={false} />);
      rerender(<DeleteConfirmationDialog {...defaultProps} open={true} />);

      // Checkbox should be unchecked
      const newIfUnusedCheckbox = screen.getByRole("checkbox", {
        name: /only delete if unused/i,
      });
      expect(newIfUnusedCheckbox).not.toBeChecked();
    });
  });

  describe("Error Handling", () => {
    it("handles onConfirm errors gracefully", async () => {
      const mockOnConfirmError = vi
        .fn()
        .mockRejectedValue(new Error("Delete failed"));

      render(
        <DeleteConfirmationDialog
          {...defaultProps}
          onConfirm={mockOnConfirmError}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: "Delete Exchange",
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirmError).toHaveBeenCalled();
      });

      // Dialog should remain open on error (parent handles error display)
      expect(
        screen.getByRole("heading", { name: "Delete Exchange" })
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and roles", () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Delete Exchange" })
      ).toBeInTheDocument();

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(1); // Only if-unused for exchange
    });

    it("maintains focus management during loading state", () => {
      render(<DeleteConfirmationDialog {...defaultProps} loading={true} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      // When loading, the button contains a spinner, so we find it by its disabled state
      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons.find((button) => button !== cancelButton);
      const checkbox = screen.getByRole("checkbox");

      expect(cancelButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
      expect(checkbox).toBeDisabled();
    });
  });

  describe("Warning Messages", () => {
    it("displays appropriate warning for each delete type", () => {
      // Exchange
      const { rerender } = render(
        <DeleteConfirmationDialog {...defaultProps} />
      );
      expect(
        screen.getByText(
          "This action cannot be undone. The exchange and all its bindings will be removed."
        )
      ).toBeInTheDocument();

      // Queue
      rerender(
        <DeleteConfirmationDialog {...defaultProps} deleteType="queue" />
      );
      expect(
        screen.getByText(
          "This action cannot be undone. The queue and all its messages will be removed."
        )
      ).toBeInTheDocument();

      // Purge
      rerender(
        <DeleteConfirmationDialog {...defaultProps} deleteType="purge" />
      );
      expect(
        screen.getByText(
          "This action cannot be undone. All messages in the queue will be permanently removed."
        )
      ).toBeInTheDocument();
    });

    it("displays warning in an alert component", () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("MuiAlert-standardWarning");
    });
  });
});
