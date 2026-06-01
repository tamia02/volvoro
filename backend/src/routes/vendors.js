const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

router.get('/', vendorController.getAllVendors);
router.get('/:id', vendorController.getVendorById);

router.post('/', checkPermission('manage_vendors'), vendorController.createVendor);
router.put('/:id', checkPermission('manage_vendors'), vendorController.updateVendor);
router.patch('/:id/status', checkPermission('manage_vendors'), vendorController.toggleVendorStatus);
router.delete('/:id', checkPermission('manage_vendors'), vendorController.deleteVendor);

// Vendor Destination rates
router.post('/:vendorId/destinations', checkPermission('manage_vendors'), vendorController.addVendorDestinationRate);
router.delete('/:vendorId/destinations/:id', checkPermission('manage_vendors'), vendorController.deleteVendorDestinationRate);

module.exports = router;
