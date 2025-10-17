import React, { useState, useEffect } from "react";
import {
  Box,
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as TestIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { GridColDef } from "@mui/x-data-grid";
import { ClusterConnection } from "../../types/cluster";
import { useClusters } from "../../hooks/useClusters";
import ClusterConnectionForm from "./ClusterConnectionForm";
import ConnectionTest from "./ConnectionTest";
import { useNotification } from "../../contexts/NotificationContext";
import { Breadcrumbs, SearchAndFilter } from "../common";
import { getIcon, IconSizes } from "../../utils/icons";
import ResourceTable from "../resources/shared/ResourceTable";

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
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [clusterForAction, setClusterForAction] = useState<ClusterConnection | null>(null);

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

  // Handle action menu
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, cluster: ClusterConnection) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setClusterForAction(cluster);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setClusterForAction(null);
  };

  // Handle row click (optional - could open edit dialog or details)
  const handleRowClick = () => {
    // const cluster = params.row as ClusterConnection;
    // Could implement view details here if needed
  };

  // Format cluster data for display
  const formatClusterData = (clusters: ClusterConnection[]) => {
    return clusters.map((cluster) => ({
      ...cluster,
      id: cluster.id, // Use ID for DataGrid
      statusText: cluster.active ? "Active" : "Inactive",
      assignedUsersCount: cluster.assignedUsers.length,
      descriptionDisplay: cluster.description || "-",
    }));
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "apiUrl",
      headerName: "API URL",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "username",
      headerName: "Username",
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "statusText",
      headerName: "Status",
      width: 110,
      renderCell: (params) => (
        <Chip
          icon={params.row.active ? <CheckCircleIcon /> : <ErrorIcon />}
          label={params.value}
          color={params.row.active ? "success" : "error"}
          size="small"
        />
      ),
    },
    {
      field: "assignedUsersCount",
      headerName: "Assigned Users",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value} user{params.value !== 1 ? "s" : ""}
        </Typography>
      ),
    },
    {
      field: "descriptionDisplay",
      headerName: "Description",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => handleActionMenuOpen(event, params.row as ClusterConnection)}
          aria-label={`Actions for cluster ${params.row.name}`}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
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

      <ResourceTable
        data={formatClusterData(filteredClusters)}
        columns={columns}
        loading={loading}
        error={error}
        onRowClick={handleRowClick}
        getRowId={(row) => row.id}
        emptyMessage={
          clusters.length === 0
            ? "No cluster connections found. Create your first connection to get started."
            : "No clusters match the current filters."
        }
        height={600}
        disableColumnFilter={true}
        disableColumnMenu={false}
        sortingMode="client"
      />

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={() => { handleTestConnection(clusterForAction!); handleActionMenuClose(); }}>
          <ListItemIcon>
            <TestIcon />
          </ListItemIcon>
          <ListItemText>Test Connection</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleEditCluster(clusterForAction!); handleActionMenuClose(); }}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleDeleteClick(clusterForAction!); handleActionMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

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
