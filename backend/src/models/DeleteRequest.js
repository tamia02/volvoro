const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeleteRequest = sequelize.define('DeleteRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected']],
    },
  },
  requested_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reviewed_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'delete_requests',
  timestamps: true,
});

module.exports = DeleteRequest;
