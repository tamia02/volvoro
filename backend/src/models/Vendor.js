const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  destination: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  service_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['hotel', 'transport', 'full_package', 'activity']],
    },
  },
  cost_per_person: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  payment_terms: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']],
    },
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'vendors',
  timestamps: true,
});

module.exports = Vendor;
