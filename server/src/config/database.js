const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dbPath = process.env.DB_PATH || './data/gamezone.db';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../../', dbPath),
    logging: false, // Konsolga ortiqcha loglar chiqmasligi uchun
    dialectOptions: {
        timeout: 10000 // 🛡️ Prevent "Database is locked" errors (important for SQLite)
    }
});

module.exports = sequelize;
