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
  assignedUserIds?: string[];
}

export interface UpdateClusterConnectionRequest {
  name?: string;
  apiUrl?: string;
  username?: string;
  password?: string;
  description?: string;
  active?: boolean;
  assignedUserIds?: string[];
}

export interface ConnectionTestRequest {
  apiUrl: string;
  username: string;
  password: string;
}

export interface ConnectionTestResponse {
  successful: boolean;
  message: string;
  errorDetails?: string;
  responseTimeMs?: number;
}

interface User {
  id: string;
  username: string;
}