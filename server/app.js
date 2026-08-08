const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve built client in production or when available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/rescuers', require('./routes/rescuerRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Basic route
app.get('/', (req, res) => {
    // If client is built, serve its index.html, otherwise show API message
    const indexFile = path.join(clientDistPath, 'index.html');
    if (require('fs').existsSync(indexFile)) {
        res.sendFile(indexFile);
    } else {
        res.send('Animal Rescuer API is running...');
    }
});

// Fallback: serve client index.html for any unknown route (for SPA client-side routing)
app.use((req, res, next) => {
    const indexFile = path.join(clientDistPath, 'index.html');
    if (require('fs').existsSync(indexFile)) {
        return res.sendFile(indexFile);
    }
    next();
});

// Error Handler Middleware
app.use(errorHandler);

module.exports = app;
