const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lead_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  payment_mode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['upi', 'scanner', 'bank_transfer']],
    },
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  screenshot_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  received_account: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  verification_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'verified', 'rejected']],
    },
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'payments',
  timestamps: true,
});

module.exports = Payment;
