import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '../../types/error';

// Extend AxiosRequestConfig to include _retry property
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// API base URL - will be configured based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor to handle token expiration and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // Handle 401 Unauthorized - token expiration
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh token
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              const newToken = response.data.accessToken;
              this.setToken(newToken);

              // Retry original request with new token
              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed, redirect to login
              this.clearTokens();
              this.redirectToLogin();
              return Promise.reject(this.handleError(refreshError as AxiosError));
            }
          } else {
            // No refresh token, redirect to login
            this.clearTokens();
            this.redirectToLogin();
          }
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

  private redirectToLogin(): void {
    // Only redirect if we're not already on the login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse> {
    return this.client.post('/auth/refresh', { refreshToken });
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
export default apiClient;