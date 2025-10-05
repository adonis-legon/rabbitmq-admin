import { tokenService } from './auth/tokenService';
import { authService } from './auth/authService';
import { errorLoggingService } from './errorLoggingService';

export interface TokenExpirationConfig {
  warningThresholdMinutes: number; // Show warning when token expires in X minutes
  refreshThresholdMinutes: number; // Auto-refresh when token expires in X minutes
  checkIntervalMs: number; // How often to check token expiration
}

export type NavigateToLogin = (returnUrl?: string) => void;

export const DEFAULT_TOKEN_CONFIG: TokenExpirationConfig = {
  warningThresholdMinutes: 5,
  refreshThresholdMinutes: 2,
  checkIntervalMs: 60000 // Check every minute
};

export interface TokenStatus {
  isValid: boolean;
  expiresAt?: number;
  minutesUntilExpiry?: number;
  needsRefresh: boolean;
  needsWarning: boolean;
}

class TokenExpirationHandler {
  private config: TokenExpirationConfig;
  private checkInterval?: NodeJS.Timeout;
  private warningShown = false;
  private refreshInProgress = false;
  private listeners: Array<(status: TokenStatus) => void> = [];
  private navigateToLogin?: NavigateToLogin;

  constructor(config: TokenExpirationConfig = DEFAULT_TOKEN_CONFIG) {
    this.config = config;
  }

  /**
   * Start monitoring token expiration
   */
  startMonitoring(): void {
    if (this.checkInterval) {
      this.stopMonitoring();
    }

    this.checkInterval = setInterval(() => {
      this.checkTokenStatus();
    }, this.config.checkIntervalMs);

    // Initial check
    this.checkTokenStatus();

    errorLoggingService.logInfo({
      category: 'auth',
      message: 'Token expiration monitoring started',
      details: { config: this.config }
    });
  }

  /**
   * Stop monitoring token expiration
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    errorLoggingService.logInfo({
      category: 'auth',
      message: 'Token expiration monitoring stopped'
    });
  }

  /**
   * Check current token status
   */
  getTokenStatus(): TokenStatus {
    const token = tokenService.getAccessToken();

    if (!token) {
      return {
        isValid: false,
        needsRefresh: false,
        needsWarning: false
      };
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const minutesUntilExpiry = Math.floor((expiresAt - now) / (1000 * 60));

      const isValid = expiresAt > now;
      const needsRefresh = minutesUntilExpiry <= this.config.refreshThresholdMinutes;
      const needsWarning = minutesUntilExpiry <= this.config.warningThresholdMinutes && minutesUntilExpiry > 0;

      return {
        isValid,
        expiresAt,
        minutesUntilExpiry,
        needsRefresh,
        needsWarning
      };
    } catch (error) {
      errorLoggingService.logError({
        category: 'auth',
        message: 'Failed to parse token',
        details: { error }
      });

      return {
        isValid: false,
        needsRefresh: false,
        needsWarning: false
      };
    }
  }

  /**
   * Check token status and take appropriate actions
   */
  private async checkTokenStatus(): Promise<void> {
    const status = this.getTokenStatus();

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in token status listener:', error);
      }
    });

    // Handle expired token
    if (!status.isValid) {
      this.handleExpiredToken();
      return;
    }

    // Handle token that needs refresh
    if (status.needsRefresh && !this.refreshInProgress) {
      await this.handleTokenRefresh();
      return;
    }

    // Handle warning threshold
    if (status.needsWarning && !this.warningShown) {
      this.handleExpirationWarning(status.minutesUntilExpiry || 0);
    }

    // Reset warning flag if we're past the warning threshold
    if (!status.needsWarning) {
      this.warningShown = false;
    }
  }

  /**
   * Set navigation function for React Router
   */
  setNavigateToLogin(navigateToLogin?: NavigateToLogin): void {
    this.navigateToLogin = navigateToLogin;
  }

  /**
   * Handle expired token
   */
  private handleExpiredToken(): void {
    errorLoggingService.logWarning({
      category: 'auth',
      message: 'Access token has expired',
      context: {
        url: window.location.href
      }
    });

    // Clear tokens
    tokenService.clearTokens();

    // Use React Router navigation if available, otherwise fallback to window.location
    if (this.navigateToLogin) {
      const returnUrl = window.location.pathname + window.location.search;
      this.navigateToLogin(returnUrl);
    } else {
      // Fallback for cases where React Router navigation is not available
      const returnUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
  }

  /**
   * Handle token refresh
   */
  private async handleTokenRefresh(): Promise<void> {
    if (this.refreshInProgress) {
      return;
    }

    this.refreshInProgress = true;

    try {
      errorLoggingService.logInfo({
        category: 'auth',
        message: 'Attempting automatic token refresh'
      });

      const success = await authService.refreshToken();

      if (success) {
        errorLoggingService.logInfo({
          category: 'auth',
          message: 'Token refreshed successfully'
        });

        // Reset warning flag after successful refresh
        this.warningShown = false;
      } else {
        errorLoggingService.logWarning({
          category: 'auth',
          message: 'Token refresh failed - user will need to re-authenticate'
        });

        // Refresh failed, handle as expired token
        this.handleExpiredToken();
      }
    } catch (error) {
      errorLoggingService.logError({
        category: 'auth',
        message: 'Error during token refresh',
        details: { error }
      });

      // Refresh failed, handle as expired token
      this.handleExpiredToken();
    } finally {
      this.refreshInProgress = false;
    }
  }

  /**
   * Handle expiration warning
   */
  private handleExpirationWarning(minutesUntilExpiry: number): void {
    this.warningShown = true;

    errorLoggingService.logWarning({
      category: 'auth',
      message: `Token expires in ${minutesUntilExpiry} minutes`,
      details: { minutesUntilExpiry }
    });

    // You could show a toast notification here
    // Session warning handled by event listeners
  }

  /**
   * Add listener for token status changes
   */
  addListener(listener: (status: TokenStatus) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Force token refresh
   */
  async forceRefresh(): Promise<boolean> {
    return this.handleTokenRefresh().then(() => true).catch(() => false);
  }

  /**
   * Check if current request error is due to token expiration
   */
  isTokenExpiredError(error: any): boolean {
    const status = error?.response?.status;
    if (status !== 401) {
      return false;
    }

    // Check if token is actually expired
    const tokenStatus = this.getTokenStatus();
    return !tokenStatus.isValid;
  }

  /**
   * Handle authentication error during resource operations
   */
  async handleAuthError(error: any, context?: { operation?: string; clusterId?: string }): Promise<boolean> {
    if (!this.isTokenExpiredError(error)) {
      return false;
    }

    errorLoggingService.logAuthError(
      context?.operation || 'resource_operation',
      error,
      context
    );

    // Try to refresh token
    if (!this.refreshInProgress) {
      const refreshSuccess = await this.forceRefresh();
      if (refreshSuccess) {
        return true; // Indicate that the operation can be retried
      }
    }

    // Refresh failed or already in progress, handle as expired
    this.handleExpiredToken();
    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TokenExpirationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart monitoring with new config
    if (this.checkInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TokenExpirationConfig {
    return { ...this.config };
  }
}

export const tokenExpirationHandler = new TokenExpirationHandler();

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).tokenExpirationHandler = tokenExpirationHandler;
}