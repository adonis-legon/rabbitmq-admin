import { useState, useEffect } from 'react';
import {
    connectionsCache,
    channelsCache,
    exchangesCache,
    queuesCache,
    bindingsCache
} from '../utils/resourceCache';

interface CacheStats {
    size: number;
    maxSize: number;
    hitRate: number;
    validEntries: number;
    expiredEntries: number;
}

interface AllCacheStats {
    connections: CacheStats;
    channels: CacheStats;
    exchanges: CacheStats;
    queues: CacheStats;
    bindings: CacheStats;
    total: {
        size: number;
        maxSize: number;
        validEntries: number;
        expiredEntries: number;
    };
}

export const useCacheStats = (refreshInterval: number = 5000) => {
    const [stats, setStats] = useState<AllCacheStats | null>(null);

    useEffect(() => {
        const updateStats = () => {
            const connectionsStats = connectionsCache.getStats();
            const channelsStats = channelsCache.getStats();
            const exchangesStats = exchangesCache.getStats();
            const queuesStats = queuesCache.getStats();
            const bindingsStats = bindingsCache.getStats();

            const allStats: AllCacheStats = {
                connections: connectionsStats,
                channels: channelsStats,
                exchanges: exchangesStats,
                queues: queuesStats,
                bindings: bindingsStats,
                total: {
                    size: connectionsStats.size + channelsStats.size + exchangesStats.size + queuesStats.size + bindingsStats.size,
                    maxSize: connectionsStats.maxSize + channelsStats.maxSize + exchangesStats.maxSize + queuesStats.maxSize + bindingsStats.maxSize,
                    validEntries: connectionsStats.validEntries + channelsStats.validEntries + exchangesStats.validEntries + queuesStats.validEntries + bindingsStats.validEntries,
                    expiredEntries: connectionsStats.expiredEntries + channelsStats.expiredEntries + exchangesStats.expiredEntries + queuesStats.expiredEntries + bindingsStats.expiredEntries,
                },
            };

            setStats(allStats);
        };

        // Update immediately
        updateStats();

        // Set up interval
        const interval = setInterval(updateStats, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    const clearAllCaches = () => {
        connectionsCache.clear();
        channelsCache.clear();
        exchangesCache.clear();
        queuesCache.clear();
        bindingsCache.clear();
    };

    const invalidateClusterCaches = (clusterId: string) => {
        connectionsCache.invalidate(clusterId);
        channelsCache.invalidate(clusterId);
        exchangesCache.invalidate(clusterId);
        queuesCache.invalidate(clusterId);
        bindingsCache.invalidate(clusterId);
    };

    return {
        stats,
        clearAllCaches,
        invalidateClusterCaches,
    };
};