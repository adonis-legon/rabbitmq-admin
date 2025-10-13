import { UserRole } from './auth';
import { ClusterConnection } from './cluster';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  locked?: boolean;
  failedLoginAttempts?: number;
  lockedAt?: string;
  assignedClusters: ClusterConnection[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
  clusterConnectionIds?: string[];
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: UserRole;
  clusterConnectionIds?: string[];
}