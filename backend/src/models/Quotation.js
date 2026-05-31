const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quotation = sequelize.define('Quotation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lead_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  pickup_city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  hotel_category: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  meal_plan: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  transport_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  selling_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  advance_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  balance_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  inclusions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  exclusions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancellation_terms: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'sent', 'accepted', 'rejected']],
    },
  },
  sent_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'quotations',
  timestamps: true,
});

module.exports = Quotation;
