const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  expense_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['meta_ads', 'staff', 'commission', 'vendor_payment', 'refund', 'software', 'misc']],
    },
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  payment_mode: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  added_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'expenses',
  timestamps: true,
});

module.exports = Expense;
