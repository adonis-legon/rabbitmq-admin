import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import KeyValueEditor from "../KeyValueEditor";

const defaultProps = {
  value: {},
  onChange: vi.fn(),
};

const theme = createTheme();

const renderComponent = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <KeyValueEditor {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe("KeyValueEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default label", () => {
      renderComponent();

      expect(screen.getByText("Arguments")).toBeInTheDocument();
      expect(screen.getByText("Add")).toBeInTheDocument();
    });

    it("renders with custom label", () => {
      renderComponent({ label: "Custom Properties" });

      expect(screen.getByText("Custom Properties")).toBeInTheDocument();
    });

    it("renders with custom key and value labels", () => {
      renderComponent({
        keyLabel: "Property Name",
        valueLabel: "Property Value",
      });

      // Add a pair to see the labels
      const addButton = screen.getByText("Add");
      fireEvent.click(addButton);

      expect(screen.getByLabelText("Property Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Property Value")).toBeInTheDocument();
    });

    it("renders with helper text", () => {
      renderComponent({
        helperText: "Enter key-value pairs for configuration",
      });

      expect(
        screen.getByText("Enter key-value pairs for configuration")
      ).toBeInTheDocument();
    });

    it("shows empty state when no pairs exist", () => {
      renderComponent();

      expect(
        screen.getByText('No arguments defined. Click "Add" to create one.')
      ).toBeInTheDocument();
    });

    it("shows empty state with custom label", () => {
      renderComponent({ label: "Properties" });

      expect(
        screen.getByText('No properties defined. Click "Add" to create one.')
      ).toBeInTheDocument();
    });
  });

  describe("Initial Value Handling", () => {
    it("displays existing key-value pairs", () => {
      const initialValue = {
        "max-length": "1000",
        "x-message-ttl": "60000",
        durable: true,
      };

      renderComponent({ value: initialValue });

      expect(screen.getByDisplayValue("max-length")).toBeInTheDocument();
      expect(screen.getByDisplayValue("1000")).toBeInTheDocument();
      expect(screen.getByDisplayValue("x-message-ttl")).toBeInTheDocument();
      expect(screen.getByDisplayValue("60000")).toBeInTheDocument();
      expect(screen.getByDisplayValue("durable")).toBeInTheDocument();
      expect(screen.getByDisplayValue("true")).toBeInTheDocument();
    });

    it("handles complex JSON values", () => {
      const initialValue = {
        "complex-object": { nested: "value", array: [1, 2, 3] },
        "simple-string": "test",
      };

      renderComponent({ value: initialValue });

      expect(screen.getByDisplayValue("complex-object")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('{"nested":"value","array":[1,2,3]}')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("simple-string")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test")).toBeInTheDocument();
    });
  });

  describe("Adding Pairs", () => {
    it("adds new empty pair when Add button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      expect(screen.getByLabelText("Key")).toBeInTheDocument();
      expect(screen.getByLabelText("Value")).toBeInTheDocument();
      expect(screen.getByLabelText("delete")).toBeInTheDocument();
    });

    it("adds multiple pairs", async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButton = screen.getByText("Add");
      await user.click(addButton);
      await user.click(addButton);

      const keyInputs = screen.getAllByLabelText("Key");
      const valueInputs = screen.getAllByLabelText("Value");

      expect(keyInputs).toHaveLength(2);
      expect(valueInputs).toHaveLength(2);
    });

    it("shows JSON parsing helper text on first pair", async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      expect(
        screen.getByText("JSON values will be parsed automatically")
      ).toBeInTheDocument();
    });
  });

  describe("Editing Pairs", () => {
    it("updates key when typing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderComponent({ onChange });

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      const keyInput = screen.getByLabelText("Key");
      await user.type(keyInput, "test-key");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({ "test-key": "" });
      });
    });

    it("updates value when typing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderComponent({ onChange });

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      const keyInput = screen.getByLabelText("Key");
      const valueInput = screen.getByLabelText("Value");

      await user.type(keyInput, "test-key");
      await user.type(valueInput, "test-value");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({ "test-key": "test-value" });
      });
    });

    it("parses JSON values automatically", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderComponent({ onChange });

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      const keyInput = screen.getByLabelText("Key");
      const valueInput = screen.getByLabelText("Value");

      await user.type(keyInput, "json-key");

      // Use fireEvent for complex JSON strings to avoid userEvent parsing issues
      fireEvent.change(valueInput, {
        target: { value: '{"nested": "value"}' },
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({
          "json-key": { nested: "value" },
        });
      });
    });

    it("handles invalid JSON as string", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderComponent({ onChange });

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      const keyInput = screen.getByLabelText("Key");
      const valueInput = screen.getByLabelText("Value");

      await user.type(keyInput, "string-key");

      // Use fireEvent for problematic characters
      fireEvent.change(valueInput, { target: { value: "invalid-json{" } });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({
          "string-key": "invalid-json{",
        });
      });
    });

    it("ignores empty keys", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderComponent({ onChange });

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      const valueInput = screen.getByLabelText("Value");
      await user.type(valueInput, "value-without-key");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({});
      });
    });

    it("trims whitespace from keys", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderComponent({ onChange });

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      const keyInput = screen.getByLabelText("Key");
      const valueInput = screen.getByLabelText("Value");

      await user.type(keyInput, "  trimmed-key  ");
      await user.type(valueInput, "test-value");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({ "trimmed-key": "test-value" });
      });
    });
  });

  describe("Removing Pairs", () => {
    it("removes pair when delete button is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderComponent({ onChange });

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      const keyInput = screen.getByLabelText("Key");
      await user.type(keyInput, "test-key");

      const deleteButton = screen.getByLabelText("delete");
      await user.click(deleteButton);

      expect(screen.queryByLabelText("Key")).not.toBeInTheDocument();
      expect(
        screen.getByText('No arguments defined. Click "Add" to create one.')
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({});
      });
    });
  });

  describe("Disabled State", () => {
    it("disables all inputs when disabled prop is true", async () => {
      const user = userEvent.setup();

      // First render with disabled false to add a pair
      const { rerender } = renderComponent({ disabled: false });

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      // Now rerender with disabled true and ThemeProvider wrapper
      rerender(
        <ThemeProvider theme={theme}>
          <KeyValueEditor {...defaultProps} disabled={true} />
        </ThemeProvider>
      );

      const disabledAddButton = screen.getByText("Add");
      expect(disabledAddButton).toBeDisabled();

      // Check for disabled inputs by role instead of label
      const inputs = screen.getAllByRole("textbox");
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });

      // Check for disabled delete button
      const deleteButtons = screen.getAllByLabelText("delete");
      deleteButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Visual Separators", () => {
    it("shows dividers between multiple pairs", async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButton = screen.getByText("Add");
      await user.click(addButton);
      await user.click(addButton);

      // MUI Divider components should be present
      const dividers = document.querySelectorAll(".MuiDivider-root");
      expect(dividers.length).toBeGreaterThan(0);
    });

    it("does not show divider for single pair", async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButton = screen.getByText("Add");
      await user.click(addButton);

      // Should not have dividers for single pair
      const dividers = document.querySelectorAll(".MuiDivider-root");
      expect(dividers).toHaveLength(0);
    });
  });

  describe("Complex Scenarios", () => {
    it("handles editing existing values", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const initialValue = { "existing-key": "existing-value" };

      renderComponent({ value: initialValue, onChange });

      const valueInput = screen.getByDisplayValue("existing-value");
      await user.clear(valueInput);
      await user.type(valueInput, "updated-value");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({
          "existing-key": "updated-value",
        });
      });
    });
  });
});
