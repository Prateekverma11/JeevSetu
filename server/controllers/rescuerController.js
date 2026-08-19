const User = require('../models/User');
const RescueReport = require('../models/RescueReport');
const RescueHistory = require('../models/RescueHistory');
const Notification = require('../models/Notification');

// @desc    Update rescuer location
// @route   PATCH /api/rescuers/location
// @access  Private (Rescuer)
const updateLocation = async (req, res, next) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            res.status(400);
            throw new Error('Please provide latitude and longitude');
        }

        const user = await User.findById(req.user._id);
        user.location = {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)]
        };
        await user.save();

        res.json({ message: 'Location updated', location: user.location });
    } catch (error) {
        next(error);
    }
};

// @desc    Update rescuer radius
// @route   PATCH /api/rescuers/radius
// @access  Private (Rescuer)
const updateRadius = async (req, res, next) => {
    try {
        const { radius } = req.body;

        if (radius < 1 || radius > 10) {
            res.status(400);
            throw new Error('Radius must be between 1 and 10 km');
        }

        const user = await User.findById(req.user._id);
        user.rescueRadius = radius;
        await user.save();

        res.json({ message: 'Radius updated', radius: user.rescueRadius });
    } catch (error) {
        next(error);
    }
};

// @desc    Update rescuer availability
// @route   PATCH /api/rescuers/availability
// @access  Private (Rescuer)
const updateAvailability = async (req, res, next) => {
    try {
        const { isAvailable } = req.body;

        const user = await User.findById(req.user._id);
        user.isAvailable = isAvailable;
        await user.save();

        res.json({ message: 'Availability updated', isAvailable: user.isAvailable });
    } catch (error) {
        next(error);
    }
};

// @desc    Get nearby rescue requests and active assigned rescues
// @route   GET /api/rescuers/nearby
// @access  Private (Rescuer)
const getNearbyRequests = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        // Fetch assigned active rescues first
        const assignedReports = await RescueReport.find({
            assignedRescuerId: req.user._id,
            status: { $in: ['ACCEPTED', 'IN_PROGRESS'] }
        }).sort('-updatedAt');

        let nearbyReports = [];

        if (user.location && user.location.coordinates && user.location.coordinates.length >= 2) {
            const radius = user.rescueRadius || 5;
            try {
                nearbyReports = await RescueReport.find({
                    status: { $in: ['PENDING', 'NOTIFIED'] },
                    location: {
                        $near: {
                            $geometry: user.location,
                            $maxDistance: radius * 1000
                        }
                    }
                });
            } catch (geoErr) {
                console.warn('Geospatial index query error, falling back to basic pending fetch:', geoErr.message);
                nearbyReports = await RescueReport.find({
                    status: { $in: ['PENDING', 'NOTIFIED'] }
                });
            }
        } else {
            // Fallback if location not set yet: return all pending reports
            nearbyReports = await RescueReport.find({
                status: { $in: ['PENDING', 'NOTIFIED'] }
            });
        }

        // Combine assigned reports and nearby reports (ensuring uniqueness)
        const assignedIds = new Set(assignedReports.map(r => r._id.toString()));
        const filteredNearby = nearbyReports.filter(r => !assignedIds.has(r._id.toString()));

        res.json([...assignedReports, ...filteredNearby]);
    } catch (error) {
        next(error);
    }
};

// Rescue Actions

const handleRescueAction = async (req, res, next, action) => {
    try {
        const report = await RescueReport.findById(req.params.id).populate('citizenId');
        if (!report) {
            res.status(404);
            throw new Error('Report not found');
        }

        const io = req.app.get('io');

        let newStatus = '';
        let notificationMsg = '';

        if (action === 'ACCEPT') {
            if (report.status !== 'PENDING' && report.status !== 'NOTIFIED') {
                res.status(400);
                throw new Error('Report is no longer available');
            }
            newStatus = 'ACCEPTED';
            report.assignedRescuerId = req.user._id;
            report.acceptedAt = Date.now();
            notificationMsg = 'A rescuer has accepted your rescue request.';
        } else if (action === 'DECLINE') {
            // Do not change status so others can accept
            await RescueHistory.create({
                reportId: report._id,
                changedBy: req.user._id,
                status: 'DECLINED_BY_RESCUER',
                notes: 'Rescuer declined'
            });
            return res.json({ message: 'Declined successfully' });
        } else if (action === 'START') {
            if (report.assignedRescuerId.toString() !== req.user._id.toString()) {
                res.status(403);
                throw new Error('Not authorized');
            }
            newStatus = 'IN_PROGRESS';
            notificationMsg = 'The rescuer has started the rescue.';
        } else if (action === 'COMPLETE') {
            if (report.assignedRescuerId.toString() !== req.user._id.toString()) {
                res.status(403);
                throw new Error('Not authorized');
            }
            newStatus = 'COMPLETED';
            report.completedAt = Date.now();
            notificationMsg = 'The rescue has been completed.';
        }

        report.status = newStatus;
        await report.save();

        await RescueHistory.create({
            reportId: report._id,
            changedBy: req.user._id,
            status: newStatus,
            notes: `Rescue ${newStatus.toLowerCase()}`
        });

        const notification = await Notification.create({
            userId: report.citizenId._id,
            reportId: report._id,
            title: `Rescue ${newStatus}`,
            message: notificationMsg,
            type: `RESCUE_${newStatus}`
        });

        io.to(report.citizenId._id.toString()).emit('rescue_status_update', {
            report,
            notification
        });

        res.json(report);

    } catch (error) {
        next(error);
    }
};

const acceptRescue = (req, res, next) => handleRescueAction(req, res, next, 'ACCEPT');
const declineRescue = (req, res, next) => handleRescueAction(req, res, next, 'DECLINE');
const startRescue = (req, res, next) => handleRescueAction(req, res, next, 'START');
const completeRescue = (req, res, next) => handleRescueAction(req, res, next, 'COMPLETE');

module.exports = {
    updateLocation,
    updateRadius,
    updateAvailability,
    getNearbyRequests,
    acceptRescue,
    declineRescue,
    startRescue,
    completeRescue
};
