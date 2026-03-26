require('dotenv').config({ path: '../../.env' });

module.exports = {
    PORT: process.env.SERVER_PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET || 'gamezone_super_secret_v2',
    DB_PATH: process.env.DB_PATH || './data/gamezone_v2.db',
    UPLOAD_DIR: 'uploads',
    SALT_ROUNDS: 10,
    API_STABILITY_VERSION: 'v2.4'
};
