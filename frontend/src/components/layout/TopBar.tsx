import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { UserMenu } from './UserMenu';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        {/* Hamburger menu button */}
        <IconButton
          color="inherit"
          aria-label="toggle navigation"
          edge="start"
          onClick={onMenuClick}
          sx={{
            mr: 2,
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo and title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 600,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            RabbitMQ Admin
          </Typography>
        </Box>

        {/* User menu - positioned on the right */}
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;