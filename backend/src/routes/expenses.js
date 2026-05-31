const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.use(verifyToken);

router.get('/', checkPermission('view_expenses'), expenseController.getAllExpenses);
router.post('/', checkPermission('add_expense'), expenseController.createExpense);
router.get('/summary', checkPermission('view_expenses'), expenseController.getExpenseSummary);

module.exports = router;
