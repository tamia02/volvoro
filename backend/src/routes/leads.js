const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

// All lead endpoints require a valid token
router.use(verifyToken);

router.get('/', leadController.getAllLeads);
router.post('/', checkPermission('create_lead'), leadController.createLead);
router.post('/bulk-import', checkPermission('create_lead'), leadController.bulkImportLeads);

router.get('/:id', checkPermission('view_lead_own'), leadController.getLeadById);
router.put('/:id', checkPermission('edit_lead'), leadController.updateLead);
router.patch('/:id/status', checkPermission('update_lead_status'), leadController.updateLeadStatus);
router.post('/:id/assign', checkPermission('assign_lead'), leadController.assignLead);
router.post('/:id/delete-request', checkPermission('raise_delete_request'), leadController.raiseDeleteRequest);

module.exports = router;
