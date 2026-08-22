const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') }); 
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { getRedisClient } = require('./config/redis');
const { startAllJobs } = require('./jobs/cleanupJob');
const { Server } = require('socket.io');

// Connect to Database
connectDB();

// Initialize Redis client (graceful — won't crash if Redis is unavailable)
// CONCEPT: Caching with Redis
getRedisClient();

const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true
    }
});

// Expose io instance to app to use in controllers if needed
app.set('io', io);

// Basic socket connection setup
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room based on userId for targeted notifications
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`SSR pages available at: http://localhost:${PORT}/ssr`);

    // CONCEPT: Scheduled Jobs / Cron
    // Start all cron jobs after server is listening
    startAllJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    const { stopAllJobs } = require('./jobs/cleanupJob');
    stopAllJobs();
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
