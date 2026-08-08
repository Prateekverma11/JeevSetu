const express = require('express');
const router = express.Router();
const { createReport, getReports, getReportById } = require('../controllers/reportController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const { acceptRescue, declineRescue, startRescue, completeRescue } = require('../controllers/rescuerController');

router.route('/')
    .get(authenticateUser, getReports)
    .post(authenticateUser, authorizeRole('CITIZEN', 'ADMIN'), upload.single('image'), createReport);

router.route('/:id')
    .get(authenticateUser, getReportById);

// Rescuer Actions
router.post('/:id/accept', authenticateUser, authorizeRole('RESCUER'), acceptRescue);
router.post('/:id/decline', authenticateUser, authorizeRole('RESCUER'), declineRescue);
router.post('/:id/start', authenticateUser, authorizeRole('RESCUER'), startRescue);
router.post('/:id/complete', authenticateUser, authorizeRole('RESCUER'), completeRescue);

module.exports = router;
