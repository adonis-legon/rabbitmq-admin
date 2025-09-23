import { clusterApi } from './api/clusterApi';
import { errorLoggingService } from './errorLoggingService';
import { clusterConnectivityService } from './clusterConnectivityService';

export interface ClusterAccessResult {
  hasAccess: boolean;
  clusterId: string;
  error?: string;
  errorType?: 'not_found' | 'unauthorized' | 'unavailable' | 'network' | 'unknown';
}

export interface ClusterValidationContext {
  userId?: string;
  operation?: string;
  resourceType?: string;
}

class ClusterAccessValidator {
  private accessCache = new Map<string, { hasAccess: boolean; timestamp: number; error?: string }>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Validate user access to a specific cluster
   */
  async validateClusterAccess(
    clusterId: string,
    context?: ClusterValidationContext
  ): Promise<ClusterAccessResult> {
    // Check cache first
    const cached = this.accessCache.get(clusterId);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return {
        hasAccess: cached.hasAccess,
        clusterId,
        error: cached.error,
        errorType: cached.error ? 'unauthorized' : undefined
      };
    }

    try {
      // First check if cluster exists and user has access
      const clusters = await clusterApi.getClusters();
      const cluster = clusters.find(c => c.id === clusterId);

      if (!cluster) {
        const result: ClusterAccessResult = {
          hasAccess: false,
          clusterId,
          error: `Cluster '${clusterId}' not found or you don't have access to it`,
          errorType: 'not_found'
        };

        this.accessCache.set(clusterId, {
          hasAccess: false,
          timestamp: Date.now(),
          error: result.error
        });

        errorLoggingService.logWarning({
          category: 'auth',
          message: `Cluster access denied: ${clusterId}`,
          details: { clusterId, reason: 'not_found' },
          context
        });

        return result;
      }

      // Check cluster connectivity
      const connectivityResult = await clusterConnectivityService.checkClusterConnectivity(clusterId);
      
      if (!connectivityResult.success) {
        const result: ClusterAccessResult = {
          hasAccess: false,
          clusterId,
          error: `Cluster '${clusterId}' is currently unavailable: ${connectivityResult.error}`,
          errorType: 'unavailable'
        };

        // Don't cache unavailability as it might be temporary
        errorLoggingService.logWarning({
          category: 'resource',
          message: `Cluster unavailable: ${clusterId}`,
          details: { clusterId, error: connectivityResult.error },
          context
        });

        return result;
      }

      // Cache successful access
      this.accessCache.set(clusterId, {
        hasAccess: true,
        timestamp: Date.now()
      });

      return {
        hasAccess: true,
        clusterId
      };

    } catch (error: any) {
      let errorType: ClusterAccessResult['errorType'] = 'unknown';
      let errorMessage = 'Failed to validate cluster access';

      if (error.response?.status === 401) {
        errorType = 'unauthorized';
        errorMessage = 'Authentication required to access cluster';
      } else if (error.response?.status === 403) {
        errorType = 'unauthorized';
        errorMessage = `You don't have permission to access cluster '${clusterId}'`;
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        errorType = 'network';
        errorMessage = 'Network error while validating cluster access';
      }

      const result: ClusterAccessResult = {
        hasAccess: false,
        clusterId,
        error: errorMessage,
        errorType
      };

      // Cache authorization failures but not network errors
      if (errorType === 'unauthorized') {
        this.accessCache.set(clusterId, {
          hasAccess: false,
          timestamp: Date.now(),
          error: errorMessage
        });
      }

      errorLoggingService.logError({
        category: 'auth',
        message: `Cluster access validation failed: ${clusterId}`,
        details: {
          clusterId,
          errorType,
          error: error.message,
          status: error.response?.status
        },
        context,
        stackTrace: error.stack
      });

      return result;
    }
  }

  /**
   * Validate access to multiple clusters
   */
  async validateMultipleClusterAccess(
    clusterIds: string[],
    context?: ClusterValidationContext
  ): Promise<Map<string, ClusterAccessResult>> {
    const results = new Map<string, ClusterAccessResult>();

    const validations = clusterIds.map(async (clusterId) => {
      try {
        const result = await this.validateClusterAccess(clusterId, context);
        results.set(clusterId, result);
      } catch (error: any) {
        results.set(clusterId, {
          hasAccess: false,
          clusterId,
          error: error.message,
          errorType: 'unknown'
        });
      }
    });

    await Promise.allSettled(validations);
    return results;
  }

  /**
   * Check if user has access to any clusters
   */
  async hasAnyClusterAccess(): Promise<boolean> {
    try {
      const clusters = await clusterApi.getClusters();
      return clusters.length > 0;
    } catch (error) {
      errorLoggingService.logError({
        category: 'auth',
        message: 'Failed to check cluster access',
        details: { error }
      });
      return false;
    }
  }

  /**
   * Get list of accessible clusters
   */
  async getAccessibleClusters(): Promise<string[]> {
    try {
      const clusters = await clusterApi.getClusters();
      return clusters.map(c => c.id);
    } catch (error) {
      errorLoggingService.logError({
        category: 'auth',
        message: 'Failed to get accessible clusters',
        details: { error }
      });
      return [];
    }
  }

  /**
   * Clear access cache for a specific cluster or all clusters
   */
  clearCache(clusterId?: string): void {
    if (clusterId) {
      this.accessCache.delete(clusterId);
    } else {
      this.accessCache.clear();
    }
  }

  /**
   * Get cached access status without making API calls
   */
  getCachedAccess(clusterId: string): boolean | null {
    const cached = this.accessCache.get(clusterId);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.hasAccess;
    }
    return null;
  }

  /**
   * Handle cluster access error and provide user-friendly messages
   */
  handleClusterAccessError(
    error: ClusterAccessResult,
    context?: { operation?: string; resourceType?: string }
  ): {
    title: string;
    message: string;
    suggestions: string[];
    canRetry: boolean;
  } {
    let title = 'Cluster Access Error';
    let message = error.error || 'Unable to access cluster';
    let suggestions: string[] = [];
    let canRetry = false;

    switch (error.errorType) {
      case 'not_found':
        title = 'Cluster Not Found';
        message = `The cluster '${error.clusterId}' was not found or you don't have access to it.`;
        suggestions = [
          'Verify the cluster ID is correct',
          'Check with your administrator for access permissions',
          'Ensure you are logged in with the correct account'
        ];
        break;

      case 'unauthorized':
        title = 'Access Denied';
        message = `You don't have permission to access cluster '${error.clusterId}'.`;
        suggestions = [
          'Contact your administrator to request access',
          'Verify you are logged in with the correct account',
          'Check if your permissions have been updated'
        ];
        break;

      case 'unavailable':
        title = 'Cluster Unavailable';
        message = `Cluster '${error.clusterId}' is currently unavailable.`;
        suggestions = [
          'The cluster may be temporarily down for maintenance',
          'Check the cluster status with your administrator',
          'Try again in a few minutes'
        ];
        canRetry = true;
        break;

      case 'network':
        title = 'Connection Error';
        message = 'Unable to connect to the server to validate cluster access.';
        suggestions = [
          'Check your internet connection',
          'Verify the server is accessible',
          'Try refreshing the page'
        ];
        canRetry = true;
        break;

      default:
        title = 'Cluster Access Error';
        suggestions = [
          'Try refreshing the page',
          'Check your internet connection',
          'Contact support if the problem persists'
        ];
        canRetry = true;
    }

    // Add context-specific suggestions
    if (context?.operation && context?.resourceType) {
      suggestions.unshift(`Unable to ${context.operation} ${context.resourceType} data`);
    }

    return { title, message, suggestions, canRetry };
  }

  /**
   * Create a cluster selection validator for resource pages
   */
  createResourceValidator(resourceType: string) {
    return async (clusterId: string, operation: string = 'access') => {
      const result = await this.validateClusterAccess(clusterId, {
        operation,
        resourceType
      });

      if (!result.hasAccess) {
        const errorInfo = this.handleClusterAccessError(result, {
          operation,
          resourceType
        });
        
        throw new Error(`${errorInfo.title}: ${errorInfo.message}`);
      }

      return result;
    };
  }

  /**
   * Get access validation summary
   */
  getValidationSummary(): {
    totalCached: number;
    accessGranted: number;
    accessDenied: number;
    cacheHitRate: number;
  } {
    const entries = Array.from(this.accessCache.values());
    const granted = entries.filter(e => e.hasAccess).length;
    const denied = entries.filter(e => !e.hasAccess).length;

    return {
      totalCached: entries.length,
      accessGranted: granted,
      accessDenied: denied,
      cacheHitRate: entries.length > 0 ? (granted + denied) / entries.length : 0
    };
  }
}

export const clusterAccessValidator = new ClusterAccessValidator();

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).clusterAccessValidator = clusterAccessValidator;
}