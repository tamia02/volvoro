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
app.use('/api/reports', reportRoutes);
app.use('/api', systemRoutes); // Mount system endpoints at /api directly for dashboards

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

    // sync tables without resetting records (alter: true adjusts existing columns)
    await sequelize.sync({ alter: false });
    console.log('Database tables verified.');

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
