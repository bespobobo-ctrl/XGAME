require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`❌ CRITICAL: ${varName} environment variable is required but not set!`);
        process.exit(1);
    }
}

module.exports = {
    PORT: process.env.SERVER_PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET,
    DB_PATH: process.env.DB_PATH || './data/gamezone_v2.db',
    UPLOAD_DIR: 'uploads',
    SALT_ROUNDS: 10,
    API_STABILITY_VERSION: 'v2.5',
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Telegram
    BOT_TOKEN: process.env.BOT_TOKEN,
    ADMIN_ID: process.env.ADMIN_ID,

    // Game Sozlamalari
    DEFAULT_PRICE_PER_HOUR: parseInt(process.env.DEFAULT_PRICE_PER_HOUR) || 20000,
    CURRENCY: process.env.CURRENCY || 'UZS',

    // Super Admin
    SUPER_ADMIN_USER: process.env.SUPER_ADMIN_USER || 'admin',
    SUPER_ADMIN_PASS: process.env.SUPER_ADMIN_PASS || 'changeme_on_first_login'
};
