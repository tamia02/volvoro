const { Expense, User } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

const getAllExpenses = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const filter = {};

    if (type) filter.expense_type = type;
    if (startDate && endDate) {
      filter.expense_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const expenses = await Expense.findAll({
      where: filter,
      include: [
        { model: User, as: 'addedByUser', attributes: ['id', 'name'], association: new User.hasMany(Expense, { foreignKey: 'added_by', as: 'expensesAdded' }).association }
      ],
      order: [['expense_date', 'DESC']]
    });

    return res.json({ success: true, data: expenses });
  } catch (error) {
    console.error('GetAllExpenses error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing expenses' });
  }
};

const createExpense = async (req, res) => {
  const { expense_type, amount, expense_date, payment_mode, notes } = req.body;

  if (!expense_type || !amount || !expense_date || !payment_mode) {
    return res.status(400).json({
      success: false,
      message: 'Expense type, amount, expense date, and payment mode are required'
    });
  }

  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return res.status(400).json({ success: false, message: 'Amount must be a valid number' });
    }

    const expense = await Expense.create({
      expense_type,
      amount: numAmount,
      expense_date,
      payment_mode,
      notes,
      added_by: req.user.id,
    });

    // Audit logs
    await logActivity({
      action: 'EXPENSE_ADDED',
      entityType: 'Expense',
      entityId: expense.id,
      newValue: { id: expense.id, expense_type, amount: numAmount },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({ success: true, message: 'Expense logged successfully', data: expense });
  } catch (error) {
    console.error('CreateExpense error:', error);
    return res.status(500).json({ success: false, message: 'Server error adding expense' });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const expenses = await Expense.findAll();

    const summary = {
      total: 0,
      by_type: {
        meta_ads: 0,
        staff: 0,
        commission: 0,
        vendor_payment: 0,
        refund: 0,
        software: 0,
        misc: 0
      }
    };

    expenses.forEach(e => {
      const amt = parseFloat(e.amount);
      summary.total += amt;
      if (summary.by_type[e.expense_type] !== undefined) {
        summary.by_type[e.expense_type] += amt;
      } else {
        summary.by_type[e.expense_type] = amt;
      }
    });

    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error('GetExpenseSummary error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving expense analytics' });
  }
};

module.exports = {
  getAllExpenses,
  createExpense,
  getExpenseSummary,
};
