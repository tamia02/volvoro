const { Booking, Lead, Customer, Payment, BookingOperation, User } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

const getAllBookings = async (req, res) => {
  try {
    const filter = {};

    // Filter by role
    if (req.user.role === 'sales_exec') {
      // Sales Exec can only see bookings associated with their assigned leads
      const assignedLeads = await Lead.findAll({
        where: { assigned_to: req.user.id, is_deleted: false },
        attributes: ['id']
      });
      const leadIds = assignedLeads.map(l => l.id);
      filter.lead_id = { [Op.in]: leadIds };
    } else if (req.user.role !== 'admin' && req.user.role !== 'finance' && req.user.role !== 'operations') {
      // Marketing, etc. cannot see bookings
      return res.json({ success: true, data: [] });
    }

    const bookings = await Booking.findAll({
      where: filter,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'primary_mobile', 'city'] },
        { 
          model: Lead, 
          as: 'lead', 
          attributes: ['id', 'destination', 'assigned_to'],
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name'] }] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Strip fields based on role
    const sanitizedBookings = bookings.map(b => {
      const data = b.toJSON();
      if (req.user.role === 'operations') {
        // Operations cannot see financial values
        delete data.package_amount;
        delete data.advance_amount;
        delete data.remaining_amount;
      }
      return data;
    });

    return res.json({ success: true, data: sanitizedBookings });
  } catch (error) {
    console.error('GetAllBookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing bookings' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: Lead, 
          as: 'lead',
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name'] }]
        },
        { model: Payment, as: 'payments' },
        { model: BookingOperation, as: 'operations' }
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && booking.lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This booking is not assigned to you' });
    } else if (req.user.role !== 'admin' && req.user.role !== 'finance' && req.user.role !== 'operations') {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    const data = booking.toJSON();

    // Enforce role-based field restrictions
    if (req.user.role === 'operations') {
      // Operations cannot see payment amounts, vendor cost, profit, or commission
      delete data.package_amount;
      delete data.advance_amount;
      delete data.remaining_amount;
      if (data.payments) {
        data.payments = data.payments.map(p => {
          const sanP = { ...p };
          delete sanP.amount;
          return sanP;
        });
      }
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('GetBookingById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving booking details' });
  }
};

const createBookingRequest = async (req, res) => {
  const {
    lead_id, destination, travel_date, pax_count,
    package_amount, advance_amount, pickup_location, emergency_contact, notes
  } = req.body;

  if (!lead_id || !destination || !travel_date || !package_amount || !advance_amount) {
    return res.status(400).json({
      success: false,
      message: 'Lead ID, destination, travel date, package amount, and advance amount are required'
    });
  }

  try {
    const lead = await Lead.findOne({ where: { id: lead_id, is_deleted: false } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This lead is not assigned to you' });
    }

    const numPackageAmount = parseFloat(package_amount);
    const numAdvanceAmount = parseFloat(advance_amount);
    const numRemainingAmount = numPackageAmount - numAdvanceAmount;

    if (isNaN(numPackageAmount) || isNaN(numAdvanceAmount)) {
      return res.status(400).json({ success: false, message: 'Package and advance amounts must be valid numbers' });
    }

    const newBooking = await Booking.create({
      lead_id,
      customer_id: lead.customer_id,
      destination,
      travel_date,
      pax_count: pax_count || lead.pax_count,
      package_amount: numPackageAmount,
      advance_amount: numAdvanceAmount,
      remaining_amount: numRemainingAmount,
      pickup_location,
      emergency_contact,
      notes,
      status: 'pending',
      created_by: req.user.id,
    });

    // Update lead status to booking_request
    lead.status = 'booking_request';
    await lead.save();

    // Audit logs
    await logActivity({
      action: 'BOOKING_REQUESTED',
      entityType: 'Booking',
      entityId: newBooking.id,
      newValue: {
        id: newBooking.id,
        lead_id,
        package_amount: numPackageAmount,
        status: 'pending'
      },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({ success: true, message: 'Booking request raised successfully', data: newBooking });
  } catch (error) {
    console.error('CreateBookingRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error raising booking request' });
  }
};

const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Booking is already approved' });
    }

    // CHECK payment requirement: At least one payment must be verified
    const verifiedPaymentCount = await Payment.count({
      where: {
        booking_id: booking.id,
        verification_status: 'verified'
      }
    });

    if (verifiedPaymentCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking approval blocked: At least one verified payment record is required'
      });
    }

    // Approve booking
    booking.status = 'approved';
    booking.approved_by = req.user.id;
    booking.approved_at = new Date();
    await booking.save();

    // Auto-update lead status to booked
    const lead = await Lead.findByPk(booking.lead_id);
    if (lead) {
      lead.status = 'booked';
      await lead.save();
    }

    // Auto-update Customer aggregates
    const customer = await Customer.findByPk(booking.customer_id);
    if (customer) {
      customer.total_bookings += 1;
      customer.total_revenue = parseFloat(customer.total_revenue) + parseFloat(booking.package_amount);
      customer.last_trip_date = booking.travel_date;
      await customer.save();
    }

    // Auto-create BookingOperation entry if it doesn't already exist
    const [operation, created] = await BookingOperation.findOrCreate({
      where: { booking_id: booking.id },
      defaults: {
        booking_id: booking.id,
        trip_status: 'upcoming',
        voucher_sent: false,
        itinerary_sent: false,
        customer_confirmation_sent: true,
      }
    });

    if (!created) {
      operation.customer_confirmation_sent = true;
      await operation.save();
    }

    // Audit log
    await logActivity({
      action: 'BOOKING_APPROVED',
      entityType: 'Booking',
      entityId: booking.id,
      newValue: { status: 'approved', approved_by: req.user.id },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({
      success: true,
      message: 'Booking approved successfully. Customer statistics updated and operations file created.',
      data: booking
    });
  } catch (error) {
    console.error('ApproveBooking error:', error);
    return res.status(500).json({ success: false, message: 'Server error approving booking' });
  }
};

const rejectBooking = async (req, res) => {
  const { rejected_reason } = req.body;

  if (!rejected_reason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is mandatory' });
  }

  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject booking. Current status is ${booking.status}` });
    }

    booking.status = 'rejected';
    booking.rejected_reason = rejected_reason;
    await booking.save();

    // Auto-update lead status back to interested/quote_sent or booking_request? Let's reset it to interested/quote_sent
    const lead = await Lead.findByPk(booking.lead_id);
    if (lead) {
      lead.status = 'interested'; // reset back
      await lead.save();
    }

    // Audit log
    await logActivity({
      action: 'BOOKING_REJECTED',
      entityType: 'Booking',
      entityId: booking.id,
      newValue: { status: 'rejected', rejected_reason },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Booking request rejected', data: booking });
  } catch (error) {
    console.error('RejectBooking error:', error);
    return res.status(500).json({ success: false, message: 'Server error rejecting booking' });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBookingRequest,
  approveBooking,
  rejectBooking,
};
