const mongoose = require('mongoose');
const RescueReport = require('../models/RescueReport');
const User = require('../models/User');
const Notification = require('../models/Notification');
const RescueHistory = require('../models/RescueHistory');
const { cacheDelPattern } = require('../config/redis');

// @desc    Create new rescue report
// @route   POST /api/reports
// @access  Private (Citizen)
const createReport = async (req, res, next) => {
    // Start a Mongoose session for atomic transaction
    // CONCEPT: Transactions — ensures report + history are created atomically.
    // If either operation fails, both are rolled back.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { animalType, description, severity, latitude, longitude } = req.body;
        
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        if (!animalType || !description || !severity || !latitude || !longitude) {
            res.status(400);
            throw new Error('Please provide all required fields');
        }

        // Create report within transaction
        const report = await RescueReport.create([{
            citizenId: req.user._id,
            animalType,
            description,
            severity,
            imageUrl,
            location: {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)]
            }
        }], { session });

        const createdReport = report[0];

        // Create history within same transaction — atomic with report creation
        await RescueHistory.create([{
            reportId: createdReport._id,
            changedBy: req.user._id,
            status: 'PENDING',
            notes: 'Report created'
        }], { session });

        // Commit the transaction — both documents are now persisted
        await session.commitTransaction();
        session.endSession();

        // Post-commit: Notify rescuers (outside transaction — non-critical path)
        const rescuers = await User.find({
            role: 'RESCUER',
            isAvailable: true
        });

        const io = req.app.get('io');
        let notifiedCount = 0;

        for (const rescuer of rescuers) {
            if (!rescuer.location || !rescuer.location.coordinates || rescuer.location.coordinates.length < 2 || !rescuer.rescueRadius) continue;
            
            const [resLng, resLat] = rescuer.location.coordinates;
            const reportLng = Number(longitude);
            const reportLat = Number(latitude);

            const toRad = (val) => (val * Math.PI) / 180;
            const R = 6371; // Earth radius in km
            const dLat = toRad(reportLat - resLat);
            const dLon = toRad(reportLng - resLng);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(resLat)) * Math.cos(toRad(reportLat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance <= rescuer.rescueRadius) {
                // Create notification
                const notification = await Notification.create({
                    userId: rescuer._id,
                    reportId: createdReport._id,
                    title: 'New Rescue Request',
                    message: `An injured ${animalType} has been reported within ${distance.toFixed(1)} km of your location.`,
                    type: 'NEW_REPORT'
                });

                // Notify real-time via Socket.IO
                if (io) {
                    io.to(rescuer._id.toString()).emit('new_rescue_request', {
                        report: createdReport,
                        notification
                    });
                }
                
                notifiedCount++;
            }
        }

        if (notifiedCount > 0) {
            createdReport.status = 'NOTIFIED';
            await createdReport.save();
        }

        // Invalidate reports cache since a new report was created
        await cacheDelPattern('cache:GET:/api/reports*');

        res.status(201).json(createdReport);

    } catch (error) {
        // Abort transaction on error — rolls back both report and history
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc    Get all reports with filtering, ordering, grouping, and pagination
// @route   GET /api/reports
// @access  Private
// CONCEPT: Filtering, ordering, grouping — supports ?status, ?animalType,
//          ?severity, ?sortBy, ?order, ?groupBy, ?page, ?limit query params.
const getReports = async (req, res, next) => {
    try {
        const {
            status,
            animalType,
            severity,
            sortBy = 'createdAt',
            order = 'desc',
            groupBy,
            page = 1,
            limit = 20
        } = req.query;

        // ── Filtering ──────────────────────────────────────────────────────────
        const filter = {};

        // If citizen, only show their own reports
        if (req.user.role === 'CITIZEN') {
            filter.citizenId = req.user._id;
        }

        // Optional status filter
        if (status) {
            // Support comma-separated statuses: ?status=PENDING,NOTIFIED
            const statuses = status.split(',').map(s => s.trim().toUpperCase());
            filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
        }

        // Optional animal type filter (case-insensitive substring match)
        if (animalType) {
            filter.animalType = { $regex: animalType, $options: 'i' };
        }

        // Optional severity filter
        if (severity) {
            filter.severity = severity.toUpperCase();
        }

        // ── Grouping ──────────────────────────────────────────────────────────
        // If groupBy is requested, return aggregated summary instead of raw list
        if (groupBy) {
            const allowedGroupFields = ['status', 'severity', 'animalType'];
            if (!allowedGroupFields.includes(groupBy)) {
                res.status(400);
                throw new Error(`groupBy must be one of: ${allowedGroupFields.join(', ')}`);
            }

            const grouped = await RescueReport.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: `$${groupBy}`,
                        count: { $sum: 1 },
                        latestReport: { $max: '$createdAt' }
                    }
                },
                { $sort: { count: -1 } },
                {
                    $project: {
                        _id: 0,
                        [groupBy]: '$_id',
                        count: 1,
                        latestReport: 1
                    }
                }
            ]);

            return res.json({
                groupBy,
                data: grouped,
                total: grouped.reduce((sum, g) => sum + g.count, 0)
            });
        }

        // ── Ordering ──────────────────────────────────────────────────────────
        const allowedSortFields = ['createdAt', 'updatedAt', 'severity', 'status', 'animalType'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;

        // ── Pagination ────────────────────────────────────────────────────────
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [reports, total] = await Promise.all([
            RescueReport.find(filter)
                .sort({ [safeSortBy]: sortOrder })
                .skip(skip)
                .limit(limitNum),
            RescueReport.countDocuments(filter)
        ]);

        res.json({
            data: reports,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res, next) => {
    try {
        const report = await RescueReport.findById(req.params.id)
            .populate('citizenId', 'name phone profileImage')
            .populate('assignedRescuerId', 'name phone profileImage');

        if (!report) {
            res.status(404);
            throw new Error('Report not found');
        }

        res.json(report);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createReport,
    getReports,
    getReportById
};
