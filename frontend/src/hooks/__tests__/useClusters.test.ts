import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useClusters } from '../useClusters';
import { clusterApi } from '../../services/api/clusterApi';

// Mock the dependencies
vi.mock('../../services/api/clusterApi');

const mockClusterApi = vi.mocked(clusterApi);

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

describe('useClusters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads clusters successfully', async () => {
    mockClusterApi.getClusters.mockResolvedValue(mockClusters);

    const { result } = renderHook(() => useClusters());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.clusters).toEqual(mockClusters);
    expect(result.current.error).toBeNull();
  });

  it('handles API error', async () => {
    mockClusterApi.getClusters.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useClusters());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.clusters).toEqual([]);
    expect(result.current.error).toBe('Failed to load cluster connections. Please try again.');
  });

  it('creates cluster successfully', async () => {
    const newCluster = { ...mockClusters[0], id: '3', name: 'New Cluster' };
    mockClusterApi.getClusters.mockResolvedValue(mockClusters);
    mockClusterApi.createCluster.mockResolvedValue(newCluster);

    const { result } = renderHook(() => useClusters());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const createData = {
      name: 'New Cluster',
      apiUrl: 'http://localhost:15674',
      username: 'admin',
      password: 'password',
      active: true
    };

    await result.current.createCluster(createData);

    expect(mockClusterApi.createCluster).toHaveBeenCalledWith(createData);
    
    await waitFor(() => {
      expect(result.current.clusters).toContainEqual(newCluster);
    });
  });

  it('deletes cluster successfully', async () => {
    mockClusterApi.getClusters.mockResolvedValue(mockClusters);
    mockClusterApi.deleteCluster.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClusters());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.deleteCluster('1');

    expect(mockClusterApi.deleteCluster).toHaveBeenCalledWith('1');
    
    await waitFor(() => {
      expect(result.current.clusters).not.toContainEqual(mockClusters[0]);
    });
  });

  it('tests connection successfully', async () => {
    const testResult = { success: true, message: 'Connection successful' };
    mockClusterApi.getClusters.mockResolvedValue(mockClusters);
    mockClusterApi.testConnection.mockResolvedValue(testResult);

    const { result } = renderHook(() => useClusters());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const testData = {
      apiUrl: 'http://localhost:15672',
      username: 'admin',
      password: 'password'
    };

    const response = await result.current.testConnection('1', testData);

    expect(mockClusterApi.testConnection).toHaveBeenCalledWith('1', testData);
    expect(response).toEqual(testResult);
  });
});