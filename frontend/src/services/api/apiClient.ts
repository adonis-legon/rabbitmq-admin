import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '../../types/error';
import { tokenService } from '../auth/tokenService';
import { tokenExpirationHandler } from '../tokenExpirationHandler';

// API base URL - will be configured based on environment
// Updated for Docker rebuild test - timestamp: 2025-10-04 01:30
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        const url = config.url || '';

        // Define endpoints that don't require authentication
        const publicEndpoints = [
          '/auth/login',
          '/auth/register',
          '/auth/refresh',
          '/health',
          '/actuator'
        ];

        // Define auth endpoints that need tokens but should be allowed to proceed
        // even if we can't immediately validate the token
        const authEndpoints = ['/auth/me', '/auth/logout'];

        // Check if this is a public endpoint
        const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));
        const isAuthEndpoint = authEndpoints.some(endpoint => url.includes(endpoint));

        if (isPublicEndpoint) {
          return config;
        }

        if (isAuthEndpoint) {
          // For auth endpoints, attach token if available but don't block if missing
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.error('🚫 [API CLIENT] No token available for protected endpoint:', url);
          return Promise.reject(new Error('No authentication token available'));
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(this.handleError(error));
      }
    );    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        // Handle 401 Unauthorized - use token expiration handler
        if (error.response?.status === 401) {
          const canRetry = await tokenExpirationHandler.handleAuthError(error, {
            operation: 'api_request',
          });

          // If token was refreshed successfully, retry the original request
          if (canRetry && error.config) {
            // Update the authorization header with the new token
            const newToken = this.getToken();
            if (newToken) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return this.client.request(error.config);
            }
          }

          // If we reach here, either refresh failed or token is truly expired
          // The tokenExpirationHandler will handle the redirect to login
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    // Network error (no response)
    if (!error.response) {
      return {
        timestamp: new Date().toISOString(),
        status: 0,
        error: 'Network Error',
        message: error.code === 'ECONNABORTED'
          ? 'Request timeout. Please check your connection and try again.'
          : 'Unable to connect to the server. Please check your internet connection.',
        path: error.config?.url || 'unknown'
      };
    }

    // Server responded with error status
    const response = error.response;
    const data = response.data as any;

    // If the server returns a structured error response, use it
    if (data && typeof data === 'object' && data.message) {
      return {
        timestamp: data.timestamp || new Date().toISOString(),
        status: response.status,
        error: data.error || response.statusText,
        message: data.message,
        path: data.path || error.config?.url || 'unknown',
        details: data.details
      };
    }

    // Fallback for non-structured error responses
    return {
      timestamp: new Date().toISOString(),
      status: response.status,
      error: response.statusText,
      message: this.getDefaultErrorMessage(response.status),
      path: error.config?.url || 'unknown'
    };
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad request. Please check your input and try again.';
      case 401:
        return 'You are not authorized to perform this action.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource may already exist.';
      case 422:
        return 'The request could not be processed due to validation errors.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'An internal server error occurred. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. The request took too long to process.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private getToken(): string | null {
    return tokenService.getAccessToken();
  }

  // HTTP methods
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }
}

// Export singleton instance
const apiClient = new ApiClient();
export default apiClient;// Force rebuild Sat Oct  4 01:20:00 -03 2025
