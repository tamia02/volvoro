const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Customize for production client URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in console
app.use(morgan('dev'));

// Static uploads directory serving
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leadRoutes = require('./routes/leads');
const followupRoutes = require('./routes/followups');
const quoteRoutes = require('./routes/quotes');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const vendorRoutes = require('./routes/vendors');
const operationsRoutes = require('./routes/operations');
const expenseRoutes = require('./routes/expenses');
const commissionRoutes = require('./routes/commissions');
const payoutRoutes = require('./routes/payouts');
const reportRoutes = require('./routes/reports');
const systemRoutes = require('./routes/system');

// Bind API routing paths
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', systemRoutes); // Mount system endpoints at /api directly for dashboards

// Root path confirmation route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Welcome to the Volvoro Tour Explorer CRM API Service.', 
    version: '1.0.0',
    health: `${req.protocol}://${req.get('host')}/api/health` 
  });
});

// Base API status endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database Synchronization & Server Startup
async function startServer() {
  try {
    console.log('Verifying database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // sync tables without resetting records
    console.log('Running schema migrations...');
    const migrations = [
      'ALTER TABLE `users` ADD COLUMN `address` TEXT;',
      "ALTER TABLE `users` ADD COLUMN `payout_type` VARCHAR(30) DEFAULT 'Salary';",
      'ALTER TABLE `users` ADD COLUMN `salary_amount` DECIMAL(12,2);',
      'ALTER TABLE `users` ADD COLUMN `commission_percentage` DECIMAL(5,2);',
      'ALTER TABLE `vendors` ADD COLUMN `company_name` VARCHAR(100);',
      'ALTER TABLE `vendors` ADD COLUMN `mobile_number` VARCHAR(20);',
      'ALTER TABLE `vendors` ADD COLUMN `whatsapp_number` VARCHAR(20);',
      'ALTER TABLE `vendors` ADD COLUMN `email` VARCHAR(100);',
      'ALTER TABLE `vendors` ADD COLUMN `address` TEXT;',
      "ALTER TABLE `vendors` ADD COLUMN `destinations` TEXT DEFAULT '[]';"
    ];
    for (const q of migrations) {
      try {
        await sequelize.query(q);
      } catch (err) {
        // Silence duplicate column errors
      }
    }

    await sequelize.sync({ alter: false });
    console.log('Database tables verified.');

    // Auto-seed default users if database has no registered accounts
    const User = require('./models/User');
    const bcrypt = require('bcrypt');
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No users found in database. Auto-seeding default accounts...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash('Volvoro2026!', saltRounds);
      
      const defaultUsers = [
        {
          name: 'VTE Admin',
          mobile: '9999999991',
          email: 'admin@volvoro.com',
          password_hash: passwordHash,
          role: 'admin',
          status: 'active',
          joining_date: '2026-01-01',
        },
        {
          name: 'Volvoro Google Admin',
          mobile: '9999999990',
          email: 'volvorotourexplorer@gmail.com',
          password_hash: passwordHash,
          role: 'admin',
          status: 'active',
          joining_date: '2026-01-01',
        },
        {
          name: 'VTE Sales Exec',
          mobile: '9999999992',
          email: 'sales@volvoro.com',
          password_hash: passwordHash,
          role: 'sales_exec',
          status: 'active',
          joining_date: '2026-01-01',
        },
        {
          name: 'VTE Finance Manager',
          mobile: '9999999993',
          email: 'finance@volvoro.com',
          password_hash: passwordHash,
          role: 'finance',
          status: 'active',
          joining_date: '2026-01-01',
        },
        {
          name: 'VTE Operations coordinator',
          mobile: '9999999994',
          email: 'ops@volvoro.com',
          password_hash: passwordHash,
          role: 'operations',
          status: 'active',
          joining_date: '2026-01-01',
        },
        {
          name: 'VTE Marketing Coordinator',
          mobile: '9999999995',
          email: 'marketing@volvoro.com',
          password_hash: passwordHash,
          role: 'marketing',
          status: 'active',
          joining_date: '2026-01-01',
        }
      ];

      for (const u of defaultUsers) {
        await User.create(u);
      }
      console.log('Default accounts auto-seeded successfully.');
    }

    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  VOLVORO TOUR CRM SERVER RUNNING ON PORT ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Database connection / sync failure:', error);
    process.exit(1);
  }
}

startServer();
