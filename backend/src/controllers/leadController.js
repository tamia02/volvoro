const { Lead, Customer, User, LeadAssignment, DeleteRequest } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

const getAllLeads = async (req, res) => {
  try {
    const { status, source, assigned_to, startDate, endDate } = req.query;
    const filter = { is_deleted: false };

    // Role-based restrictions
    if (req.user.role === 'sales_exec') {
      filter.assigned_to = req.user.id;
    } else if (req.user.role !== 'admin' && req.user.role !== 'marketing') {
      // Finance, Operations see no leads by default
      return res.json({ success: true, data: [] });
    }

    // Apply queries
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (assigned_to && req.user.role === 'admin') filter.assigned_to = assigned_to;

    if (startDate && endDate) {
      filter.lead_date = {
        [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999Z')],
      };
    }

    const leads = await Lead.findAll({
      where: filter,
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'mobile', 'role'] }
      ],
      order: [['lead_date', 'DESC']],
    });

    return res.json({ success: true, data: leads });
  } catch (error) {
    console.error('GetAllLeads error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing leads' });
  }
};

const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, is_deleted: false },
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'mobile', 'role'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This lead is not assigned to you' });
    }

    return res.json({ success: true, data: lead });
  } catch (error) {
    console.error('GetLeadById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving lead details' });
  }
};

const createLead = async (req, res) => {
  const {
    primary_mobile, alternate_mobile, name, city, notes, // Customer attributes
    source, campaign_name, referral_name, assigned_to,
    destination, travel_date, pax_count, group_type,
    budget_per_person, pickup_city, hotel_category, meal_plan,
    special_requirements, best_time_to_call
  } = req.body;

  if (!primary_mobile || !name || !destination || !source) {
    return res.status(400).json({ success: false, message: 'Primary mobile, customer name, destination, and source are required' });
  }

  try {
    // 1. Look up or create Customer
    let customer = await Customer.findOne({ where: { primary_mobile } });
    const isNewCustomer = !customer;

    if (customer) {
      // Existing customer, increment enquiries
      customer.total_enquiries += 1;
      if (name) customer.name = name; // Update name if provided
      if (city) customer.city = city;
      if (alternate_mobile) customer.alternate_mobile = alternate_mobile;
      if (notes) customer.notes = notes;
      await customer.save();
    } else {
      // New customer
      customer = await Customer.create({
        primary_mobile,
        alternate_mobile,
        name,
        city,
        notes,
        total_enquiries: 1,
      });
    }

    const finalAssignedTo = req.user.role === 'sales_exec' ? req.user.id : (assigned_to || null);

    // 2. Create Lead
    const newLead = await Lead.create({
      customer_id: customer.id,
      source,
      campaign_name,
      referral_name,
      assigned_to: finalAssignedTo,
      destination,
      travel_date: travel_date || null,
      pax_count: pax_count || 1,
      group_type,
      budget_per_person,
      pickup_city,
      hotel_category,
      meal_plan,
      special_requirements,
      best_time_to_call,
      status: 'new',
      created_by: req.user.id,
    });

    // 3. Log lead assignment history if pre-assigned or auto-assigned
    if (finalAssignedTo) {
      await LeadAssignment.create({
        lead_id: newLead.id,
        assigned_to: finalAssignedTo,
        assigned_by: req.user.id,
        notes: req.user.role === 'sales_exec' ? 'Auto-assigned to creator Sales Executive' : 'Initial assignment upon lead creation',
      });
    }

    // Audit logs
    await logActivity({
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: newLead.id,
      newValue: {
        id: newLead.id,
        customer_id: customer.id,
        destination,
        assigned_to: finalAssignedTo,
        status: 'new'
      },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: {
        lead: newLead,
        customer,
        isNewCustomer
      }
    });
  } catch (error) {
    console.error('CreateLead error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating lead' });
  }
};

const updateLead = async (req, res) => {
  const {
    name, city, notes, alternate_mobile, primary_mobile, // customer attributes
    destination, travel_date, pax_count, group_type,
    budget_per_person, pickup_city, hotel_category, meal_plan,
    special_requirements, best_time_to_call
  } = req.body;

  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, is_deleted: false },
      include: [{ model: Customer, as: 'customer' }]
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This lead is not assigned to you' });
    }

    const oldLeadValues = lead.toJSON();

    // 1. Update customer attributes (Sales Exec cannot edit primary mobile)
    const customer = lead.customer;
    if (customer) {
      if (name) customer.name = name;
      if (city) customer.city = city;
      if (notes) customer.notes = notes;
      if (alternate_mobile) customer.alternate_mobile = alternate_mobile;

      if (primary_mobile && primary_mobile !== customer.primary_mobile) {
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Permission denied: Sales Executives cannot modify the customer primary mobile number'
          });
        }
        // Verify unique constraint
        const duplicateCustomer = await Customer.findOne({ where: { primary_mobile } });
        if (duplicateCustomer && duplicateCustomer.id !== customer.id) {
          return res.status(400).json({ success: false, message: 'Mobile number belongs to another customer record' });
        }
        customer.primary_mobile = primary_mobile;
      }
      await customer.save();
    }

    // 2. Update lead attributes
    if (destination) lead.destination = destination;
    if (travel_date !== undefined) lead.travel_date = travel_date || null;
    if (pax_count !== undefined) lead.pax_count = pax_count;
    if (group_type !== undefined) lead.group_type = group_type || null;
    if (budget_per_person !== undefined) lead.budget_per_person = budget_per_person || null;
    if (pickup_city !== undefined) lead.pickup_city = pickup_city || null;
    if (hotel_category !== undefined) lead.hotel_category = hotel_category || null;
    if (meal_plan !== undefined) lead.meal_plan = meal_plan || null;
    if (special_requirements !== undefined) lead.special_requirements = special_requirements || null;
    if (best_time_to_call !== undefined) lead.best_time_to_call = best_time_to_call || null;

    await lead.save();

    // Audit logs
    await logActivity({
      action: 'LEAD_UPDATED',
      entityType: 'Lead',
      entityId: lead.id,
      oldValue: oldLeadValues,
      newValue: lead.toJSON(),
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Lead updated successfully', data: lead });
  } catch (error) {
    console.error('UpdateLead error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating lead' });
  }
};

const updateLeadStatus = async (req, res) => {
  const { status, lost_reason, lost_note } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  // Validate Lost reason constraint
  if (status === 'lost' && !lost_reason) {
    return res.status(400).json({ success: false, message: 'Lost reason is mandatory when status is changed to "lost"' });
  }

  try {
    const lead = await Lead.findOne({ where: { id: req.params.id, is_deleted: false } });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This lead is not assigned to you' });
    }

    const oldStatus = lead.status;
    lead.status = status;
    if (status === 'lost') {
      lead.lost_reason = lost_reason;
      lead.lost_note = lost_note || null;
    } else {
      // Clear lost reasons if recovered
      lead.lost_reason = null;
      lead.lost_note = null;
    }

    await lead.save();

    // Audit log
    await logActivity({
      action: 'LEAD_STATUS_CHANGED',
      entityType: 'Lead',
      entityId: lead.id,
      oldValue: { status: oldStatus },
      newValue: { status, lost_reason, lost_note },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: `Lead status updated to ${status}`, data: lead });
  } catch (error) {
    console.error('UpdateLeadStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating lead status' });
  }
};

const assignLead = async (req, res) => {
  const { assigned_to, notes } = req.body;

  if (!assigned_to) {
    return res.status(400).json({ success: false, message: 'Sales Executive ID is required' });
  }

  try {
    const lead = await Lead.findOne({ where: { id: req.params.id, is_deleted: false } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Confirm that the assigned user exists and has sales_exec role
    const assignedUser = await User.findByPk(assigned_to);
    if (!assignedUser || assignedUser.role !== 'sales_exec') {
      return res.status(400).json({ success: false, message: 'Invalid target user: Assignment target must be a Sales Executive' });
    }

    const oldAssignedTo = lead.assigned_to;
    lead.assigned_to = assigned_to;
    await lead.save();

    // Write to assignment history table
    await LeadAssignment.create({
      lead_id: lead.id,
      assigned_to,
      assigned_by: req.user.id,
      notes: notes || 'Lead reassigned by Admin',
    });

    // Audit Log
    await logActivity({
      action: 'LEAD_ASSIGNED',
      entityType: 'Lead',
      entityId: lead.id,
      oldValue: { assigned_to: oldAssignedTo },
      newValue: { assigned_to },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: `Lead successfully assigned to ${assignedUser.name}`, data: lead });
  } catch (error) {
    console.error('AssignLead error:', error);
    return res.status(500).json({ success: false, message: 'Server error reassigning lead' });
  }
};

const bulkImportLeads = async (req, res) => {
  // Simulating a CSV bulk upload parser. Accepts JSON array in body representing records.
  const { leads } = req.body;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ success: false, message: 'A valid non-empty array of lead objects is required' });
  }

  try {
    let successCount = 0;
    let skipCount = 0;

    for (const record of leads) {
      const { name, primary_mobile, destination, source, travel_date, pax_count } = record;

      if (!name || !primary_mobile || !destination || !source) {
        skipCount++;
        continue;
      }

      // Look up or create Customer
      let customer = await Customer.findOne({ where: { primary_mobile } });
      if (customer) {
        customer.total_enquiries += 1;
        await customer.save();
      } else {
        customer = await Customer.create({
          name,
          primary_mobile,
          total_enquiries: 1,
        });
      }

      // Create lead
      await Lead.create({
        customer_id: customer.id,
        source,
        destination,
        travel_date: travel_date || null,
        pax_count: pax_count || 1,
        status: 'new',
        created_by: req.user.id,
      });

      successCount++;
    }

    await logActivity({
      action: 'LEADS_BULK_IMPORTED',
      entityType: 'Lead',
      entityId: req.user.id, // Linked to the importer user ID
      newValue: { successCount, skipCount },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({
      success: true,
      message: `Bulk import completed. Imported: ${successCount}, Skipped: ${skipCount}`,
      data: { successCount, skipCount }
    });
  } catch (error) {
    console.error('BulkImportLeads error:', error);
    return res.status(500).json({ success: false, message: 'Server error bulk-importing CSV data' });
  }
};

const raiseDeleteRequest = async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Reason for deletion is mandatory' });
  }

  try {
    const lead = await Lead.findOne({ where: { id: req.params.id, is_deleted: false } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or already deleted' });
    }

    // Check if duplicate request already exists for this lead
    const existingRequest = await DeleteRequest.findOne({
      where: { entity_type: 'lead', entity_id: lead.id, status: 'pending' }
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'A pending delete request already exists for this lead' });
    }

    const deleteTicket = await DeleteRequest.create({
      entity_type: 'lead',
      entity_id: lead.id,
      reason,
      status: 'pending',
      requested_by: req.user.id,
    });

    // Audit Log
    await logActivity({
      action: 'LEAD_DELETE_REQUESTED',
      entityType: 'Lead',
      entityId: lead.id,
      newValue: { delete_request_id: deleteTicket.id, reason },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Deletion request submitted for Admin review',
      data: deleteTicket
    });
  } catch (error) {
    console.error('RaiseDeleteRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting delete request' });
  }
};

const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ where: { id: req.params.id, is_deleted: false } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or already deleted' });
    }

    lead.is_deleted = true;
    await lead.save();

    // Audit Log
    await logActivity({
      action: 'LEAD_DELETED',
      entityType: 'Lead',
      entityId: lead.id,
      newValue: { status: 'deleted' },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Lead successfully deleted' });
  } catch (error) {
    console.error('DeleteLead error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting lead' });
  }
};

module.exports = {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  bulkImportLeads,
  raiseDeleteRequest,
  deleteLead,
};
