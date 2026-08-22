const express = require('express');
const router = express.Router();
const { createReport, getReports, getReportById } = require('../controllers/reportController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const {
    validateCreateReport,
    validateReportQuery
} = require('../middleware/validateMiddleware');

const { acceptRescue, declineRescue, startRescue, completeRescue } = require('../controllers/rescuerController');

router.route('/')
    // CONCEPT: Caching with Redis — cache GET /api/reports for 30 seconds
    // CONCEPT: Filtering/Ordering — validateReportQuery checks query params
    .get(authenticateUser, validateReportQuery, cacheMiddleware(30), getReports)
    // CONCEPT: Request Body Validation — validateCreateReport checks POST body
    .post(authenticateUser, authorizeRole('CITIZEN', 'ADMIN'), upload.single('image'), validateCreateReport, createReport);

router.route('/:id')
    // Cache individual report for 60 seconds
    .get(authenticateUser, cacheMiddleware(60, (req) => `cache:report:${req.params.id}`), getReportById);

// Rescuer Actions
router.post('/:id/accept', authenticateUser, authorizeRole('RESCUER'), acceptRescue);
router.post('/:id/decline', authenticateUser, authorizeRole('RESCUER'), declineRescue);
router.post('/:id/start', authenticateUser, authorizeRole('RESCUER'), startRescue);
router.post('/:id/complete', authenticateUser, authorizeRole('RESCUER'), completeRescue);

module.exports = router;
