const express = require('express');
const router = express.Router();
const { updateLocation, updateRadius, updateAvailability, getNearbyRequests } = require('../controllers/rescuerController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

router.use(authenticateUser);
router.use(authorizeRole('RESCUER'));

router.get('/nearby', getNearbyRequests);
router.patch('/location', updateLocation);
router.patch('/radius', updateRadius);
router.patch('/availability', updateAvailability);

module.exports = router;
