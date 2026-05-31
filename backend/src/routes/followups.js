const express = require('express');
const router = express.Router();
const followupController = require('../controllers/followupController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', followupController.createFollowUp);
router.get('/lead/:leadId', followupController.getFollowUpsByLead);
router.get('/missed', followupController.getMissedFollowUps);
router.get('/today', followupController.getTodayFollowUps);

module.exports = router;
