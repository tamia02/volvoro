const { Quotation, Lead, Customer, User } = require('../models');
const { logActivity } = require('../utils/activityLogger');

const getQuotesByLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ where: { id: req.params.leadId, is_deleted: false } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This lead is not assigned to you' });
    }

    const quotes = await Quotation.findAll({
      where: { lead_id: req.params.leadId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: quotes });
  } catch (error) {
    console.error('GetQuotesByLead error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing quotations' });
  }
};

const createQuote = async (req, res) => {
  const {
    lead_id, destination, duration, pickup_city, hotel_category,
    meal_plan, transport_type, selling_price, advance_amount,
    inclusions, exclusions, cancellation_terms, status
  } = req.body;

  if (!lead_id || !destination || selling_price === undefined || advance_amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Lead ID, destination, selling price, and advance amount are required'
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

    const numSellingPrice = parseFloat(selling_price);
    const numAdvanceAmount = parseFloat(advance_amount);
    const numBalanceAmount = numSellingPrice - numAdvanceAmount;

    if (isNaN(numSellingPrice) || isNaN(numAdvanceAmount)) {
      return res.status(400).json({ success: false, message: 'Selling price and advance amount must be valid numbers' });
    }

    const newQuote = await Quotation.create({
      lead_id,
      destination,
      duration,
      pickup_city,
      hotel_category,
      meal_plan,
      transport_type,
      selling_price: numSellingPrice,
      advance_amount: numAdvanceAmount,
      balance_amount: numBalanceAmount,
      inclusions,
      exclusions,
      cancellation_terms,
      status: status || 'draft',
      sent_date: status === 'sent' ? new Date() : null,
      created_by: req.user.id,
    });

    // If quotation is marked as sent immediately, update lead status
    if (status === 'sent') {
      lead.status = 'quote_sent';
      await lead.save();
    }

    // Audit logs
    await logActivity({
      action: 'QUOTE_CREATED',
      entityType: 'Quotation',
      entityId: newQuote.id,
      newValue: {
        id: newQuote.id,
        lead_id,
        selling_price: numSellingPrice,
        status: newQuote.status
      },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({ success: true, message: 'Quotation created successfully', data: newQuote });
  } catch (error) {
    console.error('CreateQuote error:', error);
    return res.status(500).json({ success: false, message: 'Server error drafting quotation' });
  }
};

const updateQuote = async (req, res) => {
  const {
    destination, duration, pickup_city, hotel_category,
    meal_plan, transport_type, selling_price, advance_amount,
    inclusions, exclusions, cancellation_terms, status
  } = req.body;

  try {
    const quote = await Quotation.findByPk(req.params.id, {
      include: [{ model: Lead, as: 'lead' }]
    });

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && quote.lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This quotation is not for your assigned lead' });
    }

    const oldQuoteValues = quote.toJSON();

    if (destination) quote.destination = destination;
    if (duration !== undefined) quote.duration = duration;
    if (pickup_city !== undefined) quote.pickup_city = pickup_city;
    if (hotel_category !== undefined) quote.hotel_category = hotel_category;
    if (meal_plan !== undefined) quote.meal_plan = meal_plan;
    if (transport_type !== undefined) quote.transport_type = transport_type;
    if (inclusions !== undefined) quote.inclusions = inclusions;
    if (exclusions !== undefined) quote.exclusions = exclusions;
    if (cancellation_terms !== undefined) quote.cancellation_terms = cancellation_terms;

    let recalculateAmounts = false;
    if (selling_price !== undefined) {
      quote.selling_price = parseFloat(selling_price);
      recalculateAmounts = true;
    }
    if (advance_amount !== undefined) {
      quote.advance_amount = parseFloat(advance_amount);
      recalculateAmounts = true;
    }

    if (recalculateAmounts) {
      quote.balance_amount = quote.selling_price - quote.advance_amount;
    }

    if (status && status !== quote.status) {
      const oldStatus = quote.status;
      quote.status = status;
      if (status === 'sent') {
        quote.sent_date = new Date();
        // Update lead status
        const lead = await Lead.findByPk(quote.lead_id);
        if (lead && lead.status !== 'booked') {
          lead.status = 'quote_sent';
          await lead.save();
        }
      }
    }

    await quote.save();

    // Audit logs
    await logActivity({
      action: 'QUOTE_UPDATED',
      entityType: 'Quotation',
      entityId: quote.id,
      oldValue: oldQuoteValues,
      newValue: quote.toJSON(),
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Quotation updated successfully', data: quote });
  } catch (error) {
    console.error('UpdateQuote error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating quotation' });
  }
};

const updateQuoteStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || !['draft', 'sent', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Valid status is required' });
  }

  try {
    const quote = await Quotation.findByPk(req.params.id, {
      include: [{ model: Lead, as: 'lead' }]
    });

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Access control
    if (req.user.role === 'sales_exec' && quote.lead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: This quotation is not for your assigned lead' });
    }

    const oldStatus = quote.status;
    quote.status = status;
    if (status === 'sent') {
      quote.sent_date = new Date();
    }
    await quote.save();

    // Side effects on Lead Status
    const lead = await Lead.findByPk(quote.lead_id);
    if (lead) {
      if (status === 'sent' && lead.status !== 'booked') {
        lead.status = 'quote_sent';
        await lead.save();
      } else if (status === 'accepted' && lead.status !== 'booked') {
        lead.status = 'booking_request';
        await lead.save();
      }
    }

    // Audit Log
    await logActivity({
      action: 'QUOTE_STATUS_CHANGED',
      entityType: 'Quotation',
      entityId: quote.id,
      oldValue: { status: oldStatus },
      newValue: { status },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: `Quotation status updated to ${status}`, data: quote });
  } catch (error) {
    console.error('UpdateQuoteStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error changing quotation status' });
  }
};

module.exports = {
  getQuotesByLead,
  createQuote,
  updateQuote,
  updateQuoteStatus,
};
