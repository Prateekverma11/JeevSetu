const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort('-createdAt')
            .limit(50); // Get latest 50

        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            res.status(404);
            throw new Error('Notification not found');
        }

        // Make sure user owns notification
        if (notification.userId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized');
        }

        notification.isRead = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead
};
