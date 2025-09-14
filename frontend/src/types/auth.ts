export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserInfo {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  USER = 'USER'
}

export interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<UserInfo>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}