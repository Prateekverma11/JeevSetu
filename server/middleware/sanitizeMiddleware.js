const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Middleware: MongoDB Injection Protection
 * Strips keys containing '$' or '.' from req.body, req.query, req.params
 * to prevent NoSQL injection attacks.
 */
const mongoSanitizeMiddleware = mongoSanitize({
    replaceWith: '_',
    allowDots: false,
    onSanitize: ({ req, key }) => {
        console.warn(`[SECURITY] Sanitized suspicious key "${key}" from ${req.method} ${req.originalUrl}`);
    }
});

/**
 * Sanitize a single string value against XSS payloads.
 */
const sanitizeString = (value) => {
    if (typeof value !== 'string') return value;
    return xss(value, {
        whiteList: {},          // No HTML tags allowed
        stripIgnoreTag: true,   // Strip unknown tags
        stripIgnoreTagBody: ['script', 'style']
    });
};

/**
 * Recursively sanitize an object's string values.
 */
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
        }
    }
    return obj;
};

/**
 * Middleware: XSS Protection
 * Sanitizes req.body and req.query string values to remove XSS payloads.
 */
const xssSanitizeMiddleware = (req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    next();
};

module.exports = { mongoSanitizeMiddleware, xssSanitizeMiddleware };
