const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Customer = require('./Customer');
const Lead = require('./Lead');
const LeadAssignment = require('./LeadAssignment');
const FollowUp = require('./FollowUp');
const Quotation = require('./Quotation');
const Booking = require('./Booking');
const Payment = require('./Payment');
const Vendor = require('./Vendor');
const BookingOperation = require('./BookingOperation');
const Commission = require('./Commission');
const Expense = require('./Expense');
const Document = require('./Document');
const DeleteRequest = require('./DeleteRequest');
const ActivityLog = require('./ActivityLog');
const VendorDestination = require('./VendorDestination');
const Payout = require('./Payout');

// Set up associations

// User relationships
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assignedLeads' });
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

User.hasMany(Lead, { foreignKey: 'created_by', as: 'createdLeads' });
Lead.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(LeadAssignment, { foreignKey: 'assigned_to', as: 'assignmentsReceived' });
LeadAssignment.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

User.hasMany(LeadAssignment, { foreignKey: 'assigned_by', as: 'assignmentsGiven' });
LeadAssignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });

// Customer <-> Lead
Customer.hasMany(Lead, { foreignKey: 'customer_id', as: 'leads' });
Lead.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// Customer <-> Booking
Customer.hasMany(Booking, { foreignKey: 'customer_id', as: 'bookings' });
Booking.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// Lead <-> LeadAssignment
Lead.hasMany(LeadAssignment, { foreignKey: 'lead_id', as: 'assignments' });
LeadAssignment.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// Lead <-> FollowUp
Lead.hasMany(FollowUp, { foreignKey: 'lead_id', as: 'followUps' });
FollowUp.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// Lead <-> Quotation
Lead.hasMany(Quotation, { foreignKey: 'lead_id', as: 'quotations' });
Quotation.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// Lead <-> Booking
Lead.hasMany(Booking, { foreignKey: 'lead_id', as: 'bookings' });
Booking.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// Booking <-> Payment
Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Booking <-> BookingOperation
Booking.hasOne(BookingOperation, { foreignKey: 'booking_id', as: 'operations' });
BookingOperation.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Vendor <-> BookingOperation
Vendor.hasMany(BookingOperation, { foreignKey: 'vendor_id', as: 'operations' });
BookingOperation.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Booking <-> Commission
Booking.hasMany(Commission, { foreignKey: 'booking_id', as: 'commissions' });
Commission.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// User <-> Commission
User.hasMany(Commission, { foreignKey: 'sales_exec_id', as: 'commissions' });
Commission.belongsTo(User, { foreignKey: 'sales_exec_id', as: 'salesExec' });

// Audit logs
User.hasMany(ActivityLog, { foreignKey: 'performed_by', as: 'logs' });
ActivityLog.belongsTo(User, { foreignKey: 'performed_by', as: 'performer' });

// --- FIX / ADDED RELATIONSHIPS ---

// User <-> Expense
User.hasMany(Expense, { foreignKey: 'added_by', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });

// User <-> FollowUp (creator)
User.hasMany(FollowUp, { foreignKey: 'created_by', as: 'followUpsCreated' });
FollowUp.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Lead <-> Payment
Lead.hasMany(Payment, { foreignKey: 'lead_id', as: 'payments' });
Payment.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// User <-> Booking (creator)
User.hasMany(Booking, { foreignKey: 'created_by', as: 'createdBookings' });
Booking.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// User <-> DeleteRequest
User.hasMany(DeleteRequest, { foreignKey: 'requested_by', as: 'deleteRequests' });
DeleteRequest.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });

// Vendor <-> VendorDestination
Vendor.hasMany(VendorDestination, { foreignKey: 'vendor_id', as: 'destinationsList' });
VendorDestination.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Payout relationships
User.hasMany(Payout, { foreignKey: 'employee_id', as: 'payouts' });
Payout.belongsTo(User, { foreignKey: 'employee_id', as: 'employee' });

User.hasMany(Payout, { foreignKey: 'verified_by', as: 'verifiedPayouts' });
Payout.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });

Vendor.hasMany(Payout, { foreignKey: 'vendor_id', as: 'payouts' });
Payout.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

module.exports = {
  sequelize,
  User,
  Customer,
  Lead,
  LeadAssignment,
  FollowUp,
  Quotation,
  Booking,
  Payment,
  Vendor,
  BookingOperation,
  Commission,
  Expense,
  Document,
  DeleteRequest,
  ActivityLog,
  VendorDestination,
  Payout,
};
