const { DeleteRequest, ActivityLog, Lead, Booking, Payment, Vendor, BookingOperation, Commission, Expense, Customer, User } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

// Dashboard statistics
const getAdminDashboard = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Leads count
    const totalLeads = await Lead.count({ where: { is_deleted: false } });
    const todayLeads = await Lead.count({
      where: {
        is_deleted: false,
        lead_date: { [Op.gte]: todayStart }
      }
    });
    const hotLeads = await Lead.count({ where: { status: 'hot', is_deleted: false } });

    // Follow-ups
    const todayStr = new Date().toISOString().split('T')[0];
    const pendingFollowups = await Lead.count({
      where: {
        is_deleted: false,
        next_followup_date: todayStr,
        status: { [Op.notIn]: ['booked', 'lost', 'fake'] }
      }
    });
    const missedFollowups = await Lead.count({
      where: {
        is_deleted: false,
        next_followup_date: { [Op.lt]: todayStr },
        status: { [Op.notIn]: ['booked', 'lost', 'fake'] }
      }
    });

    // Bookings & Payments
    const bookingRequestsPending = await Booking.count({ where: { status: 'pending' } });
    const paymentsPendingVerification = await Payment.count({ where: { verification_status: 'pending' } });
    const totalBookings = await Booking.count({ where: { status: 'approved' } });

    // Revenue
    const todayPayments = await Payment.findAll({
      where: {
        verification_status: 'verified',
        payment_date: todayStr
      }
    });
    const todayRevenue = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const monthPayments = await Payment.findAll({
      where: {
        verification_status: 'verified',
        payment_date: { [Op.gte]: monthStart.toISOString().split('T')[0] }
      }
    });
    const monthlyRevenue = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Profit calculation: package_amount - vendor_cost from approved bookings
    const approvedBookings = await Booking.findAll({
      where: { status: 'approved' }
    });

    let totalRevenue = 0;
    let totalVendorCost = 0;

    for (const b of approvedBookings) {
      totalRevenue += parseFloat(b.package_amount);
      const ops = await b.getOperations({ include: [{ model: Vendor, as: 'vendor' }] });
      if (ops && ops.vendor) {
        totalVendorCost += parseFloat(ops.vendor.total_cost || 0);
      }
    }

    const totalProfit = totalRevenue - totalVendorCost;

    // Pending system alerts
    const pendingVendorConfirmations = await BookingOperation.count({
      where: { trip_status: 'upcoming', voucher_sent: false }
    });

    const deleteRequestsPending = await DeleteRequest.count({ where: { status: 'pending' } });

    // Performance leaderboard (Top 3 sales executives)
    const salespersons = await User.findAll({ where: { role: 'sales_exec', status: 'active' } });
    const leaderboard = [];
    for (const s of salespersons) {
      const bookedCount = await Lead.count({ where: { assigned_to: s.id, status: 'booked', is_deleted: false } });
      const totalCount = await Lead.count({ where: { assigned_to: s.id, is_deleted: false } });
      const convRate = totalCount > 0 ? ((bookedCount / totalCount) * 100).toFixed(1) : '0.0';
      leaderboard.push({ name: s.name, count: bookedCount, rate: convRate });
    }
    leaderboard.sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      data: {
        total_leads: totalLeads,
        today_leads: todayLeads,
        hot_leads: hotLeads,
        pending_followups: pendingFollowups,
        missed_followups: missedFollowups,
        booking_requests_pending: bookingRequestsPending,
        payments_pending_verification: paymentsPendingVerification,
        total_bookings: totalBookings,
        today_revenue: todayRevenue,
        monthly_revenue: monthlyRevenue,
        total_profit: totalProfit,
        pending_vendor_confirmations: pendingVendorConfirmations,
        delete_requests_pending: deleteRequestsPending,
        leaderboard: leaderboard.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('GetAdminDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin statistics' });
  }
};

const getSalesDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const myLeads = await Lead.count({ where: { assigned_to: userId, is_deleted: false } });
    const myHotLeads = await Lead.count({ where: { assigned_to: userId, status: 'hot', is_deleted: false } });
    const myFollowupsToday = await Lead.count({
      where: {
        assigned_to: userId,
        next_followup_date: todayStr,
        is_deleted: false,
        status: { [Op.notIn]: ['booked', 'lost', 'fake'] }
      }
    });
    const myMissedFollowups = await Lead.count({
      where: {
        assigned_to: userId,
        next_followup_date: { [Op.lt]: todayStr },
        is_deleted: false,
        status: { [Op.notIn]: ['booked', 'lost', 'fake'] }
      }
    });

    const myBookingsCount = await Booking.count({
      include: [{
        model: Lead,
        as: 'lead',
        where: { assigned_to: userId, is_deleted: false }
      }]
    });

    const myBookings = await Booking.findAll({
      where: { status: 'approved' },
      include: [{
        model: Lead,
        as: 'lead',
        where: { assigned_to: userId, is_deleted: false }
      }]
    });
    const myRevenue = myBookings.reduce((sum, b) => sum + parseFloat(b.package_amount), 0);

    const pendingCommissions = await Commission.findAll({ where: { sales_exec_id: userId, status: 'payable' } });
    const myCommissionPending = pendingCommissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

    const paidCommissions = await Commission.findAll({ where: { sales_exec_id: userId, status: 'paid' } });
    const myCommissionPaid = paidCommissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

    return res.json({
      success: true,
      data: {
        my_leads: myLeads,
        my_hot_leads: myHotLeads,
        my_followups_today: myFollowupsToday,
        my_missed_followups: myMissedFollowups,
        my_bookings: myBookingsCount,
        my_revenue: myRevenue,
        my_commission_pending: myCommissionPending,
        my_commission_paid: myCommissionPaid
      }
    });
  } catch (error) {
    console.error('GetSalesDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error compiling sales metrics' });
  }
};

const getFinanceDashboard = async (req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const paymentsPendingVerification = await Payment.count({ where: { verification_status: 'pending' } });
    
    const verifiedPayments = await Payment.findAll({ where: { verification_status: 'verified' } });
    const verifiedPaymentsTotal = verifiedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const pendingComms = await Commission.findAll({ where: { status: 'payable' } });
    const commissionsPending = pendingComms.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

    const paidComms = await Commission.findAll({ where: { status: 'paid' } });
    const commissionsPaid = paidComms.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

    const expensesMonth = await Expense.findAll({
      where: {
        expense_date: { [Op.gte]: monthStart.toISOString().split('T')[0] }
      }
    });
    const totalExpensesMonth = expensesMonth.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return res.json({
      success: true,
      data: {
        payments_pending_verification: paymentsPendingVerification,
        verified_payments_total: verifiedPaymentsTotal,
        commissions_pending: commissionsPending,
        commissions_paid: commissionsPaid,
        total_expenses_month: totalExpensesMonth
      }
    });
  } catch (error) {
    console.error('GetFinanceDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving finance analytics' });
  }
};

const getOperationsDashboard = async (req, res) => {
  try {
    const upcomingTrips = await BookingOperation.count({ where: { trip_status: 'upcoming' } });
    const ongoingTrips = await BookingOperation.count({ where: { trip_status: 'ongoing' } });
    const completedTrips = await BookingOperation.count({ where: { trip_status: 'completed' } });

    const pendingVendorConfirmations = await BookingOperation.count({
      where: { trip_status: 'upcoming', vendor_confirmation_url: null }
    });

    const vouchersToSend = await BookingOperation.count({
      where: { trip_status: 'upcoming', voucher_sent: false }
    });

    const itinerariesToSend = await BookingOperation.count({
      where: { trip_status: 'upcoming', itinerary_sent: false }
    });

    return res.json({
      success: true,
      data: {
        upcoming_trips: upcomingTrips,
        ongoing_trips: ongoingTrips,
        completed_trips: completedTrips,
        pending_vendor_confirmations: pendingVendorConfirmations,
        vouchers_to_send: vouchersToSend,
        itineraries_to_send: itinerariesToSend
      }
    });
  } catch (error) {
    console.error('GetOperationsDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error compiling logistics metrics' });
  }
};

const getMarketingDashboard = async (req, res) => {
  try {
    const totalLeads = await Lead.count({ where: { is_deleted: false } });
    const bookedLeads = await Lead.count({ where: { status: 'booked', is_deleted: false } });
    const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(2) : '0.00';

    // Group counts
    const leads = await Lead.findAll({ where: { is_deleted: false } });
    const sourceStats = {};
    leads.forEach(l => {
      sourceStats[l.source] = (sourceStats[l.source] || 0) + 1;
    });

    return res.json({
      success: true,
      data: {
        total_leads: totalLeads,
        booked_leads: bookedLeads,
        conversion_rate: conversionRate,
        leads_by_source: sourceStats
      }
    });
  } catch (error) {
    console.error('GetMarketingDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving marketing reports' });
  }
};

// System Delete Requests Management
const getDeleteRequests = async (req, res) => {
  try {
    const tickets = await DeleteRequest.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'requester', attributes: ['id', 'name', 'role'], association: new User.hasMany(DeleteRequest, { foreignKey: 'requested_by', as: 'requestsRaised' }).association }],
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, data: tickets });
  } catch (error) {
    console.error('GetDeleteRequests error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing delete requests' });
  }
};

const approveDeleteRequest = async (req, res) => {
  try {
    const ticket = await DeleteRequest.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Delete request ticket not found' });
    }

    if (ticket.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot approve ticket. Current status is ${ticket.status}` });
    }

    // Execute Soft Delete on target table
    const entityType = ticket.entity_type;
    const entityId = ticket.entity_id;

    if (entityType === 'lead') {
      const lead = await Lead.findByPk(entityId);
      if (lead) {
        lead.is_deleted = true;
        await lead.save();
      }
    } else {
      return res.status(400).json({ success: false, message: `Soft delete logic for '${entityType}' is not implemented` });
    }

    ticket.status = 'approved';
    ticket.reviewed_by = req.user.id;
    ticket.reviewed_at = new Date();
    await ticket.save();

    // Log deletion approval in activity log
    await logActivity({
      action: `LEAD_DELETED_APPROVED`,
      entityType: 'Lead',
      entityId: entityId,
      newValue: { delete_request_id: ticket.id, status: 'approved' },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Delete request approved and item soft-deleted', data: ticket });
  } catch (error) {
    console.error('ApproveDeleteRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error approving delete request' });
  }
};

const rejectDeleteRequest = async (req, res) => {
  try {
    const ticket = await DeleteRequest.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Delete request ticket not found' });
    }

    if (ticket.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject ticket. Current status is ${ticket.status}` });
    }

    ticket.status = 'rejected';
    ticket.reviewed_by = req.user.id;
    ticket.reviewed_at = new Date();
    await ticket.save();

    // Log deletion rejection in activity log
    await logActivity({
      action: `LEAD_DELETE_REJECTED`,
      entityType: 'Lead',
      entityId: ticket.entity_id,
      newValue: { delete_request_id: ticket.id, status: 'rejected' },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Delete request rejected', data: ticket });
  } catch (error) {
    console.error('RejectDeleteRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error rejecting delete request' });
  }
};

// Activity logs history
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [{ model: User, as: 'performer', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: 100 // Cap to prevent large payloads
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error('GetActivityLogs error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving activity logs' });
  }
};

module.exports = {
  getAdminDashboard,
  getSalesDashboard,
  getFinanceDashboard,
  getOperationsDashboard,
  getMarketingDashboard,
  getDeleteRequests,
  approveDeleteRequest,
  rejectDeleteRequest,
  getActivityLogs,
};
