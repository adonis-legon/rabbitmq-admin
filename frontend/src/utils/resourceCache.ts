interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
    ttl?: number; // Default TTL in milliseconds
    maxSize?: number; // Maximum number of entries
}

export class ResourceCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private defaultTTL: number;
    private maxSize: number;

    constructor(options: CacheOptions = {}) {
        this.defaultTTL = options.ttl || 5 * 60 * 1000; // Default 5 minutes
        this.maxSize = options.maxSize || 100; // Default max 100 entries
    }

    /**
     * Generate a cache key from parameters
     */
    private generateKey(clusterId: string, resourceType: string, params: Record<string, any> = {}): string {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {} as Record<string, any>);

        return `${clusterId}:${resourceType}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * Check if a cache entry is still valid
     */
    private isValid(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp >= entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Ensure cache doesn't exceed max size by removing oldest entries
     */
    private enforceMaxSize(): void {
        if (this.cache.size <= this.maxSize) return;

        // Convert to array and sort by timestamp (oldest first)
        const entries = Array.from(this.cache.entries()).sort(
            ([, a], [, b]) => a.timestamp - b.timestamp
        );

        // Remove oldest entries until we're under the limit
        const toRemove = this.cache.size - this.maxSize;
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
    }

    /**
     * Get cached data if available and valid
     */
    get(clusterId: string, resourceType: string, params: Record<string, any> = {}): T | null {
        const key = this.generateKey(clusterId, resourceType, params);
        const entry = this.cache.get(key);

        if (!entry) return null;

        if (this.isValid(entry)) {
            return entry.data;
        }

        // Entry is expired, remove it
        this.cache.delete(key);
        return null;
    }

    /**
     * Set cached data with optional custom TTL
     */
    set(
        clusterId: string,
        resourceType: string,
        data: T,
        params: Record<string, any> = {},
        customTTL?: number
    ): void {
        const key = this.generateKey(clusterId, resourceType, params);
        const ttl = customTTL || this.defaultTTL;

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });

        // Cleanup and enforce size limits
        this.cleanup();
        this.enforceMaxSize();
    }

    /**
     * Invalidate cache entries for a specific cluster and resource type
     */
    invalidate(clusterId: string, resourceType?: string): void {
        const prefix = resourceType ? `${clusterId}:${resourceType}:` : `${clusterId}:`;

        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        validEntries: number;
        expiredEntries: number;
    } {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const entry of this.cache.values()) {
            if (now - entry.timestamp < entry.ttl) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        }

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: 0, // Would need to track hits/misses to calculate this
            validEntries,
            expiredEntries,
        };
    }
}

// Create singleton instances for different resource types
export const connectionsCache = new ResourceCache({
    ttl: 30 * 1000, // 30 seconds for connections (more dynamic)
    maxSize: 50,
});

export const channelsCache = new ResourceCache({
    ttl: 30 * 1000, // 30 seconds for channels (more dynamic)
    maxSize: 50,
});

export const exchangesCache = new ResourceCache({
    ttl: 5 * 60 * 1000, // 5 minutes for exchanges (less dynamic)
    maxSize: 50,
});

export const queuesCache = new ResourceCache({
    ttl: 60 * 1000, // 1 minute for queues (moderately dynamic)
    maxSize: 50,
});

export const bindingsCache = new ResourceCache({
    ttl: 10 * 60 * 1000, // 10 minutes for bindings (least dynamic)
    maxSize: 100,
});