import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    Grid,
    Card,
    CardContent,
    IconButton,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import {
    Close as CloseIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as PartialIcon,
    Person as UserIcon,
    Storage as ClusterIcon,
    Schedule as TimeIcon,
    Info as InfoIcon,
    MoveToInbox as ShovelIcon,
    Queue as QueueIcon,
    ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import {
    AuditRecord,
    AuditOperationType,
    AuditOperationStatus,
} from "../../types/audit";
import {
    formatTimestamp,
    DEFAULT_TIMESTAMP_OPTIONS,
} from "../../utils/timestampUtils";

interface AuditDetailModalProps {
    open: boolean;
    onClose: () => void;
    record: AuditRecord | null;
    showLocalTime?: boolean;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
    open,
    onClose,
    record,
    showLocalTime = true,
}) => {
    if (!record) {
        return null;
    }



    const getStatusIcon = (status: AuditOperationStatus) => {
        switch (status) {
            case AuditOperationStatus.SUCCESS:
                return <SuccessIcon color="success" fontSize="small" />;
            case AuditOperationStatus.FAILURE:
                return <ErrorIcon color="error" fontSize="small" />;
            case AuditOperationStatus.PARTIAL:
                return <PartialIcon color="warning" fontSize="small" />;
            default:
                return <InfoIcon color="info" fontSize="small" />;
        }
    };

    const getStatusColor = (
        status: AuditOperationStatus
    ): "success" | "error" | "warning" | "default" => {
        switch (status) {
            case AuditOperationStatus.SUCCESS:
                return "success";
            case AuditOperationStatus.FAILURE:
                return "error";
            case AuditOperationStatus.PARTIAL:
                return "warning";
            default:
                return "default";
        }
    };

    const formatOperationType = (operationType: AuditOperationType): string => {
        return operationType
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: "60vh" },
            }}
        >
            <DialogTitle>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {getStatusIcon(record.status)}
                        <Box>
                            <Typography variant="h6" component="div">
                                Audit Record Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formatOperationType(record.operationType)} - {record.resourceName}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* Operation Overview */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Operation Overview
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mt: 0.5,
                                        }}
                                    >
                                        <Chip
                                            label={record.status}
                                            color={getStatusColor(record.status)}
                                            size="small"
                                            icon={getStatusIcon(record.status)}
                                        />
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Operation Type
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {formatOperationType(record.operationType)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Resource Type
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {record.resourceType}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Resource Name
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {record.resourceName}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Shovel Operation Details - Only for MOVE_MESSAGES_QUEUE */}
                {record.operationType === AuditOperationType.MOVE_MESSAGES_QUEUE && record.resourceDetails && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <ShovelIcon fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
                                Move Messages Operation
                            </Typography>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} sm={5}>
                                    <Card variant="outlined" sx={{ bgcolor: "primary.50" }}>
                                        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                <QueueIcon fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
                                                Source Queue
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {record.resourceDetails.sourceQueue || 'N/A'}
                                            </Typography>
                                            {record.resourceDetails.vhost && (
                                                <Typography variant="body2" color="text.secondary">
                                                    vhost: {record.resourceDetails.vhost}
                                                </Typography>
                                            )}
                                            {record.resourceDetails.sourceQueueMessageCount && (
                                                <Typography variant="body2" color="primary.main" fontWeight="medium">
                                                    Messages at creation: {record.resourceDetails.sourceQueueMessageCount}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={2} sx={{ textAlign: "center" }}>
                                    <ArrowIcon fontSize="large" color="primary" />
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        Moving to
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    <Card variant="outlined" sx={{ bgcolor: "success.50" }}>
                                        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                <QueueIcon fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
                                                Destination Queue
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {record.resourceDetails.destinationQueue || 'N/A'}
                                            </Typography>
                                            {record.resourceDetails.vhost && (
                                                <Typography variant="body2" color="text.secondary">
                                                    vhost: {record.resourceDetails.vhost}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                                {record.resourceDetails.shovelName && (
                                    <Grid item xs={12}>
                                        <Box sx={{ textAlign: "center", mt: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Shovel Name: <strong>{record.resourceDetails.shovelName}</strong>
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Detailed Information */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Operation Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        <UserIcon
                                            fontSize="small"
                                            sx={{ mr: 1, verticalAlign: "middle" }}
                                        />
                                        User Information
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                                        Username
                                                    </TableCell>
                                                    <TableCell>{record.username}</TableCell>
                                                </TableRow>
                                                {record.clientIp && (
                                                    <TableRow>
                                                        <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                                            IP Address
                                                        </TableCell>
                                                        <TableCell>{record.clientIp}</TableCell>
                                                    </TableRow>
                                                )}
                                                {record.userAgent && (
                                                    <TableRow>
                                                        <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                                            User Agent
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                                                {record.userAgent}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        <ClusterIcon
                                            fontSize="small"
                                            sx={{ mr: 1, verticalAlign: "middle" }}
                                        />
                                        Cluster & Resource Information
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                                        Cluster
                                                    </TableCell>
                                                    <TableCell>{record.clusterName}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                                        Resource Type
                                                    </TableCell>
                                                    <TableCell>{record.resourceType}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                                        Resource Name
                                                    </TableCell>
                                                    <TableCell>{record.resourceName}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        <TimeIcon
                                            fontSize="small"
                                            sx={{ mr: 1, verticalAlign: "middle" }}
                                        />
                                        Timing Information
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                                        Timestamp
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatTimestamp(
                                                            record.timestamp,
                                                            showLocalTime,
                                                            DEFAULT_TIMESTAMP_OPTIONS
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                                {record.createdAt && record.createdAt !== record.timestamp && (
                                                    <TableRow>
                                                        <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                                            Created At
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatTimestamp(
                                                                record.createdAt,
                                                                showLocalTime,
                                                                DEFAULT_TIMESTAMP_OPTIONS
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                {/* Resource Details */}
                {record.resourceDetails && Object.keys(record.resourceDetails).length > 0 && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Resource Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box
                                component="pre"
                                sx={{
                                    backgroundColor: "grey.100",
                                    p: 2,
                                    borderRadius: 1,
                                    fontSize: "0.875rem",
                                    overflow: "auto",
                                    maxHeight: 400,
                                    fontFamily: "monospace",
                                }}
                            >
                                {JSON.stringify(record.resourceDetails, null, 2)}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Error Details */}
                {record.errorMessage && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" color="error">
                                Error Details
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Alert severity="error">
                                <Typography variant="body2">
                                    {record.errorMessage}
                                </Typography>
                            </Alert>
                        </AccordionDetails>
                    </Accordion>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AuditDetailModal;