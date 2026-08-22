const { cacheGet, cacheSet } = require('../config/redis');

/**
 * Middleware: HTTP Response Caching via Redis.
 *
 * @param {number} ttlSeconds - Cache time-to-live in seconds (default: 60)
 * @param {function} keyFn - Optional function(req) => string to generate cache key.
 *                           Defaults to using method + originalUrl.
 *
 * Usage:
 *   router.get('/api/reports', authenticate, cacheMiddleware(30), getReports);
 */
const cacheMiddleware = (ttlSeconds = 60, keyFn = null) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') return next();

        const cacheKey = keyFn
            ? keyFn(req)
            : `cache:${req.method}:${req.originalUrl}`;

        // Try to get from cache
        const cached = await cacheGet(cacheKey);
        if (cached) {
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Cache-Key', cacheKey);
            return res.json(cached);
        }

        // Override res.json to intercept and cache the response
        const originalJson = res.json.bind(res);
        res.json = async (data) => {
            res.setHeader('X-Cache', 'MISS');
            res.setHeader('X-Cache-Key', cacheKey);
            // Cache only successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                await cacheSet(cacheKey, data, ttlSeconds);
            }
            return originalJson(data);
        };

        next();
    };
};

module.exports = { cacheMiddleware };
