import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import Dashboard from '../Dashboard';
import { useAuth } from '../../auth/AuthProvider';
import { useDashboardClusters } from '../../../hooks/useDashboardClusters';
import { UserRole } from '../../../types/auth';

// Mock the hooks
vi.mock('../../auth/AuthProvider');
vi.mock('../../../hooks/useDashboardClusters');

const mockUseAuth = vi.mocked(useAuth);
const mockUseDashboardClusters = vi.mocked(useDashboardClusters);

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

const mockUser = {
  id: '1',
  username: 'testuser',
  role: UserRole.USER,
  createdAt: '2024-01-01T00:00:00Z'
};

const mockClusters = [
  {
    id: '1',
    name: 'Test Cluster 1',
    apiUrl: 'http://localhost:15672',
    username: 'admin',
    password: 'password',
    description: 'Test cluster 1',
    active: true,
    assignedUsers: []
  },
  {
    id: '2',
    name: 'Test Cluster 2',
    apiUrl: 'http://localhost:15673',
    username: 'admin',
    password: 'password',
    description: 'Test cluster 2',
    active: false,
    assignedUsers: []
  }
];

describe('Dashboard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseDashboardClusters.mockReturnValue({
      clusters: [],
      selectedCluster: null,
      loading: true,
      error: null,
      selectCluster: vi.fn(),
      refreshClusters: vi.fn(),
      clearError: vi.fn()
    });

    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const mockRefreshClusters = vi.fn();
    mockUseDashboardClusters.mockReturnValue({
      clusters: [],
      selectedCluster: null,
      loading: false,
      error: 'Failed to load clusters',
      selectCluster: vi.fn(),
      refreshClusters: mockRefreshClusters,
      clearError: vi.fn()
    });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Failed to load clusters')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders no clusters message when user has no assigned clusters', () => {
    mockUseDashboardClusters.mockReturnValue({
      clusters: [],
      selectedCluster: null,
      loading: false,
      error: null,
      selectCluster: vi.fn(),
      refreshClusters: vi.fn(),
      clearError: vi.fn()
    });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('No Cluster Connections Assigned')).toBeInTheDocument();
    expect(screen.getByText(/You don't have access to any RabbitMQ clusters yet/)).toBeInTheDocument();
  });

  it('renders dashboard with clusters', async () => {
    mockUseDashboardClusters.mockReturnValue({
      clusters: mockClusters,
      selectedCluster: mockClusters[0],
      loading: false,
      error: null,
      selectCluster: vi.fn(),
      refreshClusters: vi.fn(),
      clearError: vi.fn()
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Welcome back, testuser!/)).toBeInTheDocument();
      expect(screen.getByText('Your Cluster Connections')).toBeInTheDocument();
      expect(screen.getAllByText('Test Cluster 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Test Cluster 2').length).toBeGreaterThan(0);
    });
  });

  it('shows selected cluster information', async () => {
    mockUseDashboardClusters.mockReturnValue({
      clusters: mockClusters,
      selectedCluster: mockClusters[0],
      loading: false,
      error: null,
      selectCluster: vi.fn(),
      refreshClusters: vi.fn(),
      clearError: vi.fn()
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getAllByText('Test Cluster 1')).toHaveLength(4); // ClusterSelector dropdown, ClusterSelector selected, ClusterCard, and Alert
      expect(screen.getByText(/is currently selected/)).toBeInTheDocument();
    });
  });
});