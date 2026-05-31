const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

router.get('/', checkPermission('approve_commission'), commissionController.getAllCommissions);
router.get('/my', commissionController.getMyCommissions);

router.patch('/:id/approve', checkPermission('approve_commission'), commissionController.approveCommission);
router.patch('/:id/paid', checkPermission('approve_commission'), commissionController.markCommissionPaid);

module.exports = router;
