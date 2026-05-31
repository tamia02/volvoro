const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeadAssignment = sequelize.define('LeadAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lead_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assigned_to: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assigned_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assigned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'lead_assignments',
  timestamps: false,
});

module.exports = LeadAssignment;
