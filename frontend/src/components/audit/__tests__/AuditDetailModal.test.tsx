import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import AuditDetailModal from "../AuditDetailModal";
import {
    AuditRecord,
    AuditOperationType,
    AuditOperationStatus,
} from "../../../types/audit";

describe("AuditDetailModal", () => {
    const mockOnClose = vi.fn();

    const baseAuditRecord: AuditRecord = {
        id: "1",
        username: "testuser",
        clusterName: "test-cluster",
        operationType: AuditOperationType.CREATE_QUEUE,
        resourceType: "queue",
        resourceName: "test-queue",
        status: AuditOperationStatus.SUCCESS,
        timestamp: "2024-01-01T12:00:00Z",
        clientIp: "192.168.1.1",
        userAgent: "test-agent",
        createdAt: "2024-01-01T12:00:00Z",
    };

    beforeEach(() => {
        mockOnClose.mockClear();
    });

    it("should not render when open is false", () => {
        render(
            <AuditDetailModal
                open={false}
                onClose={mockOnClose}
                record={baseAuditRecord}
            />
        );

        expect(screen.queryByText("Audit Record Details")).not.toBeInTheDocument();
    });

    it("should not render when record is null", () => {
        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={null}
            />
        );

        expect(screen.queryByText("Audit Record Details")).not.toBeInTheDocument();
    });

    it("should render basic audit record information", () => {
        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={baseAuditRecord}
            />
        );

        expect(screen.getByText("Audit Record Details")).toBeInTheDocument();
        expect(screen.getByText("Create Queue - test-queue")).toBeInTheDocument();
        expect(screen.getByText("testuser")).toBeInTheDocument();
        expect(screen.getByText("test-cluster")).toBeInTheDocument();
        expect(screen.getByText("SUCCESS")).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={baseAuditRecord}
            />
        );

        const closeButton = screen.getByRole("button", { name: /close/i });
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should display shovel operation details for MOVE_MESSAGES_QUEUE operations", () => {
        const shovelAuditRecord: AuditRecord = {
            ...baseAuditRecord,
            operationType: AuditOperationType.MOVE_MESSAGES_QUEUE,
            resourceType: "shovels",
            resourceName: "source-queue -> destination-queue",
            resourceDetails: {
                shovelName: "test-shovel",
                vhost: "/test",
                sourceQueue: "source-queue",
                destinationQueue: "destination-queue",
            },
        };

        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={shovelAuditRecord}
            />
        );

        // Check for shovel-specific section
        expect(screen.getByText("Move Messages Operation")).toBeInTheDocument();

        // Check for source queue information
        expect(screen.getByText("Source Queue")).toBeInTheDocument();
        expect(screen.getByText("source-queue")).toBeInTheDocument();

        // Check for destination queue information
        expect(screen.getByText("Destination Queue")).toBeInTheDocument();
        expect(screen.getByText("destination-queue")).toBeInTheDocument();

        // Check for vhost information (should appear twice - once for source, once for destination)
        expect(screen.getAllByText("vhost: /test")).toHaveLength(2);

        // Check for shovel name
        expect(screen.getByText("Shovel Name:")).toBeInTheDocument();
        expect(screen.getByText("test-shovel")).toBeInTheDocument();

        // Check for directional indicator
        expect(screen.getByText("Moving to")).toBeInTheDocument();
    });

    it("should not display shovel operation details for non-MOVE_MESSAGES_QUEUE operations", () => {
        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={baseAuditRecord}
            />
        );

        // Should not show shovel-specific section for other operation types
        expect(screen.queryByText("Move Messages Operation")).not.toBeInTheDocument();
        expect(screen.queryByText("Source Queue")).not.toBeInTheDocument();
        expect(screen.queryByText("Destination Queue")).not.toBeInTheDocument();
    });

    it("should handle missing resourceDetails gracefully for MOVE_MESSAGES_QUEUE operations", () => {
        const shovelAuditRecordWithoutDetails: AuditRecord = {
            ...baseAuditRecord,
            operationType: AuditOperationType.MOVE_MESSAGES_QUEUE,
            resourceType: "shovels",
            resourceName: "test-shovel",
            // resourceDetails is undefined
        };

        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={shovelAuditRecordWithoutDetails}
            />
        );

        // Should not show shovel-specific section when resourceDetails is missing
        expect(screen.queryByText("Move Messages Operation")).not.toBeInTheDocument();
    });

    it("should handle partial resourceDetails for MOVE_MESSAGES_QUEUE operations", () => {
        const shovelAuditRecordPartial: AuditRecord = {
            ...baseAuditRecord,
            operationType: AuditOperationType.MOVE_MESSAGES_QUEUE,
            resourceType: "shovels",
            resourceName: "test-shovel",
            resourceDetails: {
                sourceQueue: "source-queue",
                destinationQueue: "destination-queue",
                // Missing shovelName and vhost
            },
        };

        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={shovelAuditRecordPartial}
            />
        );

        // Should show the section
        expect(screen.getByText("Move Messages Operation")).toBeInTheDocument();

        // Should show available queue information
        expect(screen.getByText("source-queue")).toBeInTheDocument();
        expect(screen.getByText("destination-queue")).toBeInTheDocument();

        // Should show N/A for missing information or simply not show optional fields
        expect(screen.queryByText("Shovel Name:")).not.toBeInTheDocument();
        expect(screen.queryByText("vhost:")).not.toBeInTheDocument();
    });

    it("should display N/A for missing queue names in shovel operations", () => {
        const shovelAuditRecordMissingQueues: AuditRecord = {
            ...baseAuditRecord,
            operationType: AuditOperationType.MOVE_MESSAGES_QUEUE,
            resourceType: "shovels",
            resourceName: "test-shovel",
            resourceDetails: {
                shovelName: "test-shovel",
                vhost: "/test",
                // Missing sourceQueue and destinationQueue
            },
        };

        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={shovelAuditRecordMissingQueues}
            />
        );

        // Should show N/A for missing queue information
        expect(screen.getAllByText("N/A")).toHaveLength(2); // One for source, one for destination
    });

    test("should display message count when available in shovel operations", () => {
        const mockRecord: AuditRecord = {
            id: "1",
            timestamp: "2023-01-01T12:00:00Z",
            username: "test-user",
            clientIp: "192.168.1.1",
            clusterName: "test-cluster",
            resourceType: "QUEUE",
            resourceName: "test-resource",
            operationType: AuditOperationType.MOVE_MESSAGES_QUEUE,
            status: AuditOperationStatus.SUCCESS,
            errorMessage: undefined,
            resourceDetails: {
                sourceQueue: "source-queue",
                destinationQueue: "destination-queue",
                vhost: "/test",
                shovelName: "test-shovel",
                sourceQueueMessageCount: 150
            }
        };

        render(<AuditDetailModal open={true} onClose={mockOnClose} record={mockRecord} />);

        // First check if the basic modal is rendered
        expect(screen.getByText("Audit Record Details")).toBeInTheDocument();

        // Check if Operation Overview is rendered
        expect(screen.getByText("Operation Overview")).toBeInTheDocument();

        // Check if Move Messages Operation section is displayed
        expect(screen.getByText("Move Messages Operation")).toBeInTheDocument();

        // Check if shovel information is displayed
        expect(screen.getByText("Source Queue")).toBeInTheDocument();
        expect(screen.getByText("source-queue")).toBeInTheDocument();
        expect(screen.getByText("Destination Queue")).toBeInTheDocument();
        expect(screen.getByText("destination-queue")).toBeInTheDocument();



        // Check if message count is displayed
        expect(screen.getByText(/Messages at creation:/)).toBeInTheDocument();
        const messageCountElements = screen.getAllByText(/150/);
        expect(messageCountElements).toHaveLength(2); // One in UI, one in JSON        // Check if shovel name is displayed
        expect(screen.getByText("test-shovel")).toBeInTheDocument();
    });

    it("should not display message count when not available in shovel operations", () => {
        const shovelAuditRecordWithoutMessageCount: AuditRecord = {
            ...baseAuditRecord,
            operationType: AuditOperationType.MOVE_MESSAGES_QUEUE,
            resourceType: "shovels",
            resourceName: "test-shovel",
            resourceDetails: {
                shovelName: "test-shovel",
                vhost: "/test",
                sourceQueue: "source-queue",
                destinationQueue: "destination-queue",
                // No sourceQueueMessageCount
            },
        };

        render(
            <AuditDetailModal
                open={true}
                onClose={mockOnClose}
                record={shovelAuditRecordWithoutMessageCount}
            />
        );

        // Should not show message count information when not available
        expect(screen.queryByText("Messages at creation:")).not.toBeInTheDocument();
    });
});