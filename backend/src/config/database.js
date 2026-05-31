const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'sqlite';
let sequelize;

if (dialect === 'sqlite') {
  const storagePath = path.join(__dirname, '../../', process.env.DB_STORAGE || 'database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false, // Set to console.log to see SQL queries in console
  });
} else {
  // PostgreSQL setup
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false,
  });
}

module.exports = sequelize;
