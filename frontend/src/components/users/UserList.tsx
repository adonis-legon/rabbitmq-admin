import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
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
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  LockOpen as UnlockIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { User } from "../../types/user";
import { UserRole } from "../../types/auth";
import { userApi } from "../../services/api/userApi";
import { useAuth } from "../auth/AuthProvider";
import { UserForm, UserDetails } from "./index";
import { useNotification } from "../../contexts/NotificationContext";
import { Breadcrumbs, SearchAndFilter } from "../common";
import { getIcon, IconSizes } from "../../utils/icons";
import ResourceTable from "../resources/shared/ResourceTable";

const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error: notifyError } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [userForAction, setUserForAction] = useState<User | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await userApi.getUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      const errorMessage = "Failed to load users. Please try again.";
      setError(errorMessage);
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter.length > 0) {
      filtered = filtered.filter((user) => roleFilter.includes(user.role));
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      await userApi.deleteUser(userToDelete.id);
      const updatedUsers = users.filter((u) => u.id !== userToDelete.id);
      setUsers(updatedUsers);
      success(`User "${userToDelete.username}" deleted successfully`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      const errorMessage = "Failed to delete user. Please try again.";
      setError(errorMessage);
      notifyError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnlockUser = async (user: User) => {
    try {
      const unlockedUser = await userApi.unlockUser(user.id);
      // Update the user in the list
      setUsers(users.map((u) => (u.id === user.id ? unlockedUser : u)));
      success(`User "${user.username}" has been unlocked`);
    } catch (err) {
      const errorMessage = "Failed to unlock user. Please try again.";
      notifyError(errorMessage);
    }
  };

  const handleFormSuccess = (savedUser: User) => {
    if (selectedUser) {
      // Update existing user
      setUsers(users.map((u) => (u.id === savedUser.id ? savedUser : u)));
    } else {
      // Add new user
      setUsers([...users, savedUser]);
    }
    setFormOpen(false);
    setSelectedUser(null);

    // Clear any existing errors
    setError(null);
  };

  // Filter handlers
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleRoleFilterChange = (roles: string[]) => {
    setRoleFilter(roles);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter([]);
  };

  // Role filter options
  const roleOptions = [
    { value: UserRole.ADMINISTRATOR, label: "Administrator" },
    { value: UserRole.USER, label: "User" },
  ];

  const getRoleColor = (role: UserRole): "primary" | "secondary" => {
    return role === UserRole.ADMINISTRATOR ? "primary" : "secondary";
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if current user is admin
  const isAdmin = currentUser?.role === UserRole.ADMINISTRATOR;

  // Handle action menu
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setUserForAction(user);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setUserForAction(null);
  };

  // Handle row click
  const handleRowClick = (params: GridRowParams) => {
    const user = params.row as User;
    handleViewUser(user);
  };

  // Format user data for display
  const formatUserData = (users: User[]) => {
    return users.map((user) => ({
      ...user,
      id: user.id, // Use ID for DataGrid
      statusText: user.locked ? "Locked" : "Active",
      assignedClustersCount: user.assignedClusters.length,
      createdAtFormatted: formatDate(user.createdAt),
    }));
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: "username",
      headerName: "Username",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getIcon("users", { fontSize: 16 })}
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getRoleColor(params.value)}
          size="small"
          variant="filled"
        />
      ),
    },
    {
      field: "statusText",
      headerName: "Status",
      width: 140,
      renderCell: (params) => (
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          justifyContent: "center",
          alignItems: "flex-start",
          height: "100%"
        }}>
          <Chip
            label={params.value}
            color={params.row.locked ? "error" : "success"}
            size="small"
            icon={params.row.locked ? <ErrorIcon /> : <CheckCircleIcon />}
          />
          {params.row.locked && params.row.failedLoginAttempts && (
            <Typography variant="caption" color="text.secondary">
              {params.row.failedLoginAttempts} failed attempts
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "assignedClustersCount",
      headerName: "Assigned Clusters",
      width: 160,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
          {getIcon("clusters", { fontSize: 16 })}
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            cluster{params.value !== 1 ? "s" : ""}
          </Typography>
        </Box>
      ),
    },
    {
      field: "createdAtFormatted",
      headerName: "Created At",
      width: 180,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" fontFamily="monospace">
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
      resizable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => handleActionMenuOpen(event, params.row as User)}
          aria-label={`Actions for user ${params.row.username}`}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  if (!isAdmin) {
    return (
      <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}>
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
              label: "Users",
              icon: getIcon("users", {
                fontSize: IconSizes.breadcrumb,
                sx: { mr: 0.5 },
              }),
            },
          ]}
        />
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don't have permission to access user management. Administrator
            privileges are required.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          mt: { xs: 1, sm: 2 },
          mb: 4,
          px: { xs: 1, sm: 3 },
          display: "flex",
          justifyContent: "center",
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
            label: "Users",
            icon: getIcon("users", {
              fontSize: IconSizes.breadcrumb,
              sx: { mr: 0.5 },
            }),
          },
        ]}
      />

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Users
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filterValue={roleFilter}
        onFilterChange={handleRoleFilterChange}
        filterOptions={roleOptions}
        filterLabel="Role"
        onClearAll={handleClearFilters}
        disabled={loading}
        searchPlaceholder="Search users by username..."
      />

      <ResourceTable
        data={formatUserData(filteredUsers)}
        columns={columns}
        loading={loading}
        error={error}
        onRowClick={handleRowClick}
        getRowId={(row) => row.id}
        emptyMessage={
          users.length === 0
            ? 'No users found. Click "Add User" to create the first user.'
            : "No users match the current filters."
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
        <MenuItem onClick={() => { handleViewUser(userForAction!); handleActionMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleEditUser(userForAction!); handleActionMenuClose(); }}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        {userForAction?.locked && currentUser?.role === UserRole.ADMINISTRATOR && (
          <MenuItem onClick={() => { handleUnlockUser(userForAction!); handleActionMenuClose(); }}>
            <ListItemIcon>
              <UnlockIcon />
            </ListItemIcon>
            <ListItemText>Unlock User</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => { handleDeleteUser(userForAction!); handleActionMenuClose(); }}
          disabled={userForAction?.id === currentUser?.id}
        >
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* User Form Dialog */}
      <UserForm
        open={formOpen}
        user={selectedUser}
        onClose={() => {
          setFormOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* User Details Dialog */}
      <UserDetails
        open={detailsOpen}
        user={selectedUser}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedUser(null);
        }}
        onEdit={() => {
          setDetailsOpen(false);
          setFormOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.username}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteUser}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList;
