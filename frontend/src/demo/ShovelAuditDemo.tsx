import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import AuditDetailModal from "../components/audit/AuditDetailModal";
import {
    AuditRecord,
    AuditOperationType,
    AuditOperationStatus,
} from "../types/audit";

const ShovelAuditDemo: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false);

    const sampleShovelAuditRecord: AuditRecord = {
        id: "demo-1",
        username: "admin",
        clusterName: "production-cluster",
        operationType: AuditOperationType.MOVE_MESSAGES_QUEUE,
        resourceType: "shovels",
        resourceName: "orders-queue -> orders-processed-queue",
        status: AuditOperationStatus.SUCCESS,
        timestamp: "2024-01-15T14:30:00Z",
        clientIp: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        createdAt: "2024-01-15T14:30:05Z",
        resourceDetails: {
            shovelName: "orders-migration-shovel",
            vhost: "/production",
            sourceQueue: "orders-queue",
            destinationQueue: "orders-processed-queue",
            sourceQueueMessageCount: 1247, // This could be added in the future
        },
    };

    const regularAuditRecord: AuditRecord = {
        id: "demo-2",
        username: "admin",
        clusterName: "production-cluster",
        operationType: AuditOperationType.CREATE_QUEUE,
        resourceType: "queue",
        resourceName: "test-queue",
        status: AuditOperationStatus.SUCCESS,
        timestamp: "2024-01-15T14:25:00Z",
        clientIp: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        createdAt: "2024-01-15T14:25:02Z",
    };

    const [currentRecord, setCurrentRecord] = useState<AuditRecord>(sampleShovelAuditRecord);

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
                Audit Detail Modal Demo
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Test Different Audit Types:
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button
                    variant="contained"
                    onClick={() => {
                        setCurrentRecord(sampleShovelAuditRecord);
                        setModalOpen(true);
                    }}
                >
                    View Shovel Audit (MOVE_MESSAGES_QUEUE)
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => {
                        setCurrentRecord(regularAuditRecord);
                        setModalOpen(true);
                    }}
                >
                    View Regular Audit (CREATE_QUEUE)
                </Button>
            </Box>

            <Typography variant="body1">
                Click the buttons above to see how the audit detail modal displays different types of operations.
                The shovel audit should show enhanced information about source and destination queues.
            </Typography>

            <AuditDetailModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                record={currentRecord}
                showLocalTime={true}
            />
        </Box>
    );
};

export default ShovelAuditDemo;