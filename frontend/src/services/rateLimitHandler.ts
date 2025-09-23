import { errorLoggingService } from './errorLoggingService';

export interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfter?: number; // seconds
  limit?: number;
  remaining?: number;
  resetTime?: number;
}

export interface BackoffConfig {
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffFactor: number;
  maxAttempts: number;
  jitterFactor: number; // 0-1, adds randomness to prevent thundering herd
}

export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  maxAttempts: 5,
  jitterFactor: 0.1
};

class RateLimitHandler {
  private rateLimitInfo = new Map<string, RateLimitInfo & { timestamp: number }>();
  private backoffDelays = new Map<string, number>();
  private readonly RATE_LIMIT_CACHE_TTL = 60000; // 1 minute

  /**
   * Extract rate limit information from HTTP response
   */
  extractRateLimitInfo(response: any): RateLimitInfo {
    const headers = response?.headers || {};
    
    // Check for standard rate limit headers
    const rateLimitRemaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'];
    const rateLimitLimit = headers['x-ratelimit-limit'] || headers['x-rate-limit-limit'];
    const rateLimitReset = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'];
    const retryAfter = headers['retry-after'];

    const isRateLimited = response?.status === 429;

    return {
      isRateLimited,
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
      limit: rateLimitLimit ? parseInt(rateLimitLimit, 10) : undefined,
      remaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
      resetTime: rateLimitReset ? parseInt(rateLimitReset, 10) * 1000 : undefined // Convert to milliseconds
    };
  }

  /**
   * Check if an error indicates rate limiting
   */
  isRateLimitError(error: any): boolean {
    return error?.response?.status === 429;
  }

  /**
   * Handle rate limit error and store information
   */
  handleRateLimitError(error: any, endpoint: string): RateLimitInfo {
    const rateLimitInfo = this.extractRateLimitInfo(error.response);
    
    // Store rate limit info with timestamp
    this.rateLimitInfo.set(endpoint, {
      ...rateLimitInfo,
      timestamp: Date.now()
    });

    errorLoggingService.logWarning({
      category: 'network',
      message: `Rate limit exceeded for endpoint: ${endpoint}`,
      details: {
        endpoint,
        rateLimitInfo,
        error: error.message
      }
    });

    return rateLimitInfo;
  }

  /**
   * Get cached rate limit info for an endpoint
   */
  getRateLimitInfo(endpoint: string): RateLimitInfo | null {
    const cached = this.rateLimitInfo.get(endpoint);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.RATE_LIMIT_CACHE_TTL) {
      this.rateLimitInfo.delete(endpoint);
      return null;
    }

    return {
      isRateLimited: cached.isRateLimited,
      retryAfter: cached.retryAfter,
      limit: cached.limit,
      remaining: cached.remaining,
      resetTime: cached.resetTime
    };
  }

  /**
   * Check if endpoint is currently rate limited
   */
  isEndpointRateLimited(endpoint: string): boolean {
    const info = this.getRateLimitInfo(endpoint);
    if (!info) return false;

    // Check if we're still within the rate limit window
    if (info.resetTime && Date.now() < info.resetTime) {
      return info.isRateLimited;
    }

    // Rate limit window has passed
    this.rateLimitInfo.delete(endpoint);
    return false;
  }

  /**
   * Calculate backoff delay with exponential backoff and jitter
   */
  calculateBackoffDelay(
    attempt: number,
    config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
    rateLimitInfo?: RateLimitInfo
  ): number {
    // If we have retry-after header, use it
    if (rateLimitInfo?.retryAfter) {
      return rateLimitInfo.retryAfter * 1000; // Convert to milliseconds
    }

    // Calculate exponential backoff
    let delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
    delay = Math.min(delay, config.maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = delay * config.jitterFactor * Math.random();
    delay += jitter;

    return Math.floor(delay);
  }

  /**
   * Execute operation with rate limit handling and backoff
   */
  async executeWithBackoff<T>(
    operation: () => Promise<T>,
    endpoint: string,
    config: BackoffConfig = DEFAULT_BACKOFF_CONFIG
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Check if endpoint is currently rate limited
        if (this.isEndpointRateLimited(endpoint)) {
          const rateLimitInfo = this.getRateLimitInfo(endpoint);
          const delay = this.calculateBackoffDelay(attempt, config, rateLimitInfo || undefined);
          
          errorLoggingService.logInfo({
            category: 'network',
            message: `Delaying request due to rate limit: ${endpoint}`,
            details: { endpoint, attempt, delay, rateLimitInfo }
          });

          await this.delay(delay);
        }

        const result = await operation();
        
        // Clear any stored backoff delay on success
        this.backoffDelays.delete(endpoint);
        
        return result;
      } catch (error: any) {
        lastError = error;

        // Handle rate limit error
        if (this.isRateLimitError(error)) {
          const rateLimitInfo = this.handleRateLimitError(error, endpoint);
          
          // Don't retry if we've reached max attempts
          if (attempt === config.maxAttempts) {
            break;
          }

          const delay = this.calculateBackoffDelay(attempt, config, rateLimitInfo);
          this.backoffDelays.set(endpoint, delay);

          errorLoggingService.logWarning({
            category: 'network',
            message: `Rate limited, retrying in ${delay}ms (attempt ${attempt}/${config.maxAttempts})`,
            details: { endpoint, attempt, delay, rateLimitInfo }
          });

          await this.delay(delay);
          continue;
        }

        // For non-rate-limit errors, don't retry
        break;
      }
    }

    throw lastError;
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recommended delay before next request to endpoint
   */
  getRecommendedDelay(endpoint: string): number {
    const rateLimitInfo = this.getRateLimitInfo(endpoint);
    
    if (!rateLimitInfo) return 0;

    if (rateLimitInfo.retryAfter) {
      return rateLimitInfo.retryAfter * 1000;
    }

    if (rateLimitInfo.resetTime) {
      const timeUntilReset = rateLimitInfo.resetTime - Date.now();
      return Math.max(0, timeUntilReset);
    }

    return this.backoffDelays.get(endpoint) || 0;
  }

  /**
   * Check if request should be delayed
   */
  shouldDelayRequest(endpoint: string): { shouldDelay: boolean; delayMs: number } {
    const delayMs = this.getRecommendedDelay(endpoint);
    return {
      shouldDelay: delayMs > 0,
      delayMs
    };
  }

  /**
   * Clear rate limit info for endpoint
   */
  clearRateLimitInfo(endpoint?: string): void {
    if (endpoint) {
      this.rateLimitInfo.delete(endpoint);
      this.backoffDelays.delete(endpoint);
    } else {
      this.rateLimitInfo.clear();
      this.backoffDelays.clear();
    }
  }

  /**
   * Get rate limit status summary
   */
  getRateLimitSummary(): {
    rateLimitedEndpoints: number;
    totalEndpoints: number;
    averageDelay: number;
    longestDelay: number;
  } {
    const now = Date.now();
    const activeRateLimits = Array.from(this.rateLimitInfo.entries())
      .filter(([_, info]) => now - info.timestamp < this.RATE_LIMIT_CACHE_TTL);

    const delays = Array.from(this.backoffDelays.values());
    const averageDelay = delays.length > 0 ? delays.reduce((sum, delay) => sum + delay, 0) / delays.length : 0;
    const longestDelay = delays.length > 0 ? Math.max(...delays) : 0;

    return {
      rateLimitedEndpoints: activeRateLimits.length,
      totalEndpoints: this.rateLimitInfo.size,
      averageDelay,
      longestDelay
    };
  }

  /**
   * Create a rate-limit aware request wrapper for a specific endpoint
   */
  createRateLimitedRequest<T>(
    endpoint: string,
    config?: Partial<BackoffConfig>
  ) {
    const mergedConfig = { ...DEFAULT_BACKOFF_CONFIG, ...config };
    
    return async (operation: () => Promise<T>): Promise<T> => {
      return this.executeWithBackoff(operation, endpoint, mergedConfig);
    };
  }

  /**
   * Monitor rate limit headers in successful responses
   */
  updateRateLimitFromResponse(response: any, endpoint: string): void {
    const rateLimitInfo = this.extractRateLimitInfo(response);
    
    // Only store if we have useful rate limit information
    if (rateLimitInfo.limit !== undefined || rateLimitInfo.remaining !== undefined) {
      this.rateLimitInfo.set(endpoint, {
        ...rateLimitInfo,
        timestamp: Date.now()
      });

      // Log warning if we're approaching rate limit
      if (rateLimitInfo.remaining !== undefined && rateLimitInfo.limit !== undefined) {
        const usagePercent = ((rateLimitInfo.limit - rateLimitInfo.remaining) / rateLimitInfo.limit) * 100;
        
        if (usagePercent > 80) {
          errorLoggingService.logWarning({
            category: 'network',
            message: `Approaching rate limit for ${endpoint}`,
            details: {
              endpoint,
              remaining: rateLimitInfo.remaining,
              limit: rateLimitInfo.limit,
              usagePercent: Math.round(usagePercent)
            }
          });
        }
      }
    }
  }
}

export const rateLimitHandler = new RateLimitHandler();

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).rateLimitHandler = rateLimitHandler;
}