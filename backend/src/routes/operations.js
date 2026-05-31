const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

router.get('/bookings', checkPermission('view_operations'), operationsController.getOperationsBookings);
router.get('/bookings/:id', checkPermission('view_operations'), operationsController.getOperationsBookingById);
router.put('/bookings/:id', checkPermission('update_operations'), operationsController.updateOperationsBooking);
router.patch('/bookings/:id/trip-status', checkPermission('update_operations'), operationsController.updateTripStatus);

module.exports = router;
