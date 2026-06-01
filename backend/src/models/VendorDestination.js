const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VendorDestination = sequelize.define('VendorDestination', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  destination_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  double_triple_sharing_rate: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  quad_sharing_rate: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
}, {
  tableName: 'vendor_destinations',
  timestamps: true,
});

module.exports = VendorDestination;
