const express = require('express');
const router = express.Router();
const { updateLocation, updateRadius, updateAvailability, getNearbyRequests, getRescueHistory } = require('../controllers/rescuerController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const {
    validateUpdateLocation,
    validateUpdateRadius
} = require('../middleware/validateMiddleware');

router.use(authenticateUser);
router.use(authorizeRole('RESCUER'));

// CONCEPT: Caching — cache nearby requests for 20 seconds per rescuer
router.get('/nearby', cacheMiddleware(20, (req) => `cache:nearby:${req.user._id}`), getNearbyRequests);
router.get('/history', getRescueHistory);

// CONCEPT: Request Body Validation on PATCH routes
router.patch('/location', validateUpdateLocation, updateLocation);
router.patch('/radius', validateUpdateRadius, updateRadius);
router.patch('/availability', updateAvailability);

module.exports = router;
