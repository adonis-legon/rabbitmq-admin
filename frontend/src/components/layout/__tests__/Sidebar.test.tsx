import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import { Sidebar } from "../Sidebar";
import { AuthProvider } from "../../auth/AuthProvider";
import { ClusterProvider } from "../../../contexts/ClusterContext";
import { ErrorProvider } from "../../../contexts/ErrorContext";
import { NotificationProvider } from "../../../contexts/NotificationContext";
import { UserRole } from "../../../types/auth";

// Mock the auth hook to return an admin user
vi.mock("../../auth/AuthProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../auth/AuthProvider")>();
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: "1",
        username: "admin",
        role: UserRole.ADMINISTRATOR,
      },
      isAuthenticated: true,
      isLoading: false,
    }),
  };
});

// Mock the cluster context
vi.mock("../../../contexts/ClusterContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../contexts/ClusterContext")>();
  return {
    ...actual,
    useClusterContext: () => ({
      clusters: [
        {
          id: "1",
          name: "test-cluster",
          host: "localhost",
          port: 15672,
          username: "guest",
        },
      ],
    }),
  };
});

const theme = createTheme();

const renderSidebar = () => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <ErrorProvider>
          <NotificationProvider>
            <AuthProvider>
              <ClusterProvider>
                <Sidebar />
              </ClusterProvider>
            </AuthProvider>
          </NotificationProvider>
        </ErrorProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe("Sidebar Navigation", () => {
  it("should render audit navigation item for admin users", () => {
    renderSidebar();

    // Check that the Management section is present
    expect(screen.getByText("Management")).toBeInTheDocument();

    // Check that the Audits navigation item is present
    expect(screen.getByText("Audits")).toBeInTheDocument();
  });

  it("should render all management navigation items for admin users", () => {
    renderSidebar();

    // Check that all management items are present
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Clusters")).toBeInTheDocument();
    expect(screen.getByText("Audits")).toBeInTheDocument();
  });

  it("should render main navigation items", () => {
    renderSidebar();

    // Check main navigation items
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Management")).toBeInTheDocument();
  });
});
