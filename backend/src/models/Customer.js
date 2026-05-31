const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  primary_mobile: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
  },
  alternate_mobile: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  total_enquiries: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_bookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_revenue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.0,
  },
  last_trip_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'customers',
  timestamps: true,
});

module.exports = Customer;
