const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

router.get('/', checkPermission('view_payouts'), payoutController.getAllPayouts);
router.post('/', checkPermission('manage_payouts'), payoutController.createPayout);
router.put('/:id/status', checkPermission('manage_payouts'), payoutController.updatePayoutStatus);

module.exports = router;
