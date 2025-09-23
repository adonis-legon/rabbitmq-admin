import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Box,
  useTheme,
} from "@mui/material";
import {
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/constants";
import { useNotification } from "../../contexts/NotificationContext";

export const UserMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { success, error } = useNotification();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate(ROUTES.PROFILE);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
      success("Logged out successfully");
      // Navigate to login and clear any previous location state
      navigate(ROUTES.LOGIN, { replace: true, state: null });
    } catch (err) {
      error("Logout failed. You have been signed out anyway.");
      // Even if logout fails, redirect to login and clear state
      navigate(ROUTES.LOGIN, { replace: true, state: null });
    }
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <>
      <IconButton
        size="large"
        edge="end"
        aria-label="user account menu"
        aria-controls="user-menu"
        aria-haspopup="true"
        onClick={handleMenuOpen}
        sx={{
          color: theme.palette.primary.contrastText,
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.1)", // Changed to dark overlay for better contrast
          },
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: theme.palette.primary.dark,
            color: "#FFFFFF", // Keep white text in avatar for contrast against dark blue background
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {user ? getInitials(user.username) : <AccountCircleIcon />}
        </Avatar>
      </IconButton>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* User info header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.username}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              textTransform: "capitalize",
            }}
          >
            {user?.role?.toLowerCase()}
          </Typography>
        </Box>

        <Divider />

        {/* Profile menu item */}
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>

        <Divider />

        {/* Sign out menu item */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            color: theme.palette.error.main,
            "&:hover": {
              backgroundColor: theme.palette.error.light + "20",
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon
              fontSize="small"
              sx={{ color: theme.palette.error.main }}
            />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
