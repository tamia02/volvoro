/**
 * Volvoro Tour Explorer CRM - API Integration Test Suite
 * Asserts permissions, security rules, and approval workflows.
 */
const { exec } = require('child_process');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server for testing...');
    serverProcess = exec('node src/server.js', { cwd: __dirname + '/../' });

    serverProcess.stdout.on('data', (data) => {
      console.log('Server stdout:', data.toString());
      if (data.includes('SERVER RUNNING')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error output:', data);
    });

    setTimeout(() => {
      resolve(); // Fallback resolve after 3 seconds
    }, 3000);
  });
}

async function runTests() {
  console.log('\n==================================================');
  console.log('  RUNNING CRM API INTEGRATION SECURITY TEST SUITE');
  console.log('==================================================\n');

  let adminToken = '';
  let salesToken = '';
  let createdLeadId = '';
  let createdBookingId = '';
  let createdPaymentId = '';

  try {
    // 1. Authenticate Admin
    console.log('Test 1: Authenticating Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: 'admin@volvoro.com', password: 'Volvoro2026!', role: 'admin' })
    });
    const adminLogin = await adminLoginRes.json();
    if (!adminLogin.success) throw new Error('Admin login failed');
    adminToken = adminLogin.token;
    console.log('✔ Admin authenticated successfully.');

    // 2. Authenticate Sales Exec
    console.log('Test 2: Authenticating Sales Exec...');
    const salesLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: 'sales@volvoro.com', password: 'Volvoro2026!', role: 'sales_exec' })
    });
    const salesLogin = await salesLoginRes.json();
    if (!salesLogin.success) throw new Error('Sales Exec login failed');
    salesToken = salesLogin.token;
    console.log('✔ Sales Exec authenticated successfully.');

    // 3. Admin creates a lead
    console.log('Test 3: Admin creating a Lead...');
    const leadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        primary_mobile: '9876543210',
        name: 'John Doe',
        destination: 'Bali',
        source: 'meta_ads',
        assigned_to: salesLogin.user.id, // Assign to sales exec
        pax_count: 2
      })
    });
    const leadData = await leadRes.json();
    if (!leadData.success) throw new Error('Lead creation failed: ' + leadData.message);
    createdLeadId = leadData.data.lead.id;
    console.log(`✔ Lead created successfully (ID: ${createdLeadId}).`);

    // 4. Verify Sales Exec CANNOT edit primary mobile
    console.log('Test 4: Verifying Sales Exec mobile edit lockout...');
    const editRes = await fetch(`${BASE_URL}/leads/${createdLeadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        primary_mobile: '1234567890', // Try to edit
        destination: 'Bali Upgrade'
      })
    });
    const editData = await editRes.json();
    if (editRes.status === 403 || !editData.success) {
      console.log('✔ Sales Exec edit primary mobile block verified (Returned Forbidden as expected).');
    } else {
      throw new Error('Lockout failed: Sales Exec was allowed to edit customer mobile number');
    }

    // 5. Admin creates a Vendor Cost, Verify Sales Exec CANNOT view cost details
    console.log('Test 5: Verifying Vendor cost masking for Sales Exec...');
    const vendorRes = await fetch(`${BASE_URL}/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Bali Hotel Partner',
        service_type: 'hotel',
        cost_per_person: 5000,
        total_cost: 10000,
        status: 'active'
      })
    });
    const vendorData = await vendorRes.json();
    if (!vendorData.success) throw new Error('Vendor creation failed');
    const createdVendorId = vendorData.data.id;

    const getVendorRes = await fetch(`${BASE_URL}/vendors/${createdVendorId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    const getVendorData = await getVendorRes.json();
    if (getVendorData.data.cost_per_person === undefined && getVendorData.data.total_cost === undefined) {
      console.log('✔ Cost masking verified: Sales Exec cannot see cost fields.');
    } else {
      throw new Error('Leak: Vendor cost data exposed to sales representative!');
    }

    // 6. Sales Exec raises booking request
    console.log('Test 6: Raising Booking Request...');
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        lead_id: createdLeadId,
        destination: 'Bali',
        travel_date: '2026-08-01',
        package_amount: 50000,
        advance_amount: 10000,
      })
    });
    const bookingData = await bookingRes.json();
    if (!bookingData.success) throw new Error('Booking request failed');
    createdBookingId = bookingData.data.id;
    console.log(`✔ Booking request raised successfully (ID: ${createdBookingId}).`);

    // 7. Verify Admin CANNOT approve booking before at least one payment is verified
    console.log('Test 7: Verifying Booking Approval blocking prior to payment...');
    const approveRes = await fetch(`${BASE_URL}/bookings/${createdBookingId}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const approveData = await approveRes.json();
    if (approveRes.status === 400 || !approveData.success) {
      console.log('✔ Booking approval block verified: Blocked because no payment is verified.');
    } else {
      throw new Error('Workflow bypass: Booking approved without verified payment');
    }

    // 8. Upload payment proof
    console.log('Test 8: Uploading Payment proof...');
    const paymentRes = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        booking_id: createdBookingId,
        lead_id: createdLeadId,
        amount: 10000,
        payment_mode: 'upi',
        transaction_id: 'TXN123456789',
        payment_date: '2026-06-01'
      })
    });
    const paymentData = await paymentRes.json();
    if (!paymentData.success) throw new Error('Payment upload failed');
    createdPaymentId = paymentData.data.id;
    console.log(`✔ Payment proof uploaded successfully (ID: ${createdPaymentId}).`);

    // 9. Admin verifies payment
    console.log('Test 9: Verifying Payment proof...');
    const verifyRes = await fetch(`${BASE_URL}/payments/${createdPaymentId}/verify`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) throw new Error('Payment verification failed');
    console.log('✔ Payment verified successfully.');

    // 10. Admin approves booking (Should succeed now)
    console.log('Test 10: Approving Booking request...');
    const approveRes2 = await fetch(`${BASE_URL}/bookings/${createdBookingId}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const approveData2 = await approveRes2.json();
    if (!approveData2.success) throw new Error('Booking approval failed: ' + approveData2.message);
    console.log('✔ Booking approved successfully (Status set to booked).');

    // 11. Sales Exec raises delete request
    console.log('Test 11: Raising Delete Request...');
    const delReqRes = await fetch(`${BASE_URL}/leads/${createdLeadId}/delete-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${salesToken}`
      },
      body: JSON.stringify({ reason: 'Duplicate test entry' })
    });
    const delReqData = await delReqRes.json();
    if (!delReqData.success) throw new Error('Delete request raising failed');
    const deleteTicketId = delReqData.data.id;
    console.log(`✔ Delete request ticket created (ID: ${deleteTicketId}).`);

    // 12. Admin approves delete request (Checks soft-delete)
    console.log('Test 12: Admin approving Delete Request...');
    const approveDelRes = await fetch(`${BASE_URL}/delete-requests/${deleteTicketId}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const approveDelData = await approveDelRes.json();
    if (!approveDelData.success) throw new Error('Delete request approval failed');

    // Verify lead is soft-deleted
    const getLeadRes = await fetch(`${BASE_URL}/leads/${createdLeadId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (getLeadRes.status === 404) {
      console.log('✔ Soft-delete verified: Lead has been removed from normal queries (Returned 404).');
    } else {
      throw new Error('Soft-delete failed: Lead is still visible in default queries');
    }

    // 13. Delete Expense/Payout records
    console.log('Test 13: Verifying Expenses/Payouts ledger deletion...');
    const createExpRes = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        expense_type: 'misc',
        amount: 500,
        expense_date: '2026-06-01',
        payment_mode: 'upi',
        notes: 'Integration Test Expense'
      })
    });
    const expData = await createExpRes.json();
    if (!expData.success) throw new Error('Failed to create test expense');
    const expId = expData.data.id;

    const deleteExpRes = await fetch(`${BASE_URL}/expenses/history/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        items: [{ id: expId, source: 'manual_expense' }]
      })
    });
    const deleteExpData = await deleteExpRes.json();
    if (!deleteExpData.success) throw new Error('Ledger delete request failed: ' + deleteExpData.message);
    console.log('✔ Ledger deletion verified successfully.');

    console.log('\n==================================================');
    console.log('  ALL INTEGRATION SECURITY TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

    shutdown();
    process.exit(0);
  } catch (error) {
    console.error('\n✖ TEST FAILED:', error.message);
    shutdown();
    process.exit(1);
  }
}

function shutdown() {
  if (serverProcess) {
    console.log('Shutting down backend testing server...');
    serverProcess.kill();
  }
}

async function run() {
  // Reset database before test by running seed
  console.log('Resetting database...');
  exec('node src/config/seed.js', { cwd: __dirname + '/../' }, async (error) => {
    if (error) {
      console.error('Failed to seed database for testing:', error);
      process.exit(1);
    }
    await startServer();
    await runTests();
  });
}

run();
