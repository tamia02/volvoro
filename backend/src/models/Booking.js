const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lead_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  travel_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  pax_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  package_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  advance_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  remaining_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  pickup_location: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emergency_contact: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'cancelled']],
    },
  },
  rejected_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'bookings',
  timestamps: true,
});

module.exports = Booking;
