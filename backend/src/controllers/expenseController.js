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
        { model: User, as: 'addedByUser', attributes: ['id', 'name'] }
      ],
      order: [['expense_date', 'DESC']]
    });

    return res.json({ success: true, data: expenses });
  } catch (error) {
    console.error('GetAllExpenses error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing expenses' });
  }
};

const getExpensesHistory = async (req, res) => {
  try {
    const { Payout, Vendor } = require('../models');

    const expenses = await Expense.findAll({
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name'] }]
    });

    const payouts = await Payout.findAll({
      where: {
        status: ['paid', 'received']
      },
      include: [
        { model: User, as: 'employee', attributes: ['id', 'name'] },
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'company_name'] }
      ]
    });

    const history = [];

    expenses.forEach(exp => {
      history.push({
        id: exp.id,
        source: 'manual_expense',
        type: exp.expense_type,
        amount: parseFloat(exp.amount),
        date: exp.expense_date,
        payment_mode: exp.payment_mode,
        notes: exp.notes,
        recipient: 'Company Expense',
        reference_id: 'N/A'
      });
    });

    payouts.forEach(p => {
      let recipient = 'Unknown';
      let amount = 0;
      if (p.payout_type === 'salary') {
        recipient = p.employee ? p.employee.name : 'Unknown Employee';
        amount = parseFloat(p.final_amount || 0);
      } else if (p.payout_type === 'commission') {
        recipient = p.employee ? p.employee.name : 'Unknown Employee';
        amount = parseFloat(p.commission_amount || 0);
      } else if (p.payout_type === 'vendor_payment') {
        recipient = p.vendor ? (p.vendor.company_name || p.vendor.name) : 'Unknown Vendor';
        amount = parseFloat(p.amount_paid || p.b2b_rate || 0);
      }

      if (p.verified_amount !== null && p.verified_amount !== undefined) {
        amount = parseFloat(p.verified_amount);
      }

      history.push({
        id: p.id,
        source: 'payout',
        type: p.payout_type,
        amount: amount,
        date: p.verified_date || (p.createdAt ? p.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        payment_mode: p.payment_mode || 'N/A',
        notes: `Payout status: ${p.status}`,
        recipient: recipient,
        reference_id: p.transaction_id || 'N/A'
      });
    });

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({ success: true, data: history });
  } catch (error) {
    console.error('GetExpensesHistory error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving expenses history' });
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
    const { Payout } = require('../models');

    const expenses = await Expense.findAll();
    const payouts = await Payout.findAll({
      where: {
        status: ['paid', 'received']
      }
    });

    const summary = {
      total: 0,
      by_type: {
        meta_ads: 0,
        software: 0,
        refund: 0,
        misc: 0,
        salary: 0,
        commission: 0,
        vendor_payment: 0
      }
    };

    expenses.forEach(e => {
      const amt = parseFloat(e.amount);
      summary.total += amt;
      if (summary.by_type[e.expense_type] !== undefined) {
        summary.by_type[e.expense_type] += amt;
      }
    });

    payouts.forEach(p => {
      let amt = 0;
      if (p.payout_type === 'salary') {
        amt = parseFloat(p.final_amount || 0);
      } else if (p.payout_type === 'commission') {
        amt = parseFloat(p.commission_amount || 0);
      } else if (p.payout_type === 'vendor_payment') {
        amt = parseFloat(p.amount_paid || 0);
      }

      if (p.verified_amount !== null && p.verified_amount !== undefined) {
        amt = parseFloat(p.verified_amount);
      }

      summary.total += amt;
      if (summary.by_type[p.payout_type] !== undefined) {
        summary.by_type[p.payout_type] += amt;
      }
    });

    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error('GetExpenseSummary error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving expense analytics' });
  }
};

const deleteHistoryItems = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items selected for deletion' });
  }

  try {
    const { Payout } = require('../models');

    for (const item of items) {
      if (item.source === 'manual_expense') {
        await Expense.destroy({ where: { id: item.id } });
      } else if (item.source === 'payout') {
        await Payout.destroy({ where: { id: item.id } });
      }
    }

    await logActivity({
      action: 'EXPENSE_HISTORY_BULK_DELETED',
      entityType: 'Expense',
      entityId: req.user.id,
      newValue: { count: items.length },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Selected records deleted successfully' });
  } catch (error) {
    console.error('DeleteHistoryItems error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting transaction records' });
  }
};

module.exports = {
  getAllExpenses,
  getExpensesHistory,
  createExpense,
  getExpenseSummary,
  deleteHistoryItems,
};
