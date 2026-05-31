const { ActivityLog } = require('../models');

/**
 * Logs an administrative or transactional action to the activity_logs table.
 * 
 * @param {string} action - Action description (e.g. 'LEAD_STATUS_CHANGED')
 * @param {string} entityType - Table name or entity type ('Lead', 'Booking', etc.)
 * @param {string} entityId - UUID of the modified entity
 * @param {object|null} oldValue - State snapshot prior to change
 * @param {object|null} newValue - State snapshot post change
 * @param {string} performedBy - User UUID performing the operation
 * @param {string} roleAtTime - User role performing the operation
 * @param {string|null} ipAddress - Client IP address
 */
async function logActivity({
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  performedBy,
  roleAtTime,
  ipAddress = null
}) {
  try {
    await ActivityLog.create({
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue,
      new_value: newValue,
      performed_by: performedBy,
      role_at_time: roleAtTime,
      ip_address: ipAddress,
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}

module.exports = {
  logActivity,
};
