import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PublishMessageDialog from "../PublishMessageDialog";
import { useVirtualHosts } from "../../../hooks/useVirtualHosts";

// Mock the hooks
vi.mock("../../../hooks/useVirtualHosts");
vi.mock("../../../hooks/useWriteOperationState", () => ({
    useWriteOperationState: () => ({
        loading: false,
        executeOperation: vi.fn(),
        reset: vi.fn(),
    }),
}));
vi.mock("../../../hooks/useWriteOperationNotifications", () => ({
    useWriteOperationNotifications: () => ({
        notifyMessagePublished: vi.fn(),
        notifyOperationError: vi.fn(),
    }),
}));
vi.mock("../../common/KeyValueEditor", () => ({
    default: () => <div data-testid="key-value-editor">KeyValueEditor</div>,
}));

const mockUseVirtualHosts = vi.mocked(useVirtualHosts);

const mockVirtualHosts = [
    { name: "/", description: "Default virtual host" },
    { name: "test-vhost", description: "Test virtual host" },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const theme = createTheme();
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe("PublishMessageDialog - Auto-refresh Fix", () => {
    const defaultProps = {
        open: true,
        clusterId: "test-cluster",
        context: "exchange" as const,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("preserves user input when virtual hosts data refreshes", async () => {
        let virtualHostsState = mockVirtualHosts;
        let triggerRefresh: () => void;

        // Mock the hook to allow triggering updates
        mockUseVirtualHosts.mockImplementation(() => {
            const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
            triggerRefresh = forceUpdate;
            return {
                virtualHosts: virtualHostsState,
                loading: false,
                error: null,
                loadVirtualHosts: vi.fn(),
                clearError: vi.fn(),
                refresh: vi.fn(),
            };
        });

        const user = userEvent.setup();

        render(
            <PublishMessageDialog {...defaultProps} />,
            { wrapper: TestWrapper }
        );

        // Wait for the dialog to initialize
        await waitFor(() => {
            expect(screen.getByDisplayValue("/")).toBeInTheDocument();
        });

        // Type in the message payload field
        const payloadInput = screen.getByRole("textbox", {
            name: /message payload/i,
        });

        await user.type(payloadInput, "This is my important message that should not be lost");

        // Verify the text was entered
        expect(payloadInput).toHaveValue("This is my important message that should not be lost");

        // Simulate auto-refresh by triggering virtual hosts refresh (with same data)
        // This simulates what happens during auto-refresh - the same data is reloaded
        await waitFor(() => {
            triggerRefresh!();
        });

        // Wait a bit for any effects to run
        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify that the user's input is still preserved
        expect(payloadInput).toHaveValue("This is my important message that should not be lost");
    });

    it("only resets form when dialog actually opens, not on virtual hosts refresh", async () => {
        let virtualHostsState = mockVirtualHosts;
        let setVirtualHostsState: (hosts: typeof mockVirtualHosts) => void;

        // Mock with controllable state
        mockUseVirtualHosts.mockImplementation(() => {
            const [hosts, setHosts] = React.useState(virtualHostsState);
            setVirtualHostsState = setHosts;
            return {
                virtualHosts: hosts,
                loading: false,
                error: null,
                loadVirtualHosts: vi.fn(),
                clearError: vi.fn(),
                refresh: vi.fn(),
            };
        });

        const user = userEvent.setup();

        const { rerender } = render(
            <PublishMessageDialog {...defaultProps} open={false} />,
            { wrapper: TestWrapper }
        );

        // Open the dialog
        rerender(
            <PublishMessageDialog {...defaultProps} open={true} />
        );

        // Wait for initialization
        await waitFor(() => {
            expect(screen.getByDisplayValue("/")).toBeInTheDocument();
        });

        // Type in payload
        const payloadInput = screen.getByRole("textbox", {
            name: /message payload/i,
        });
        await user.type(payloadInput, "My message content");
        expect(payloadInput).toHaveValue("My message content");

        // Simulate virtual hosts refresh with same data (auto-refresh scenario)
        setVirtualHostsState!([...mockVirtualHosts]); // Same data, different array reference

        await waitFor(() => {
            // Content should still be there
            expect(payloadInput).toHaveValue("My message content");
        });

        // Close and reopen dialog - this SHOULD reset the form
        rerender(
            <PublishMessageDialog {...defaultProps} open={false} />
        );

        rerender(
            <PublishMessageDialog {...defaultProps} open={true} />
        );

        await waitFor(() => {
            const newPayloadInput = screen.getByRole("textbox", {
                name: /message payload/i,
            });
            expect(newPayloadInput).toHaveValue(""); // Should be empty on fresh open
        });
    });
});