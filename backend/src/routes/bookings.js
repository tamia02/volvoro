const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

router.get('/', bookingController.getAllBookings);
router.post('/', checkPermission('raise_booking'), bookingController.createBookingRequest);
router.get('/:id', bookingController.getBookingById);

router.patch('/:id/approve', checkPermission('approve_booking'), bookingController.approveBooking);
router.patch('/:id/reject', checkPermission('approve_booking'), bookingController.rejectBooking);

module.exports = router;
