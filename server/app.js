const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');
const { mongoSanitizeMiddleware, xssSanitizeMiddleware } = require('./middleware/sanitizeMiddleware');

const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────────

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Security Middleware ────────────────────────────────────────────────────────
// CONCEPT: Input Sanitization & Injection Awareness
// 1. MongoDB Injection — strips '$' and '.' from request body/query keys
// 2. XSS Sanitization — removes script tags and dangerous payloads from strings
app.use(mongoSanitizeMiddleware);
app.use(xssSanitizeMiddleware);

// ── Static Files ───────────────────────────────────────────────────────────────

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve built client in production or when available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// ── SSR Routes ─────────────────────────────────────────────────────────────────
// CONCEPT: Server-Side Rendering
// These routes render full HTML pages on the server with live DB data injected.
// Accessible at /ssr and /ssr/reports — SEO-friendly, no JS needed for first paint.
app.use('/ssr', require('./routes/ssrRoutes'));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/rescuers', require('./routes/rescuerRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// ── Root Route ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    // If client is built, serve its index.html, otherwise show API message
    const indexFile = path.join(clientDistPath, 'index.html');
    if (require('fs').existsSync(indexFile)) {
        res.sendFile(indexFile);
    } else {
        res.send('Animal Rescuer API is running...');
    }
});

// ── SPA Fallback ───────────────────────────────────────────────────────────────
// Serve client index.html for any unknown route (for SPA client-side routing)
app.use((req, res, next) => {
    // Don't intercept /ssr or /api routes
    if (req.path.startsWith('/ssr') || req.path.startsWith('/api')) {
        return next();
    }
    const indexFile = path.join(clientDistPath, 'index.html');
    if (require('fs').existsSync(indexFile)) {
        return res.sendFile(indexFile);
    }
    next();
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
