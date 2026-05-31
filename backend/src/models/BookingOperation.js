const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingOperation = sequelize.define('BookingOperation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  hotel_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  hotel_contact: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  pickup_location: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pickup_time: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  coordinator_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  coordinator_contact: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  vendor_confirmation_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  voucher_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  itinerary_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  customer_confirmation_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  operations_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  trip_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'upcoming',
    validate: {
      isIn: [['upcoming', 'ongoing', 'completed', 'cancelled']],
    },
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'booking_operations',
  timestamps: true,
});

module.exports = BookingOperation;
