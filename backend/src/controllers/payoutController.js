const { Payout, User, Vendor } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

const getAllPayouts = async (req, res) => {
  try {
    const { payout_type, status } = req.query;
    const filter = {};

    if (payout_type) filter.payout_type = payout_type;
    if (status) filter.status = status;

    // Filter by employee if user is sales_exec (only see their own salary/commission payouts)
    if (req.user.role === 'sales_exec') {
      filter.employee_id = req.user.id;
      if (filter.payout_type) {
        if (filter.payout_type === 'vendor_payment') {
          return res.json({ success: true, data: [] });
        }
      } else {
        filter.payout_type = { [Op.in]: ['salary', 'commission'] };
      }
    }

    const payouts = await Payout.findAll({
      where: filter,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'role'] },
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'company_name'] },
        { model: User, as: 'verifier', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: payouts });
  } catch (error) {
    console.error('GetAllPayouts error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing payouts' });
  }
};

const createPayout = async (req, res) => {
  const {
    payout_type,
    status,
    verified_amount,
    verified_date,
    payment_mode,
    transaction_id,
    // Salary fields
    month,
    employee_id,
    salary_amount,
    commission_amount,
    deduction_amount,
    final_amount,
    // Commission fields
    destination,
    revenue_amount,
    b2b_amount,
    profit_amount,
    commission_percentage,
    // Vendor fields
    vendor_id,
    customer_name,
    pax_count,
    travel_date,
    package_name,
    b2c_rate,
    b2b_rate,
    amount_paid,
    remaining_amount
  } = req.body;

  if (!payout_type) {
    return res.status(400).json({ success: false, message: 'Payout type is required' });
  }

  try {
    let payoutData = {
      payout_type,
      status: status || 'unpaid',
    };

    if (['paid', 'received'].includes(payoutData.status)) {
      payoutData.verified_date = verified_date || new Date().toISOString().split('T')[0];
      payoutData.payment_mode = payment_mode || 'Bank Transfer';
      payoutData.transaction_id = transaction_id || '';
      payoutData.verified_by = req.user.id;
    }

    if (payout_type === 'salary') {
      if (!month || !employee_id) {
        return res.status(400).json({ success: false, message: 'Month and Employee ID are required for Salary payouts' });
      }
      const sal = parseFloat(salary_amount || 0);
      const comm = parseFloat(commission_amount || 0);
      const ded = parseFloat(deduction_amount || 0);
      const finalAmt = final_amount !== undefined ? parseFloat(final_amount) : (sal + comm - ded);

      payoutData = {
        ...payoutData,
        month,
        employee_id,
        salary_amount: sal,
        commission_amount: comm,
        deduction_amount: ded,
        final_amount: finalAmt
      };

      if (['paid', 'received'].includes(payoutData.status)) {
        payoutData.verified_amount = verified_amount !== undefined ? parseFloat(verified_amount) : finalAmt;
      }
    } else if (payout_type === 'commission') {
      if (!employee_id) {
        return res.status(400).json({ success: false, message: 'Employee ID is required for Commission payouts' });
      }
      const rev = parseFloat(revenue_amount || 0);
      const b2b = parseFloat(b2b_amount || 0);
      const prof = profit_amount !== undefined ? parseFloat(profit_amount) : (rev - b2b);
      const pct = parseFloat(commission_percentage || 0);
      const commAmt = prof * (pct / 100);

      payoutData = {
        ...payoutData,
        employee_id,
        destination,
        revenue_amount: rev,
        b2b_amount: b2b,
        profit_amount: prof,
        commission_percentage: pct,
        commission_amount: commAmt
      };

      if (['paid', 'received'].includes(payoutData.status)) {
        payoutData.verified_amount = verified_amount !== undefined ? parseFloat(verified_amount) : commAmt;
      }
    } else if (payout_type === 'vendor_payment') {
      if (!vendor_id) {
        return res.status(400).json({ success: false, message: 'Vendor ID is required for Vendor payments' });
      }
      const b2c = parseFloat(b2c_rate || 0);
      const b2b = parseFloat(b2b_rate || 0);
      const paid = parseFloat(amount_paid || 0);
      const rem = remaining_amount !== undefined ? parseFloat(remaining_amount) : (b2b - paid);
      const prof = b2c - b2b;

      payoutData = {
        ...payoutData,
        vendor_id,
        destination,
        customer_name,
        pax_count: parseInt(pax_count || 0),
        travel_date,
        package_name,
        b2c_rate: b2c,
        b2b_rate: b2b,
        amount_paid: paid,
        remaining_amount: rem,
        profit_amount: prof
      };

      if (['paid', 'received'].includes(payoutData.status)) {
        payoutData.verified_amount = verified_amount !== undefined ? parseFloat(verified_amount) : paid;
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payout type' });
    }

    const payout = await Payout.create(payoutData);

    await logActivity({
      action: 'PAYOUT_CREATED',
      entityType: 'Payout',
      entityId: payout.id,
      newValue: { id: payout.id, payout_type, amount: payout.final_amount || payout.commission_amount || payout.amount_paid },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({ success: true, message: 'Payout logged successfully', data: payout });
  } catch (error) {
    console.error('CreatePayout error:', error);
    return res.status(500).json({ success: false, message: 'Server error logging payout' });
  }
};

const updatePayoutStatus = async (req, res) => {
  const { id } = req.params;
  const { status, verified_amount, verified_date, payment_mode, transaction_id } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  try {
    const payout = await Payout.findByPk(id);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout record not found' });
    }

    const oldStatus = payout.status;
    payout.status = status;

    if (['paid', 'received'].includes(status)) {
      let defaultAmt = 0;
      if (payout.payout_type === 'salary') {
        defaultAmt = payout.final_amount;
      } else if (payout.payout_type === 'commission') {
        defaultAmt = payout.commission_amount;
      } else if (payout.payout_type === 'vendor_payment') {
        defaultAmt = payout.amount_paid;
      }

      payout.verified_amount = verified_amount !== undefined ? parseFloat(verified_amount) : defaultAmt;
      payout.verified_date = verified_date || new Date().toISOString().split('T')[0];
      payout.payment_mode = payment_mode || 'Bank Transfer';
      payout.transaction_id = transaction_id || '';
      payout.verified_by = req.user.id;
    }

    await payout.save();

    await logActivity({
      action: 'PAYOUT_STATUS_UPDATED',
      entityType: 'Payout',
      entityId: payout.id,
      newValue: { id: payout.id, status, oldStatus },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Payout status updated successfully', data: payout });
  } catch (error) {
    console.error('UpdatePayoutStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating payout status' });
  }
};

module.exports = {
  getAllPayouts,
  createPayout,
  updatePayoutStatus
};
