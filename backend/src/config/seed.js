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
  Expense 
} = require('../models');

async function seedDatabase() {
  try {
    console.log('Synchronizing database schema (forcing clean reset)...');
    await sequelize.sync({ force: true });
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
    });

    const googleAdmin = await User.create({
      name: 'Volvoro Google Admin',
      mobile: '9999999990',
      email: 'volvorotourexplorer@gmail.com',
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      joining_date: '2026-01-01',
    });

    const sales = await User.create({
      name: 'VTE Sales Exec',
      mobile: '9999999992',
      email: 'sales@volvoro.com',
      password_hash: passwordHash,
      role: 'sales_exec',
      status: 'active',
      joining_date: '2026-01-01',
    });

    const finance = await User.create({
      name: 'VTE Finance Manager',
      mobile: '9999999993',
      email: 'finance@volvoro.com',
      password_hash: passwordHash,
      role: 'finance',
      status: 'active',
      joining_date: '2026-01-01',
    });

    const ops = await User.create({
      name: 'VTE Operations coordinator',
      mobile: '9999999994',
      email: 'ops@volvoro.com',
      password_hash: passwordHash,
      role: 'operations',
      status: 'active',
      joining_date: '2026-01-01',
    });

    const marketing = await User.create({
      name: 'VTE Marketing Coordinator',
      mobile: '9999999995',
      email: 'marketing@volvoro.com',
      password_hash: passwordHash,
      role: 'marketing',
      status: 'active',
      joining_date: '2026-01-01',
    });

    console.log('Users seeded.');

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to sync or seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
