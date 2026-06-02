const { BookingOperation, Booking, Vendor, Commission, User, Lead, Customer } = require('../models');
const { logActivity } = require('../utils/activityLogger');

const getOperationsBookings = async (req, res) => {
  try {
    const opsFiles = await BookingOperation.findAll({
      include: [
        {
          model: Booking,
          as: 'booking',
          where: { status: 'approved' },
          include: [
            { model: Customer, as: 'customer', attributes: ['id', 'name', 'primary_mobile', 'city'] },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { 
              model: Lead, 
              as: 'lead',
              attributes: ['id', 'destination', 'assigned_to'],
              include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name'] }]
            }
          ]
        },
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'contact'] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    return res.json({ success: true, data: opsFiles });
  } catch (error) {
    console.error('GetOperationsBookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing operations bookings' });
  }
};

const getOperationsBookingById = async (req, res) => {
  try {
    const opsFile = await BookingOperation.findByPk(req.params.id, {
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            { model: Customer, as: 'customer', attributes: ['id', 'name', 'primary_mobile', 'city'] },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { 
              model: Lead, 
              as: 'lead',
              include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name'] }]
            }
          ]
        },
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'contact'] }
      ]
    });

    if (!opsFile) {
      return res.status(404).json({ success: false, message: 'Operations detail not found' });
    }

    return res.json({ success: true, data: opsFile });
  } catch (error) {
    console.error('GetOperationsBookingById error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching operations booking details' });
  }
};

const updateOperationsBooking = async (req, res) => {
  const {
    vendor_id, hotel_name, hotel_contact, pickup_location, pickup_time,
    coordinator_name, coordinator_contact, vendor_confirmation_url,
    voucher_sent, itinerary_sent, customer_confirmation_sent, operations_notes
  } = req.body;

  try {
    const opsFile = await BookingOperation.findByPk(req.params.id, {
      include: [{ model: Booking, as: 'booking' }]
    });

    if (!opsFile) {
      return res.status(404).json({ success: false, message: 'Operations file not found' });
    }

    const oldOpsValues = opsFile.toJSON();

    if (vendor_id !== undefined) opsFile.vendor_id = vendor_id || null;
    if (hotel_name !== undefined) opsFile.hotel_name = hotel_name || null;
    if (hotel_contact !== undefined) opsFile.hotel_contact = hotel_contact || null;
    if (pickup_location !== undefined) opsFile.pickup_location = pickup_location || null;
    if (pickup_time !== undefined) opsFile.pickup_time = pickup_time || null;
    if (coordinator_name !== undefined) opsFile.coordinator_name = coordinator_name || null;
    if (coordinator_contact !== undefined) opsFile.coordinator_contact = coordinator_contact || null;
    if (vendor_confirmation_url !== undefined) opsFile.vendor_confirmation_url = vendor_confirmation_url || null;
    if (voucher_sent !== undefined) opsFile.voucher_sent = voucher_sent;
    if (itinerary_sent !== undefined) opsFile.itinerary_sent = itinerary_sent;
    if (customer_confirmation_sent !== undefined) opsFile.customer_confirmation_sent = customer_confirmation_sent;
    if (operations_notes !== undefined) opsFile.operations_notes = operations_notes || null;

    opsFile.updated_by = req.user.id;
    await opsFile.save();

    // Audit logs
    await logActivity({
      action: 'OPERATIONS_FILE_UPDATED',
      entityType: 'BookingOperation',
      entityId: opsFile.id,
      oldValue: oldOpsValues,
      newValue: opsFile.toJSON(),
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Operations file updated successfully', data: opsFile });
  } catch (error) {
    console.error('UpdateOperationsBooking error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating operations file' });
  }
};

const updateTripStatus = async (req, res) => {
  const { trip_status } = req.body;

  if (!trip_status || !['upcoming', 'ongoing', 'completed', 'cancelled'].includes(trip_status)) {
    return res.status(400).json({ success: false, message: 'Valid trip status is required' });
  }

  try {
    const opsFile = await BookingOperation.findByPk(req.params.id, {
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [{ model: Lead, as: 'lead' }]
        },
        { model: Vendor, as: 'vendor' }
      ]
    });

    if (!opsFile) {
      return res.status(404).json({ success: false, message: 'Operations file not found' });
    }

    const oldStatus = opsFile.trip_status;
    opsFile.trip_status = trip_status;
    opsFile.updated_by = req.user.id;
    await opsFile.save();

    // Side effect: Completed Trip -> Create Commission
    if (trip_status === 'completed' && oldStatus !== 'completed') {
      const booking = opsFile.booking;
      const salesExecId = booking.lead.assigned_to;

      if (salesExecId) {
        // Calculate net profit
        const packageAmount = parseFloat(booking.package_amount);
        const vendorCost = opsFile.vendor ? parseFloat(opsFile.vendor.total_cost || 0) : 0;
        
        // Net profit calculation
        const netProfit = packageAmount - vendorCost; // Default expenses assumed 0, can edit in commissions approval
        const commissionPercentage = 10.00; // Default commission percentage 10%
        const commissionAmount = netProfit * (commissionPercentage / 100);

        // Check if commission record already exists
        const existingCommission = await Commission.findOne({
          where: { booking_id: booking.id, sales_exec_id: salesExecId }
        });

        if (!existingCommission) {
          await Commission.create({
            booking_id: booking.id,
            sales_exec_id: salesExecId,
            net_profit: netProfit,
            commission_percentage: commissionPercentage,
            commission_amount: commissionAmount,
            trip_completed_date: new Date().toISOString().split('T')[0],
            status: 'payable', // Payable upon trip completion
          });
        }
      }
    }

    // Audit logs
    await logActivity({
      action: 'TRIP_STATUS_CHANGED',
      entityType: 'BookingOperation',
      entityId: opsFile.id,
      oldValue: { trip_status: oldStatus },
      newValue: { trip_status },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: `Trip status updated to ${trip_status}`, data: opsFile });
  } catch (error) {
    console.error('UpdateTripStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating trip status' });
  }
};

module.exports = {
  getOperationsBookings,
  getOperationsBookingById,
  updateOperationsBooking,
  updateTripStatus,
};
