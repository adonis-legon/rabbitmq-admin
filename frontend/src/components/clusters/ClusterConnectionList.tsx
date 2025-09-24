import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as TestIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { ClusterConnection } from "../../types/cluster";
import { useClusters } from "../../hooks/useClusters";
import ClusterConnectionForm from "./ClusterConnectionForm";
import ConnectionTest from "./ConnectionTest";
import { useNotification } from "../../contexts/NotificationContext";
import { Breadcrumbs, SearchAndFilter } from "../common";
import { getIcon, IconSizes } from "../../utils/icons";

const ClusterConnectionList: React.FC = () => {
  const { clusters, loading, error, deleteCluster, clearError, loadClusters } =
    useClusters();
  const { success } = useNotification();
  const [formOpen, setFormOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] =
    useState<ClusterConnection | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clusterToDelete, setClusterToDelete] =
    useState<ClusterConnection | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filteredClusters, setFilteredClusters] = useState<ClusterConnection[]>(
    []
  );

  const handleCreateCluster = () => {
    setSelectedCluster(null);
    setFormOpen(true);
  };

  const handleEditCluster = (cluster: ClusterConnection) => {
    setSelectedCluster(cluster);
    setFormOpen(true);
  };

  const handleTestConnection = (cluster: ClusterConnection) => {
    setSelectedCluster(cluster);
    setTestOpen(true);
  };

  const handleDeleteClick = (cluster: ClusterConnection) => {
    setClusterToDelete(cluster);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clusterToDelete) return;

    try {
      setDeleting(true);
      await deleteCluster(clusterToDelete.id);
      success(
        `Cluster connection "${clusterToDelete.name}" deleted successfully`
      );
      setDeleteDialogOpen(false);
      setClusterToDelete(null);
    } catch (err: any) {
      // Error is handled by the hook
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    // The useClusters hook should automatically update the state
    // but let's also trigger a manual refresh to ensure consistency
    loadClusters();
    setFormOpen(false);
    setSelectedCluster(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedCluster(null);
  };

  const handleTestClose = () => {
    setTestOpen(false);
    setSelectedCluster(null);
  };

  // Filter clusters based on search term and status filter
  useEffect(() => {
    let filtered = clusters;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (cluster) =>
          cluster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cluster.apiUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cluster.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cluster.description &&
            cluster.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((cluster) => {
        const status = cluster.active ? "active" : "inactive";
        return statusFilter.includes(status);
      });
    }

    setFilteredClusters(filtered);
  }, [clusters, searchTerm, statusFilter]);

  // Filter handlers
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleStatusFilterChange = (statuses: string[]) => {
    setStatusFilter(statuses);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter([]);
  };

  // Status filter options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          mt: { xs: 1, sm: 2 },
          mb: 4,
          px: { xs: 1, sm: 3 },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          {
            label: "Management",
            icon: getIcon("management", {
              fontSize: IconSizes.breadcrumb,
              sx: { mr: 0.5 },
            }),
          },
          {
            label: "Clusters",
            icon: getIcon("clusters", {
              fontSize: IconSizes.breadcrumb,
              sx: { mr: 0.5 },
            }),
          },
        ]}
      />

      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Cluster Connections
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadClusters}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateCluster}
          >
            Add Cluster Connection
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        filterLabel="Status"
        onClearAll={handleClearFilters}
        disabled={loading}
        searchPlaceholder="Search clusters by name, URL, username, or description..."
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>API URL</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned Users</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClusters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {clusters.length === 0
                      ? "No cluster connections found. Create your first connection to get started."
                      : "No clusters match the current filters."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredClusters.map((cluster) => (
                <TableRow key={cluster.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {cluster.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {cluster.apiUrl}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cluster.username}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        cluster.active ? <CheckCircleIcon /> : <ErrorIcon />
                      }
                      label={cluster.active ? "Active" : "Inactive"}
                      color={cluster.active ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cluster.assignedUsers.length} user
                      {cluster.assignedUsers.length !== 1 ? "s" : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {cluster.description || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        justifyContent: "flex-end",
                      }}
                    >
                      <Tooltip title="Test Connection">
                        <IconButton
                          size="small"
                          onClick={() => handleTestConnection(cluster)}
                        >
                          <TestIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditCluster(cluster)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(cluster)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Form Dialog */}
      <ClusterConnectionForm
        open={formOpen}
        cluster={selectedCluster}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Connection Test Dialog */}
      {selectedCluster && (
        <ConnectionTest
          open={testOpen}
          cluster={selectedCluster}
          onClose={handleTestClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Cluster Connection</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the cluster connection "
            {clusterToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The connection will be removed from
            all assigned users.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClusterConnectionList;
