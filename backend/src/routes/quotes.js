const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

router.post('/', checkPermission('create_quotation'), quoteController.createQuote);
router.get('/lead/:leadId', checkPermission('create_quotation'), quoteController.getQuotesByLead);
router.put('/:id', checkPermission('create_quotation'), quoteController.updateQuote);
router.patch('/:id/status', checkPermission('create_quotation'), quoteController.updateQuoteStatus);

module.exports = router;
