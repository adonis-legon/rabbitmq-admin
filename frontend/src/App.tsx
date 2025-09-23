import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ErrorBoundary } from "./components/common";
import { ErrorProvider } from "./contexts/ErrorContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ClusterProvider } from "./contexts/ClusterContext";
import {
  AuthProvider,
  LoginForm,
  ProtectedRoute,
  AdminRoute,
} from "./components/auth";
import { AuthNavigationSetup } from "./components/auth/AuthNavigationSetup";
import { AppLayout } from "./components/layout";
import { Dashboard } from "./components/dashboard";
import { UserList, Profile } from "./components/users";
import { ClusterConnectionList } from "./components/clusters";
import {
  ResourceRoute,
  ConnectionsPage,
  ChannelsPage,
  ExchangesPage,
  QueuesPage,
} from "./components/resources";
import { ROUTES } from "./utils/constants";

// Sky blue theme as specified in requirements
const theme = createTheme({
  palette: {
    primary: {
      main: "#87CEEB", // Sky blue
      dark: "#4682B4", // Steel blue
      light: "#B0E0E6", // Powder blue
      contrastText: "#000000", // Changed from white to black for better visibility
    },
    secondary: {
      main: "#2E8B57", // Sea green for accents
    },
    background: {
      default: "#F8F9FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#2C3E50",
      secondary: "#7F8C8D",
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
          backgroundColor: "#87CEEB",
          color: "#000000", // Ensure black text color
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E0E0E0",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          margin: "2px 8px",
          "&:hover": {
            backgroundColor: "rgba(135, 206, 235, 0.1)",
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <ErrorProvider>
          <NotificationProvider>
            <AuthProvider>
              <ClusterProvider>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <AuthNavigationSetup />
                  <Routes>
                    <Route path={ROUTES.LOGIN} element={<LoginForm />} />
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Routes>
                              <Route
                                path={ROUTES.DASHBOARD}
                                element={<Dashboard />}
                              />
                              <Route
                                path={ROUTES.PROFILE}
                                element={<Profile />}
                              />
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
                              {/* Resource Management Routes */}
                              <Route
                                path={ROUTES.RESOURCES_CONNECTIONS}
                                element={
                                  <ResourceRoute>
                                    <ConnectionsPage />
                                  </ResourceRoute>
                                }
                              />
                              <Route
                                path={ROUTES.RESOURCES_CHANNELS}
                                element={
                                  <ResourceRoute>
                                    <ChannelsPage />
                                  </ResourceRoute>
                                }
                              />
                              <Route
                                path={ROUTES.RESOURCES_EXCHANGES}
                                element={
                                  <ResourceRoute>
                                    <ExchangesPage />
                                  </ResourceRoute>
                                }
                              />
                              <Route
                                path={ROUTES.RESOURCES_QUEUES}
                                element={
                                  <ResourceRoute>
                                    <QueuesPage />
                                  </ResourceRoute>
                                }
                              />
                              {/* Redirect /resources to connections by default */}
                              <Route
                                path={ROUTES.RESOURCES}
                                element={
                                  <Navigate
                                    to={ROUTES.RESOURCES_CONNECTIONS}
                                    replace
                                  />
                                }
                              />

                              <Route
                                path="/"
                                element={
                                  <Navigate to={ROUTES.DASHBOARD} replace />
                                }
                              />
                              <Route
                                path="*"
                                element={
                                  <Navigate to={ROUTES.DASHBOARD} replace />
                                }
                              />
                            </Routes>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Router>
              </ClusterProvider>
            </AuthProvider>
          </NotificationProvider>
        </ErrorProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
