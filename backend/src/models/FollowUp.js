const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FollowUp = sequelize.define('FollowUp', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lead_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  contact_method: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['call', 'whatsapp', 'both']],
    },
  },
  followup_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  next_followup_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  followup_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'follow_ups',
  timestamps: true,
});

module.exports = FollowUp;
