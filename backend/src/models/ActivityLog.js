const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  old_value: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  new_value: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  performed_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  role_at_time: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: 'activity_logs',
  timestamps: true,
  updatedAt: false, // Activity logs are write-once
});

module.exports = ActivityLog;
