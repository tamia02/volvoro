const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  entity_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['booking', 'lead', 'payment', 'vendor', 'customer']],
    },
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  doc_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['payment_screenshot', 'id_proof', 'itinerary', 'voucher', 'vendor_confirm', 'invoice']],
    },
  },
  file_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'documents',
  timestamps: true,
});

module.exports = Document;
