const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

router.get('/leads', checkPermission('view_lead_source_reports'), reportController.getLeadsReport);
router.get('/revenue', checkPermission('view_revenue_profit'), reportController.getRevenueReport);
router.get('/profit', checkPermission('view_revenue_profit'), reportController.getProfitReport);
router.get('/sales-exec', checkPermission('view_revenue_profit'), reportController.getSalesExecPerformance);
router.get('/lost-reasons', checkPermission('view_lead_source_reports'), reportController.getLostReasons);
router.get('/missed-followups', checkPermission('view_revenue_profit'), reportController.getMissedFollowUpsReport);
router.get('/marketing', checkPermission('view_lead_source_reports'), reportController.getMarketingReport);

module.exports = router;
