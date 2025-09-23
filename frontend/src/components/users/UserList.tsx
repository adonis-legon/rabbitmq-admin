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
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { User } from "../../types/user";
import { UserRole } from "../../types/auth";
import { userApi } from "../../services/api/userApi";
import { useAuth } from "../auth/AuthProvider";
import { UserForm, UserDetails } from "./index";
import { useNotification } from "../../contexts/NotificationContext";
import { Breadcrumbs, SearchAndFilter } from "../common";
import { getIcon, IconSizes } from "../../utils/icons";

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

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Assigned Clusters</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {users.length === 0
                        ? 'No users found. Click "Add User" to create the first user.'
                        : "No users match the current filters."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.assignedClusters.length} cluster
                        {user.assignedClusters.length !== 1 ? "s" : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(user.createdAt)}
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
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewUser(user)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser?.id}
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
      </Paper>

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
