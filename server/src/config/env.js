require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || process.env.SERVER_PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'XGAME_SECRET_2026',
    DB_URI: process.env.DB_URI, // If using URI
    DB_NAME: process.env.DB_NAME || 'gamezone',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASS: process.env.DB_PASS || '',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 3306,

    // 🛡️ INITIAL ADMIN CREDENTIALS
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || '123',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '123'
};
