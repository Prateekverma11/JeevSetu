const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Middleware: MongoDB Injection Protection
 * Strips keys containing '$' or '.' from req.body, req.query, req.params
 * to prevent NoSQL injection attacks.
 * Compatible with Express 5 (req.query is read-only).
 */
const mongoSanitizeMiddleware = (req, res, next) => {
    const options = {
        replaceWith: '_',
        allowDots: false
    };

    ['body', 'params', 'headers', 'query'].forEach((key) => {
        if (req[key]) {
            if (mongoSanitize.has(req[key], false)) {
                console.warn(`[SECURITY] Sanitized suspicious key from ${req.method} ${req.originalUrl}`);
            }
            if (key === 'query') {
                // Mutates req.query in place without reassigning
                mongoSanitize.sanitize(req[key], options);
            } else {
                req[key] = mongoSanitize.sanitize(req[key], options);
            }
        }
    });
    next();
};


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
