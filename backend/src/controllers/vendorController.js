const { Vendor } = require('../models');
const { logActivity } = require('../utils/activityLogger');

const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({ order: [['name', 'ASC']] });

    // Filter costs if not admin
    const sanitizedVendors = vendors.map(v => {
      const data = v.toJSON();
      if (req.user.role !== 'admin') {
        delete data.cost_per_person;
        delete data.total_cost;
      }
      return data;
    });

    return res.json({ success: true, data: sanitizedVendors });
  } catch (error) {
    console.error('GetAllVendors error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing vendors' });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const data = vendor.toJSON();
    if (req.user.role !== 'admin') {
      delete data.cost_per_person;
      delete data.total_cost;
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('GetVendorById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving vendor details' });
  }
};

const createVendor = async (req, res) => {
  const { name, contact, destination, service_type, cost_per_person, total_cost, payment_terms, notes } = req.body;

  if (!name || !service_type) {
    return res.status(400).json({ success: false, message: 'Vendor name and service type are required' });
  }

  try {
    const newVendor = await Vendor.create({
      name,
      contact,
      destination,
      service_type,
      cost_per_person: cost_per_person || null,
      total_cost: total_cost || null,
      payment_terms,
      notes,
      status: 'active',
      created_by: req.user.id,
    });

    // Audit logs
    await logActivity({
      action: 'VENDOR_CREATED',
      entityType: 'Vendor',
      entityId: newVendor.id,
      newValue: { id: newVendor.id, name, service_type },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({ success: true, message: 'Vendor created successfully', data: newVendor });
  } catch (error) {
    console.error('CreateVendor error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating vendor profile' });
  }
};

const updateVendor = async (req, res) => {
  const { name, contact, destination, service_type, cost_per_person, total_cost, payment_terms, notes } = req.body;

  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const oldVendorValues = vendor.toJSON();

    if (name) vendor.name = name;
    if (contact !== undefined) vendor.contact = contact;
    if (destination !== undefined) vendor.destination = destination;
    if (service_type) vendor.service_type = service_type;
    if (cost_per_person !== undefined) vendor.cost_per_person = cost_per_person;
    if (total_cost !== undefined) vendor.total_cost = total_cost;
    if (payment_terms !== undefined) vendor.payment_terms = payment_terms;
    if (notes !== undefined) vendor.notes = notes;

    await vendor.save();

    // Audit logs
    await logActivity({
      action: 'VENDOR_UPDATED',
      entityType: 'Vendor',
      entityId: vendor.id,
      oldValue: oldVendorValues,
      newValue: vendor.toJSON(),
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Vendor details updated successfully', data: vendor });
  } catch (error) {
    console.error('UpdateVendor error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating vendor details' });
  }
};

const toggleVendorStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Valid status is required ("active" or "inactive")' });
  }

  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const oldStatus = vendor.status;
    vendor.status = status;
    await vendor.save();

    // Audit logs
    await logActivity({
      action: 'VENDOR_STATUS_TOGGLED',
      entityType: 'Vendor',
      entityId: vendor.id,
      oldValue: { status: oldStatus },
      newValue: { status },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: `Vendor status set to ${status}`, data: vendor });
  } catch (error) {
    console.error('ToggleVendorStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating vendor status' });
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  toggleVendorStatus,
};
