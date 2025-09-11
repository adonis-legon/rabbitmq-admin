import apiClient from './apiClient';
import { 
  ClusterConnection, 
  CreateClusterConnectionRequest, 
  UpdateClusterConnectionRequest,
  ConnectionTestRequest,
  ConnectionTestResponse 
} from '../../types/cluster';

export const clusterApi = {
  getClusters: async (): Promise<ClusterConnection[]> => {
    const response = await apiClient.get<ClusterConnection[]>('/clusters');
    return response.data;
  },

  getCluster: async (id: string): Promise<ClusterConnection> => {
    const response = await apiClient.get<ClusterConnection>(`/clusters/${id}`);
    return response.data;
  },

  createCluster: async (clusterData: CreateClusterConnectionRequest): Promise<ClusterConnection> => {
    const response = await apiClient.post<ClusterConnection>('/clusters', clusterData);
    return response.data;
  },

  updateCluster: async (id: string, clusterData: UpdateClusterConnectionRequest): Promise<ClusterConnection> => {
    const response = await apiClient.put<ClusterConnection>(`/clusters/${id}`, clusterData);
    return response.data;
  },

  deleteCluster: async (id: string): Promise<void> => {
    await apiClient.delete(`/clusters/${id}`);
  },

  testConnection: async (id: string, testData: ConnectionTestRequest): Promise<ConnectionTestResponse> => {
    const response = await apiClient.post<ConnectionTestResponse>(`/clusters/${id}/test`, testData);
    return response.data;
  }
};