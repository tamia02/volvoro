const { Commission, Booking, User, Customer, Lead } = require('../models');
const { logActivity } = require('../utils/activityLogger');

const getAllCommissions = async (req, res) => {
  try {
    const commissions = await Commission.findAll({
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'destination', 'package_amount']
        },
        {
          model: User,
          as: 'salesExec',
          attributes: ['id', 'name', 'mobile', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: commissions });
  } catch (error) {
    console.error('GetAllCommissions error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing commissions' });
  }
};

const getMyCommissions = async (req, res) => {
  try {
    const commissions = await Commission.findAll({
      where: { sales_exec_id: req.user.id },
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'destination', 'package_amount']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: commissions });
  } catch (error) {
    console.error('GetMyCommissions error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing your commissions' });
  }
};

const approveCommission = async (req, res) => {
  try {
    const commission = await Commission.findByPk(req.params.id);

    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission record not found' });
    }

    if (commission.status !== 'payable') {
      return res.status(400).json({ success: false, message: `Cannot approve commission. Current status is ${commission.status}` });
    }

    const oldStatus = commission.status;
    commission.status = 'approved';
    commission.approved_by = req.user.id;
    commission.approved_at = new Date();
    await commission.save();

    // Audit logs
    await logActivity({
      action: 'COMMISSION_APPROVED',
      entityType: 'Commission',
      entityId: commission.id,
      oldValue: { status: oldStatus },
      newValue: { status: 'approved', approved_by: req.user.id },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Commission approved for payout', data: commission });
  } catch (error) {
    console.error('ApproveCommission error:', error);
    return res.status(500).json({ success: false, message: 'Server error approving commission' });
  }
};

const markCommissionPaid = async (req, res) => {
  const { payment_reference } = req.body;

  if (!payment_reference) {
    return res.status(400).json({ success: false, message: 'Payment reference ID is required' });
  }

  try {
    const commission = await Commission.findByPk(req.params.id);

    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission record not found' });
    }

    if (commission.status !== 'approved') {
      return res.status(400).json({ success: false, message: `Cannot pay commission. Commission must be approved first (current status: ${commission.status})` });
    }

    const oldStatus = commission.status;
    commission.status = 'paid';
    commission.paid_date = new Date().toISOString().split('T')[0];
    commission.payment_reference = payment_reference;
    await commission.save();

    // Audit logs
    await logActivity({
      action: 'COMMISSION_PAID',
      entityType: 'Commission',
      entityId: commission.id,
      oldValue: { status: oldStatus },
      newValue: { status: 'paid', payment_reference, paid_date: commission.paid_date },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Commission marked as paid successfully', data: commission });
  } catch (error) {
    console.error('MarkCommissionPaid error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating commission status' });
  }
};

module.exports = {
  getAllCommissions,
  getMyCommissions,
  approveCommission,
  markCommissionPaid,
};
