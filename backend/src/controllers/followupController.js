const { FollowUp, Lead, Customer, User } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

const getFollowUpsByLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.leadId, is_deleted: false }
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This lead is not assigned to you' });
    }

    const followups = await FollowUp.findAll({
      where: { lead_id: req.params.leadId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['followup_count', 'ASC']],
    });

    return res.json({ success: true, data: followups });
  } catch (error) {
    console.error('GetFollowUpsByLead error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving follow-ups history' });
  }
};

const createFollowUp = async (req, res) => {
  const { lead_id, contact_method, followup_date, next_followup_date, notes } = req.body;

  if (!lead_id || !contact_method || !followup_date || !next_followup_date || !notes) {
    return res.status(400).json({
      success: false,
      message: 'Lead ID, contact method, followup date, next followup date, and notes are required'
    });
  }

  try {
    const lead = await Lead.findOne({ where: { id: lead_id, is_deleted: false } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This lead is not assigned to you' });
    }

    // Auto-calculate follow-up count for this lead
    const previousFollowUpsCount = await FollowUp.count({ where: { lead_id } });
    const followupCount = previousFollowUpsCount + 1;

    const newFollowUp = await FollowUp.create({
      lead_id,
      contact_method,
      followup_date,
      next_followup_date,
      notes,
      followup_count: followupCount,
      created_by: req.user.id,
    });

    // Update Lead model fields: next_followup_date & status (to follow_up if it is currently contacted/new)
    lead.next_followup_date = next_followup_date;
    if (['new', 'contacted', 'interested'].includes(lead.status)) {
      lead.status = 'follow_up';
    }
    await lead.save();

    // Audit logs
    await logActivity({
      action: 'LEAD_FOLLOWUP_ADDED',
      entityType: 'Lead',
      entityId: lead.id,
      newValue: {
        followup_id: newFollowUp.id,
        followup_count: followupCount,
        next_followup_date
      },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({ success: true, message: 'Follow-up logged successfully', data: newFollowUp });
  } catch (error) {
    console.error('CreateFollowUp error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving follow-up log' });
  }
};

const getMissedFollowUps = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const filter = {
      is_deleted: false,
      next_followup_date: { [Op.lt]: todayStr },
      status: { [Op.notIn]: ['booked', 'lost', 'fake'] }
    };

    // Access control
    if (req.user.role === 'sales_exec') {
      filter.assigned_to = req.user.id;
    } else if (req.user.role !== 'admin') {
      return res.json({ success: true, data: [] });
    }

    const missedLeads = await Lead.findAll({
      where: filter,
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name'] }
      ],
      order: [['next_followup_date', 'ASC']]
    });

    return res.json({ success: true, data: missedLeads });
  } catch (error) {
    console.error('GetMissedFollowUps error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing missed follow-ups' });
  }
};

const getTodayFollowUps = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const filter = {
      is_deleted: false,
      next_followup_date: todayStr,
      status: { [Op.notIn]: ['booked', 'lost', 'fake'] }
    };

    // Access control
    if (req.user.role === 'sales_exec') {
      filter.assigned_to = req.user.id;
    } else if (req.user.role !== 'admin') {
      return res.json({ success: true, data: [] });
    }

    const todayLeads = await Lead.findAll({
      where: filter,
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name'] }
      ],
      order: [['lead_date', 'ASC']]
    });

    return res.json({ success: true, data: todayLeads });
  } catch (error) {
    console.error('GetTodayFollowUps error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving callback schedule' });
  }
};

module.exports = {
  getFollowUpsByLead,
  createFollowUp,
  getMissedFollowUps,
  getTodayFollowUps,
};
