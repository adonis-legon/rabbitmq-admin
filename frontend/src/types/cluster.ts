export interface ClusterConnection {
  id: string;
  name: string;
  apiUrl: string;
  username: string;
  password: string;
  description?: string;
  active: boolean;
  assignedUsers: User[];
}

export interface CreateClusterConnectionRequest {
  name: string;
  apiUrl: string;
  username: string;
  password: string;
  description?: string;
  active: boolean;
}

export interface UpdateClusterConnectionRequest {
  name?: string;
  apiUrl?: string;
  username?: string;
  password?: string;
  description?: string;
  active?: boolean;
}

export interface ConnectionTestRequest {
  apiUrl: string;
  username: string;
  password: string;
}

export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  details?: any;
}

interface User {
  id: string;
  username: string;
}