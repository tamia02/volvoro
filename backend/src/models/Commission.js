const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commission = sequelize.define('Commission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  sales_exec_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  net_profit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  commission_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  commission_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  trip_completed_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'payable', 'approved', 'paid', 'hold']],
    },
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paid_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  payment_reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'commissions',
  timestamps: true,
});

module.exports = Commission;
