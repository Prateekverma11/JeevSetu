const Redis = require('ioredis');

let redisClient = null;

/**
 * Create and return a Redis client instance.
 * Falls back gracefully if Redis is not available (e.g., in development without Redis).
 */
const getRedisClient = () => {
    if (redisClient) return redisClient;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        retryStrategy: (times) => {
            if (times > 3) {
                console.warn('[Redis] Max retries reached, disabling Redis cache');
                return null; // Stop retrying
            }
            return Math.min(times * 500, 2000);
        },
        maxRetriesPerRequest: 1,
    });

    redisClient.on('connect', () => {
        console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
        console.warn('[Redis] Connection error (caching disabled):', err.message);
    });

    redisClient.connect().catch(() => {
        console.warn('[Redis] Failed to connect — running without cache');
    });

    return redisClient;
};

/**
 * Helper: Get a value from Redis.
 * Returns null if Redis is unavailable or key doesn't exist.
 */
const cacheGet = async (key) => {
    try {
        const client = getRedisClient();
        if (client.status !== 'ready') return null;
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

/**
 * Helper: Set a value in Redis with optional TTL (seconds).
 */
const cacheSet = async (key, value, ttlSeconds = 60) => {
    try {
        const client = getRedisClient();
        if (client.status !== 'ready') return;
        await client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
        // Silently fail — cache is not critical
    }
};

/**
 * Helper: Delete one or more keys from Redis.
 */
const cacheDel = async (...keys) => {
    try {
        const client = getRedisClient();
        if (client.status !== 'ready') return;
        await client.del(...keys);
    } catch {
        // Silently fail
    }
};

/**
 * Helper: Delete all keys matching a pattern (e.g., "reports:*")
 */
const cacheDelPattern = async (pattern) => {
    try {
        const client = getRedisClient();
        if (client.status !== 'ready') return;
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    } catch {
        // Silently fail
    }
};

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDel, cacheDelPattern };
