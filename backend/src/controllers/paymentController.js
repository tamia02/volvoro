const { Payment, Booking, Lead, Customer, User } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

// Helper to recalculate remaining amount on a booking
async function recalculateBookingBalance(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) return;

  const verifiedPayments = await Payment.findAll({
    where: {
      booking_id: bookingId,
      verification_status: 'verified'
    }
  });

  const totalVerified = verifiedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  booking.remaining_amount = booking.package_amount - totalVerified;
  await booking.save();
}

const getAllPayments = async (req, res) => {
  try {
    const filter = {};

    // Role filters
    if (req.user.role === 'sales_exec') {
      const assignedLeads = await Lead.findAll({
        where: { assigned_to: req.user.id, is_deleted: false },
        attributes: ['id']
      });
      const leadIds = assignedLeads.map(l => l.id);
      filter.lead_id = { [Op.in]: leadIds };
    } else if (req.user.role !== 'admin' && req.user.role !== 'finance') {
      // Operations/Marketing see no payment data
      return res.json({ success: true, data: [] });
    }

    const payments = await Payment.findAll({
      where: filter,
      include: [
        { 
          model: Booking, 
          as: 'booking',
          attributes: ['id', 'destination', 'package_amount', 'status'] 
        },
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'assigned_to'],
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: payments });
  } catch (error) {
    console.error('GetAllPayments error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing payments' });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        { model: Booking, as: 'booking' },
        { 
          model: Lead, 
          as: 'lead',
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name'] }]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && payment.lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: Payment does not belong to your lead' });
    } else if (req.user.role !== 'admin' && req.user.role !== 'finance') {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    return res.json({ success: true, data: payment });
  } catch (error) {
    console.error('GetPaymentById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving payment details' });
  }
};

const getPaymentsByBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.bookingId, {
      include: [{ model: Lead, as: 'lead' }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && booking.lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    } else if (req.user.role !== 'admin' && req.user.role !== 'finance') {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    const payments = await Payment.findAll({
      where: { booking_id: req.params.bookingId },
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: payments });
  } catch (error) {
    console.error('GetPaymentsByBooking error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching payments list' });
  }
};

const uploadPaymentProof = async (req, res) => {
  const { booking_id, lead_id, amount, payment_mode, transaction_id, payment_date, received_account } = req.body;

  if (!booking_id || !lead_id || !amount || !payment_mode || !transaction_id || !payment_date) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID, Lead ID, amount, payment mode, transaction ID, and payment date are required'
    });
  }

  try {
    const booking = await Booking.findByPk(booking_id, {
      include: [{ model: Lead, as: 'lead' }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && booking.lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return res.status(400).json({ success: false, message: 'Amount must be a valid number' });
    }

    // Handle files statically
    let screenshotUrl = req.body.screenshot_url || '';
    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    }

    const payment = await Payment.create({
      booking_id,
      lead_id,
      amount: numAmount,
      payment_mode,
      transaction_id,
      screenshot_url: screenshotUrl,
      payment_date,
      received_account,
      verification_status: 'pending',
      uploaded_by: req.user.id,
    });

    // Audit logs
    await logActivity({
      action: 'PAYMENT_PROOF_UPLOADED',
      entityType: 'Payment',
      entityId: payment.id,
      newValue: {
        id: payment.id,
        booking_id,
        amount: numAmount,
        transaction_id
      },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({ success: true, message: 'Payment proof uploaded successfully', data: payment });
  } catch (error) {
    console.error('UploadPaymentProof error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving payment entry' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.verification_status === 'verified') {
      return res.status(400).json({ success: false, message: 'Payment is already verified' });
    }

    const oldStatus = payment.verification_status;
    payment.verification_status = 'verified';
    payment.verified_by = req.user.id;
    payment.verified_at = new Date();
    await payment.save();

    // Recalculate remaining amount on booking
    await recalculateBookingBalance(payment.booking_id);

    // Audit logs
    await logActivity({
      action: 'PAYMENT_VERIFIED',
      entityType: 'Payment',
      entityId: payment.id,
      oldValue: { status: oldStatus },
      newValue: { status: 'verified', verified_by: req.user.id },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Payment verified successfully and booking balance adjusted', data: payment });
  } catch (error) {
    console.error('VerifyPayment error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
};

const rejectPayment = async (req, res) => {
  const { rejection_reason } = req.body;

  if (!rejection_reason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required' });
  }

  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.verification_status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject payment. Current status is ${payment.verification_status}` });
    }

    const oldStatus = payment.verification_status;
    payment.verification_status = 'rejected';
    payment.rejection_reason = rejection_reason;
    payment.verified_by = req.user.id;
    payment.verified_at = new Date();
    await payment.save();

    // Recalculate remaining amount on booking (in case a verified payment was somehow edited, though here it's from pending)
    await recalculateBookingBalance(payment.booking_id);

    // Audit logs
    await logActivity({
      action: 'PAYMENT_REJECTED',
      entityType: 'Payment',
      entityId: payment.id,
      oldValue: { status: oldStatus },
      newValue: { status: 'rejected', rejection_reason, verified_by: req.user.id },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Payment verification rejected', data: payment });
  } catch (error) {
    console.error('RejectPayment error:', error);
    return res.status(500).json({ success: false, message: 'Server error rejecting payment' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentsByBooking,
  uploadPaymentProof,
  verifyPayment,
  rejectPayment,
};
