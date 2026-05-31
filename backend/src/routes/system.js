const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

// Dashboards
router.get('/dashboard/admin', checkPermission('view_revenue_profit'), systemController.getAdminDashboard);
router.get('/dashboard/sales', systemController.getSalesDashboard);
router.get('/dashboard/finance', checkPermission('view_expenses'), systemController.getFinanceDashboard);
router.get('/dashboard/operations', checkPermission('view_operations'), systemController.getOperationsDashboard);
router.get('/dashboard/marketing', checkPermission('view_lead_source_reports'), systemController.getMarketingDashboard);

// Delete Requests
router.get('/delete-requests', checkPermission('approve_delete_request'), systemController.getDeleteRequests);
router.patch('/delete-requests/:id/approve', checkPermission('approve_delete_request'), systemController.approveDeleteRequest);
router.patch('/delete-requests/:id/reject', checkPermission('approve_delete_request'), systemController.rejectDeleteRequest);

// Activity Logs
router.get('/activity-logs', checkPermission('view_activity_logs'), systemController.getActivityLogs);

module.exports = router;
