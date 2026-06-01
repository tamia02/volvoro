const bcrypt = require('bcrypt');
const { 
  sequelize, 
  User, 
  Customer, 
  Lead, 
  FollowUp, 
  Quotation, 
  Booking, 
  Payment, 
  Vendor, 
  BookingOperation, 
  Commission, 
  Expense,
  VendorDestination,
  Payout
} = require('../models');

async function seedDatabase() {
  try {
    console.log('Synchronizing database schema (forcing clean reset)...');
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.sync({ force: true });
    await sequelize.query('PRAGMA foreign_keys = ON;');
    console.log('Database synchronized successfully.');

    console.log('Seeding default users...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('Volvoro2026!', saltRounds);

    const admin = await User.create({
      name: 'VTE Admin',
      mobile: '9999999991',
      email: 'admin@volvoro.com',
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      joining_date: '2026-01-01',
      address: '123 CRM Street, Admin City',
      payout_type: 'Salary',
      salary_amount: 100000.00
    });

    const googleAdmin = await User.create({
      name: 'Volvoro Google Admin',
      mobile: '9999999990',
      email: 'volvorotourexplorer@gmail.com',
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      joining_date: '2026-01-01',
      address: 'CRM Headquarters, Tech City',
      payout_type: 'Salary',
      salary_amount: 120000.00
    });

    const sales = await User.create({
      name: 'VTE Sales Exec',
      mobile: '9999999992',
      email: 'sales@volvoro.com',
      password_hash: passwordHash,
      role: 'sales_exec',
      status: 'active',
      joining_date: '2026-01-01',
      address: 'Sales Plaza, Deal Town',
      payout_type: 'Hybrid',
      salary_amount: 30000.00,
      commission_percentage: 10.00
    });

    const finance = await User.create({
      name: 'VTE Finance Manager',
      mobile: '9999999993',
      email: 'finance@volvoro.com',
      password_hash: passwordHash,
      role: 'finance',
      status: 'active',
      joining_date: '2026-01-01',
      address: 'Finance Tower, Coin Road',
      payout_type: 'Salary',
      salary_amount: 80000.00
    });

    const ops = await User.create({
      name: 'VTE Operations coordinator',
      mobile: '9999999994',
      email: 'ops@volvoro.com',
      password_hash: passwordHash,
      role: 'operations',
      status: 'active',
      joining_date: '2026-01-01',
      address: 'Logistics Center, Ops Street',
      payout_type: 'Salary',
      salary_amount: 70000.00
    });

    const marketing = await User.create({
      name: 'VTE Marketing Coordinator',
      mobile: '9999999995',
      email: 'marketing@volvoro.com',
      password_hash: passwordHash,
      role: 'marketing',
      status: 'active',
      joining_date: '2026-01-01',
      address: 'Creative Studio, Ads Avenue',
      payout_type: 'Salary',
      salary_amount: 65000.00
    });

    console.log('Users seeded.');

    // Seed some test vendors with destinations rate card
    console.log('Seeding default vendors...');
    const vendor1 = await Vendor.create({
      name: 'Royal Travels Kashmir',
      company_name: 'Royal Travels Kashmir Pvt Ltd',
      mobile_number: '9876543210',
      whatsapp_number: '9876543210',
      email: 'contact@royalkashmir.com',
      address: 'Srinagar, Jammu & Kashmir',
      destinations: '["Kashmir", "Ladakh"]',
      service_type: 'full_package',
      notes: 'Main vendor for North India travel packages.',
      status: 'active'
    });

    await VendorDestination.create({
      vendor_id: vendor1.id,
      destination_name: 'Kashmir',
      double_triple_sharing_rate: 12000.00,
      quad_sharing_rate: 10000.00
    });

    await VendorDestination.create({
      vendor_id: vendor1.id,
      destination_name: 'Ladakh',
      double_triple_sharing_rate: 18000.00,
      quad_sharing_rate: 15000.00
    });

    console.log('Vendors seeded.');

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to sync or seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
