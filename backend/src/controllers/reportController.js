const { Lead, Booking, Payment, Vendor, Commission, User, Customer, FollowUp } = require('../models');
const { Op } = require('sequelize');

const getLeadsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { is_deleted: false };

    if (startDate && endDate) {
      filter.lead_date = {
        [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999Z')]
      };
    }

    const leads = await Lead.findAll({ where: filter });

    const report = {
      total: leads.length,
      by_status: {},
      by_source: {}
    };

    leads.forEach(l => {
      report.by_status[l.status] = (report.by_status[l.status] || 0) + 1;
      report.by_source[l.source] = (report.by_source[l.source] || 0) + 1;
    });

    return res.json({ success: true, data: report });
  } catch (error) {
    console.error('GetLeadsReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error compiling leads report' });
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { verification_status: 'verified' },
      order: [['payment_date', 'ASC']]
    });

    let totalRevenue = 0;
    const dailyRevenue = {};

    payments.forEach(p => {
      const amt = parseFloat(p.amount);
      totalRevenue += amt;
      dailyRevenue[p.payment_date] = (dailyRevenue[p.payment_date] || 0) + amt;
    });

    return res.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        history: Object.keys(dailyRevenue).map(date => ({ date, amount: dailyRevenue[date] }))
      }
    });
  } catch (error) {
    console.error('GetRevenueReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating revenue report' });
  }
};

const getProfitReport = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { status: 'approved' }
    });

    let totalRevenue = 0;
    let totalVendorCost = 0;

    for (const b of bookings) {
      totalRevenue += parseFloat(b.package_amount);
      // Try to find the linked vendor cost in booking operations
      const ops = await b.getOperations({ include: [{ model: Vendor, as: 'vendor' }] });
      if (ops && ops.vendor) {
        totalVendorCost += parseFloat(ops.vendor.total_cost || 0);
      }
    }

    const netProfit = totalRevenue - totalVendorCost;

    return res.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        total_vendor_cost: totalVendorCost,
        net_profit: netProfit
      }
    });
  } catch (error) {
    console.error('GetProfitReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error compiling profit report' });
  }
};

const getSalesExecPerformance = async (req, res) => {
  try {
    const salespersons = await User.findAll({
      where: { role: 'sales_exec', status: 'active' },
      attributes: ['id', 'name', 'mobile']
    });

    const performanceData = [];

    for (const s of salespersons) {
      const totalLeads = await Lead.count({ where: { assigned_to: s.id, is_deleted: false } });
      const bookedLeads = await Lead.count({ where: { assigned_to: s.id, status: 'booked', is_deleted: false } });
      const lostLeads = await Lead.count({ where: { assigned_to: s.id, status: 'lost', is_deleted: false } });

      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(2) : '0.00';

      // Total revenue generated
      const bookings = await Booking.findAll({
        where: { status: 'approved' },
        include: [{
          model: Lead,
          as: 'lead',
          where: { assigned_to: s.id, is_deleted: false }
        }]
      });

      const revenueGenerated = bookings.reduce((sum, b) => sum + parseFloat(b.package_amount), 0);

      performanceData.push({
        salesperson_id: s.id,
        name: s.name,
        mobile: s.mobile,
        total_leads: totalLeads,
        booked_leads: bookedLeads,
        lost_leads: lostLeads,
        revenue_generated: revenueGenerated,
        conversion_rate: conversionRate
      });
    }

    return res.json({ success: true, data: performanceData });
  } catch (error) {
    console.error('GetSalesExecPerformance error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating performance scorecard' });
  }
};

const getLostReasons = async (req, res) => {
  try {
    const lostLeads = await Lead.findAll({
      where: { status: 'lost', is_deleted: false },
      attributes: ['lost_reason']
    });

    const reasons = {};
    lostLeads.forEach(l => {
      const reason = l.lost_reason || 'Unspecified';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return res.json({ success: true, data: reasons });
  } catch (error) {
    console.error('GetLostReasons error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing lost reasons' });
  }
};

const getMissedFollowUpsReport = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const missedLeads = await Lead.findAll({
      where: {
        is_deleted: false,
        next_followup_date: { [Op.lt]: todayStr },
        status: { [Op.notIn]: ['booked', 'lost', 'fake'] }
      },
      include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name'] }]
    });

    const missedByAgent = {};

    missedLeads.forEach(l => {
      const agentName = l.assignedUser ? l.assignedUser.name : 'Unassigned';
      missedByAgent[agentName] = (missedByAgent[agentName] || 0) + 1;
    });

    return res.json({ success: true, data: missedByAgent });
  } catch (error) {
    console.error('GetMissedFollowUpsReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing missed callbacks' });
  }
};

const getMarketingReport = async (req, res) => {
  try {
    const leads = await Lead.findAll({
      where: { is_deleted: false }
    });

    const summary = {};

    for (const l of leads) {
      const key = `${l.source} - ${l.campaign_name || 'No Campaign'}`;
      if (!summary[key]) {
        summary[key] = {
          source: l.source,
          campaign: l.campaign_name || 'No Campaign',
          leads_count: 0,
          booked_count: 0
        };
      }
      summary[key].leads_count += 1;
      if (l.status === 'booked') {
        summary[key].booked_count += 1;
      }
    }

    // Convert to list and calculate conversion
    const reportData = Object.values(summary).map(item => ({
      ...item,
      conversion_rate: item.leads_count > 0 ? ((item.booked_count / item.leads_count) * 100).toFixed(2) : '0.00'
    }));

    return res.json({ success: true, data: reportData });
  } catch (error) {
    console.error('GetMarketingReport error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating marketing campaign report' });
  }
};

module.exports = {
  getLeadsReport,
  getRevenueReport,
  getProfitReport,
  getSalesExecPerformance,
  getLostReasons,
  getMissedFollowUpsReport,
  getMarketingReport,
};
