const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  source: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['meta_ads', 'referral']],
    },
  },
  campaign_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  referral_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  assigned_to: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  destination: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  travel_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  pax_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  group_type: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      isIn: [['couple', 'family', 'friends', 'solo', 'corporate', 'mixed']],
    },
  },
  budget_per_person: {
    type: DataTypes.DECIMAL(10, 2),
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
  special_requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  best_time_to_call: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'new',
    validate: {
      isIn: [[
        'new', 'contacted', 'interested', 'hot', 'warm', 'cold', 
        'quote_sent', 'follow_up', 'booking_request', 'booked', 'lost', 'fake'
      ]],
    },
  },
  lost_reason: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  lost_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  next_followup_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  lead_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'leads',
  timestamps: true,
});

module.exports = Lead;
