const { Vendor, VendorDestination } = require('../models');
const { logActivity } = require('../utils/activityLogger');

const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      include: [
        { model: VendorDestination, as: 'destinationsList' }
      ],
      order: [['name', 'ASC']]
    });

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
    const vendor = await Vendor.findByPk(req.params.id, {
      include: [
        { model: VendorDestination, as: 'destinationsList' }
      ]
    });
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
  const {
    name,
    company_name,
    mobile_number,
    whatsapp_number,
    email,
    address,
    destinations,
    contact,
    destination,
    service_type,
    cost_per_person,
    total_cost,
    payment_terms,
    notes
  } = req.body;

  if (!name || !service_type) {
    return res.status(400).json({ success: false, message: 'Vendor name and service type are required' });
  }

  try {
    const newVendor = await Vendor.create({
      name,
      company_name: company_name || null,
      mobile_number: mobile_number || null,
      whatsapp_number: whatsapp_number || null,
      email: email || null,
      address: address || null,
      destinations: destinations || '[]',
      contact: contact || null,
      destination: destination || null,
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
  const {
    name,
    company_name,
    mobile_number,
    whatsapp_number,
    email,
    address,
    destinations,
    contact,
    destination,
    service_type,
    cost_per_person,
    total_cost,
    payment_terms,
    notes
  } = req.body;

  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const oldVendorValues = vendor.toJSON();

    if (name) vendor.name = name;
    if (company_name !== undefined) vendor.company_name = company_name || null;
    if (mobile_number !== undefined) vendor.mobile_number = mobile_number || null;
    if (whatsapp_number !== undefined) vendor.whatsapp_number = whatsapp_number || null;
    if (email !== undefined) vendor.email = email || null;
    if (address !== undefined) vendor.address = address || null;
    if (destinations !== undefined) vendor.destinations = destinations || '[]';

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

const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const oldStatus = vendor.status;
    vendor.status = 'inactive';
    await vendor.save();

    // Audit logs
    await logActivity({
      action: 'VENDOR_DELETED',
      entityType: 'Vendor',
      entityId: vendor.id,
      oldValue: { status: oldStatus },
      newValue: { status: 'inactive' },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Vendor profile deactivated/deleted successfully' });
  } catch (error) {
    console.error('DeleteVendor error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting vendor' });
  }
};

const addVendorDestinationRate = async (req, res) => {
  const { vendorId } = req.params;
  const { destination_name, double_triple_sharing_rate, quad_sharing_rate } = req.body;

  if (!destination_name) {
    return res.status(400).json({ success: false, message: 'Destination name is required' });
  }

  try {
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const [rate, created] = await VendorDestination.findOrCreate({
      where: { vendor_id: vendorId, destination_name },
      defaults: {
        double_triple_sharing_rate: parseFloat(double_triple_sharing_rate || 0),
        quad_sharing_rate: parseFloat(quad_sharing_rate || 0)
      }
    });

    if (!created) {
      rate.double_triple_sharing_rate = parseFloat(double_triple_sharing_rate || 0);
      rate.quad_sharing_rate = parseFloat(quad_sharing_rate || 0);
      await rate.save();
    }

    // Log action
    await logActivity({
      action: 'VENDOR_RATE_ADDED',
      entityType: 'VendorDestination',
      entityId: rate.id,
      newValue: rate.toJSON(),
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Destination rate saved successfully', data: rate });
  } catch (error) {
    console.error('AddVendorDestinationRate error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving destination rate' });
  }
};

const deleteVendorDestinationRate = async (req, res) => {
  try {
    const rate = await VendorDestination.findByPk(req.params.id);
    if (!rate) {
      return res.status(404).json({ success: false, message: 'Destination rate not found' });
    }

    const oldRate = rate.toJSON();
    await rate.destroy();

    // Log action
    await logActivity({
      action: 'VENDOR_RATE_DELETED',
      entityType: 'VendorDestination',
      entityId: req.params.id,
      oldValue: oldRate,
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Destination rate deleted successfully' });
  } catch (error) {
    console.error('DeleteVendorDestinationRate error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting destination rate' });
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  toggleVendorStatus,
  deleteVendor,
  addVendorDestinationRate,
  deleteVendorDestinationRate,
};
