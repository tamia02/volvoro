const permissionsMap = {
  create_user: ['admin'],
  deactivate_user: ['admin'],
  create_lead: ['admin'],
  view_lead_all: ['admin'],
  view_lead_own: ['admin', 'sales_exec'],
  edit_lead: ['admin', 'sales_exec'],
  edit_customer_number: ['admin'],
  delete_lead: ['admin'],
  assign_lead: ['admin'],
  update_lead_status: ['admin', 'sales_exec'],
  view_lead_source_reports: ['admin', 'marketing'],
  create_quotation: ['admin', 'sales_exec'],
  view_vendor_cost: ['admin'],
  raise_booking: ['admin', 'sales_exec'],
  approve_booking: ['admin'],
  upload_payment: ['admin', 'sales_exec'],
  verify_payment: ['admin', 'finance'],
  view_revenue_profit: ['admin'],
  manage_vendors: ['admin'],
  view_operations: ['admin', 'operations'],
  update_operations: ['admin', 'operations'],
  view_expenses: ['admin', 'finance'],
  add_expense: ['admin', 'finance'],
  approve_commission: ['admin'],
  view_activity_logs: ['admin'],
  raise_delete_request: ['admin', 'sales_exec', 'finance', 'operations', 'marketing'],
  approve_delete_request: ['admin'],
  manage_payouts: ['admin', 'finance'],
  view_payouts: ['admin', 'finance'],
};

const checkPermission = (action) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Access denied: User details missing' });
    }

    const userRole = req.user.role;
    const allowedRoles = permissionsMap[action];

    if (!allowedRoles) {
      return res.status(500).json({ success: false, message: `System error: Undefined action permission mapping '${action}'` });
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Permission denied: Role '${userRole}' is not allowed to perform action '${action}'`,
    });
  };
};

module.exports = {
  checkPermission,
};
