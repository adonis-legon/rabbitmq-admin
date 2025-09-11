import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { UserRole } from '../../types/auth';
import { ROUTES } from '../../utils/constants';

interface SidebarProps {
  onItemClick?: () => void;
}

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: ROUTES.DASHBOARD,
  },
  {
    text: 'User Management',
    icon: <PeopleIcon />,
    path: ROUTES.USERS,
    adminOnly: true,
  },
  {
    text: 'Cluster Management',
    icon: <StorageIcon />,
    path: ROUTES.CLUSTERS,
    adminOnly: true,
  },
  {
    text: 'RabbitMQ',
    icon: <SettingsIcon />,
    path: ROUTES.RABBITMQ,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();

  const isAdmin = user?.role === UserRole.ADMINISTRATOR;

  const handleNavigation = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const filteredItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Toolbar spacer to align with top bar */}
      <Toolbar>
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Navigation
        </Typography>
      </Toolbar>

      <Divider />

      {/* Navigation items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ pt: 1 }}>
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 1,
                    backgroundColor: isActive 
                      ? theme.palette.primary.light 
                      : 'transparent',
                    color: isActive 
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isActive 
                        ? theme.palette.primary.main 
                        : theme.palette.action.hover,
                    },
                    transition: theme.transitions.create(['background-color'], {
                      duration: theme.transitions.duration.short,
                    }),
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive 
                        ? theme.palette.primary.contrastText 
                        : theme.palette.text.secondary,
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User info section at bottom */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            display: 'block',
            mb: 0.5,
          }}
        >
          Signed in as
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 500,
          }}
        >
          {user?.username}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            textTransform: 'capitalize',
          }}
        >
          {user?.role?.toLowerCase()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;