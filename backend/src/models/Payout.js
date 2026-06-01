const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payout = sequelize.define('Payout', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payout_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['salary', 'commission', 'vendor_payment']],
    },
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'unpaid',
    validate: {
      isIn: [['unpaid', 'paid', 'rejected', 'hold', 'pending', 'received']],
    },
  },
  // Salary specific fields
  month: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  salary_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  commission_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  deduction_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  final_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  // Commission specific fields (destination is shared below)
  revenue_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  b2b_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  profit_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  commission_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  // Vendor payment specific fields
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  destination: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  pax_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  travel_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  package_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  b2c_rate: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  b2b_rate: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  amount_paid: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  remaining_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  // Verification fields (when paid/received)
  verified_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  verified_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  payment_mode: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'payouts',
  timestamps: true,
});

module.exports = Payout;
