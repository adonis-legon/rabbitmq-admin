import { clusterApi } from './api/clusterApi';
import { errorLoggingService } from './errorLoggingService';

export interface ClusterStatus {
  clusterId: string;
  isAvailable: boolean;
  lastChecked: number;
  error?: string;
  responseTime?: number;
}

export interface ConnectivityCheckResult {
  success: boolean;
  status?: ClusterStatus;
  error?: string;
}

class ClusterConnectivityService {
  private statusCache = new Map<string, ClusterStatus>();
  private checkInProgress = new Set<string>();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly CHECK_TIMEOUT = 10000; // 10 seconds

  /**
   * Check if a cluster is available and accessible
   */
  async checkClusterConnectivity(clusterId: string): Promise<ConnectivityCheckResult> {
    // Return cached result if still valid
    const cached = this.statusCache.get(clusterId);
    if (cached && (Date.now() - cached.lastChecked) < this.CACHE_TTL) {
      return { success: cached.isAvailable, status: cached };
    }

    // Prevent concurrent checks for the same cluster
    if (this.checkInProgress.has(clusterId)) {
      // Wait for ongoing check to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.checkInProgress.has(clusterId)) {
            clearInterval(checkInterval);
            const status = this.statusCache.get(clusterId);
            resolve({ success: status?.isAvailable || false, status });
          }
        }, 100);
      });
    }

    this.checkInProgress.add(clusterId);

    try {
      const startTime = Date.now();
      
      // Get cluster info first to get connection details
      const clusters = await clusterApi.getClusters();
      const cluster = clusters.find(c => c.id === clusterId);
      
      if (!cluster) {
        throw new Error(`Cluster ${clusterId} not found`);
      }

      // Test cluster connectivity with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connectivity check timeout')), this.CHECK_TIMEOUT);
      });

      const testData = {
        apiUrl: cluster.apiUrl,
        username: cluster.username,
        password: cluster.password
      };

      const checkPromise = clusterApi.testConnection(clusterId, testData);
      const result = await Promise.race([checkPromise, timeoutPromise]);

      const responseTime = Date.now() - startTime;
      
      const status: ClusterStatus = {
        clusterId,
        isAvailable: result.successful,
        lastChecked: Date.now(),
        responseTime,
        error: result.successful ? undefined : result.message
      };

      this.statusCache.set(clusterId, status);

      if (!result.successful) {
        errorLoggingService.logWarning({
          category: 'resource',
          message: `Cluster connectivity check failed for ${clusterId}`,
          details: {
            clusterId,
            error: result.message,
            responseTime
          }
        });
      }

      return { success: result.successful, status };
    } catch (error: any) {
      const status: ClusterStatus = {
        clusterId,
        isAvailable: false,
        lastChecked: Date.now(),
        error: error.message || 'Connectivity check failed'
      };

      this.statusCache.set(clusterId, status);

      errorLoggingService.logError({
        category: 'network',
        message: `Cluster connectivity check error for ${clusterId}`,
        details: {
          clusterId,
          error: error.message,
          code: error.code
        },
        stackTrace: error.stack
      });

      return { success: false, status, error: error.message };
    } finally {
      this.checkInProgress.delete(clusterId);
    }
  }

  /**
   * Get cached cluster status without performing a new check
   */
  getCachedStatus(clusterId: string): ClusterStatus | null {
    const cached = this.statusCache.get(clusterId);
    if (cached && (Date.now() - cached.lastChecked) < this.CACHE_TTL) {
      return cached;
    }
    return null;
  }

  /**
   * Clear cached status for a cluster
   */
  clearCache(clusterId?: string) {
    if (clusterId) {
      this.statusCache.delete(clusterId);
    } else {
      this.statusCache.clear();
    }
  }

  /**
   * Get all cached cluster statuses
   */
  getAllCachedStatuses(): ClusterStatus[] {
    const now = Date.now();
    return Array.from(this.statusCache.values()).filter(
      status => (now - status.lastChecked) < this.CACHE_TTL
    );
  }

  /**
   * Check multiple clusters concurrently
   */
  async checkMultipleClusters(clusterIds: string[]): Promise<Map<string, ConnectivityCheckResult>> {
    const results = new Map<string, ConnectivityCheckResult>();
    
    const checks = clusterIds.map(async (clusterId) => {
      try {
        const result = await this.checkClusterConnectivity(clusterId);
        results.set(clusterId, result);
      } catch (error: any) {
        results.set(clusterId, {
          success: false,
          error: error.message
        });
      }
    });

    await Promise.allSettled(checks);
    return results;
  }

  /**
   * Start periodic connectivity monitoring for active clusters
   */
  startMonitoring(clusterIds: string[], intervalMs: number = 60000): () => void {
    const interval = setInterval(async () => {
      try {
        await this.checkMultipleClusters(clusterIds);
      } catch (error) {
        errorLoggingService.logError({
          category: 'resource',
          message: 'Error during periodic cluster monitoring',
          details: { clusterIds, error }
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }

  /**
   * Detect if error is due to cluster unavailability
   */
  isClusterUnavailableError(error: any, clusterId?: string): boolean {
    const status = error?.response?.status;
    const isUnavailable = status === 502 || status === 503 || status === 504;
    
    if (isUnavailable && clusterId) {
      // Update cache to reflect unavailability
      this.statusCache.set(clusterId, {
        clusterId,
        isAvailable: false,
        lastChecked: Date.now(),
        error: `HTTP ${status}: Cluster unavailable`
      });
    }

    return isUnavailable;
  }

  /**
   * Get connectivity status summary
   */
  getConnectivitySummary(): {
    total: number;
    available: number;
    unavailable: number;
    unknown: number;
    averageResponseTime: number;
  } {
    const statuses = this.getAllCachedStatuses();
    const available = statuses.filter(s => s.isAvailable);
    const unavailable = statuses.filter(s => !s.isAvailable);
    
    const totalResponseTime = available.reduce((sum, s) => sum + (s.responseTime || 0), 0);
    const averageResponseTime = available.length > 0 ? totalResponseTime / available.length : 0;

    return {
      total: statuses.length,
      available: available.length,
      unavailable: unavailable.length,
      unknown: 0, // We don't track unknown status in this implementation
      averageResponseTime
    };
  }
}

export const clusterConnectivityService = new ClusterConnectivityService();

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).clusterConnectivityService = clusterConnectivityService;
}