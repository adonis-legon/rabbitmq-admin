import { authApi } from '../api/authApi';
import { tokenService } from './tokenService';
import { LoginRequest, LoginResponse, UserInfo } from '../../types/auth';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authApi.login(credentials);
    
    // Store tokens
    tokenService.setAccessToken(response.accessToken);
    tokenService.setRefreshToken(response.refreshToken);
    
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.error('Logout error:', error);
    } finally {
      tokenService.clearTokens();
    }
  },

  getCurrentUser: async (): Promise<UserInfo | null> => {
    if (!tokenService.hasValidToken()) {
      return null;
    }

    try {
      return await authApi.getCurrentUser();
    } catch (error) {
      // If getting user fails, clear tokens
      tokenService.clearTokens();
      return null;
    }
  },

  refreshToken: async (): Promise<boolean> => {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await authApi.refreshToken({ refreshToken });
      tokenService.setAccessToken(response.accessToken);
      tokenService.setRefreshToken(response.refreshToken);
      return true;
    } catch (error) {
      tokenService.clearTokens();
      return false;
    }
  },

  isAuthenticated: (): boolean => {
    return tokenService.hasValidToken();
  }
};