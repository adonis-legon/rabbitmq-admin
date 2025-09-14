import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common';
import { ErrorProvider } from './contexts/ErrorContext';
import { AuthProvider, LoginForm, ProtectedRoute, AdminRoute } from './components/auth';
import { AppLayout } from './components/layout';
import { Dashboard } from './components/dashboard';
import { UserList, Profile } from './components/users';
import { ClusterConnectionList } from './components/clusters';
import { ROUTES } from './utils/constants';

// Sky blue theme as specified in requirements
const theme = createTheme({
  palette: {
    primary: {
      main: '#87CEEB', // Sky blue
      dark: '#4682B4', // Steel blue
      light: '#B0E0E6', // Powder blue
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2E8B57', // Sea green for accents
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#7F8C8D',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#87CEEB',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E0E0E0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: 'rgba(135, 206, 235, 0.1)',
          },
        },
      },
    },
  },
});

// Placeholder components for pages - to be implemented in later tasks
const RabbitMQPage = () => <div>RabbitMQ Page - To be implemented in later tasks</div>;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <ErrorProvider>
          <AuthProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                <Route path={ROUTES.LOGIN} element={<LoginForm />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Routes>
                          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                          <Route path={ROUTES.PROFILE} element={<Profile />} />
                          <Route
                            path={ROUTES.USERS}
                            element={
                              <AdminRoute>
                                <UserList />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path={ROUTES.CLUSTERS}
                            element={
                              <AdminRoute>
                                <ClusterConnectionList />
                              </AdminRoute>
                            }
                          />
                          <Route path={ROUTES.RABBITMQ} element={<RabbitMQPage />} />
                          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                        </Routes>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </AuthProvider>
        </ErrorProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;