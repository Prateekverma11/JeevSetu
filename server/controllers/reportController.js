const RescueReport = require('../models/RescueReport');
const User = require('../models/User');
const Notification = require('../models/Notification');
const RescueHistory = require('../models/RescueHistory');

// @desc    Create new rescue report
// @route   POST /api/reports
// @access  Private (Citizen)
const createReport = async (req, res, next) => {
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

        const report = await RescueReport.create({
            citizenId: req.user._id,
            animalType,
            description,
            severity,
            imageUrl,
            location: {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)]
            }
        });

        // Add history
        await RescueHistory.create({
            reportId: report._id,
            changedBy: req.user._id,
            status: 'PENDING',
            notes: 'Report created'
        });

        // Search for nearby rescuers (Phase 4 logic included here)
        // Find rescuers within their configured rescueRadius
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
                    reportId: report._id,
                    title: 'New Rescue Request',
                    message: `An injured ${animalType} has been reported within ${distance.toFixed(1)} km of your location.`,
                    type: 'NEW_REPORT'
                });

                // Notify real-time
                if (io) {
                    io.to(rescuer._id.toString()).emit('new_rescue_request', {
                        report,
                        notification
                    });
                }
                
                notifiedCount++;
            }
        }

        if (notifiedCount > 0) {
            report.status = 'NOTIFIED';
            await report.save();
        }

        res.status(201).json(report);

    } catch (error) {
        next(error);
    }
};

// @desc    Get all reports (for admin/citizen)
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res, next) => {
    try {
        let query = {};
        
        // If citizen, only show their reports
        if (req.user.role === 'CITIZEN') {
            query.citizenId = req.user._id;
        }

        const reports = await RescueReport.find(query).sort('-createdAt');
        res.json(reports);
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
