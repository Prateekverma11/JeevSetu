const express = require('express');
const router = express.Router();
const RescueReport = require('../models/RescueReport');
const User = require('../models/User');
const { renderLanding, renderReportsPage } = require('../ssr/renderHTML');

/**
 * SSR Route: Landing Page
 * GET /ssr
 *
 * Fetches live stats from MongoDB and renders a complete HTML page on the server.
 * Demonstrates Server-Side Rendering: data is fetched and HTML is built before
 * any response is sent to the client.
 */
router.get('/', async (req, res) => {
    try {
        // Fetch data server-side (this is the key SSR step)
        const [totalReports, completedRescues, totalRescuers, recentReports] = await Promise.all([
            RescueReport.countDocuments(),
            RescueReport.countDocuments({ status: 'COMPLETED' }),
            User.countDocuments({ role: 'RESCUER', isAvailable: true }),
            RescueReport.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('animalType description severity status createdAt')
                .lean()
        ]);

        // Render full HTML on server
        const html = renderLanding({
            totalReports,
            totalRescuers,
            completedRescues,
            recentReports
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Rendered-By', 'Express-SSR');
        res.send(html);
    } catch (error) {
        console.error('[SSR] Landing page error:', error.message);
        res.status(500).send('<h1>SSR Error</h1><p>Failed to render page server-side.</p>');
    }
});

/**
 * SSR Route: Reports List Page
 * GET /ssr/reports
 *
 * Supports query params: ?status=PENDING&sortBy=createdAt&order=desc&limit=20
 * Demonstrates SSR with dynamic filtering and ordering rendered server-side.
 */
router.get('/reports', async (req, res) => {
    try {
        const {
            status,
            animalType,
            severity,
            sortBy = 'createdAt',
            order = 'desc',
            limit = 20,
            page = 1
        } = req.query;

        // Build filter query
        const filter = {};
        if (status) filter.status = status;
        if (animalType) filter.animalType = { $regex: animalType, $options: 'i' };
        if (severity) filter.severity = severity;

        // Valid sort fields whitelist
        const allowedSortFields = ['createdAt', 'updatedAt', 'severity', 'status'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;

        const skip = (Number(page) - 1) * Number(limit);

        const [reports, total] = await Promise.all([
            RescueReport.find(filter)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(Number(limit))
                .select('animalType description severity status createdAt location')
                .lean(),
            RescueReport.countDocuments(filter)
        ]);

        // Render full HTML on server with fetched data
        const html = renderReportsPage({
            reports,
            filters: { status, animalType, severity, sortBy, order },
            total
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Rendered-By', 'Express-SSR');
        res.send(html);
    } catch (error) {
        console.error('[SSR] Reports page error:', error.message);
        res.status(500).send('<h1>SSR Error</h1><p>Failed to render reports server-side.</p>');
    }
});

module.exports = router;
