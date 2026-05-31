const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const upload = require('../middleware/multer');

router.use(verifyToken);

router.get('/', paymentController.getAllPayments);
router.post('/', checkPermission('upload_payment'), upload.single('screenshot'), paymentController.uploadPaymentProof);
router.get('/:id', paymentController.getPaymentById);
router.get('/booking/:bookingId', paymentController.getPaymentsByBooking);

router.patch('/:id/verify', checkPermission('verify_payment'), paymentController.verifyPayment);
router.patch('/:id/reject', checkPermission('verify_payment'), paymentController.rejectPayment);

module.exports = router;
