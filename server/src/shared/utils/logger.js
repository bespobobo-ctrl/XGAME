const fs = require('fs');
const path = require('path');

// Logger - Professional logging system
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'app.log');

const logger = {
    info: (message, meta = {}) => {
        const log = `[${new Date().toISOString()}] [INFO] ${message} ${JSON.stringify(meta)}\n`;
        console.log(`\x1b[32m${log}\x1b[0m`); // Green for INFO
        fs.appendFileSync(logFile, log);
    },
    warn: (message, meta = {}) => {
        const log = `[${new Date().toISOString()}] [WARN] ${message} ${JSON.stringify(meta)}\n`;
        console.warn(`\x1b[33m${log}\x1b[0m`); // Yellow for WARN
        fs.appendFileSync(logFile, log);
    },
    error: (message, error = {}) => {
        const log = `[${new Date().toISOString()}] [ERROR] ${message} - ${error.message || error} ${error.stack || ''}\n`;
        console.error(`\x1b[31m${log}\x1b[0m`); // Red for ERROR
        fs.appendFileSync(logFile, log);
    }
};

module.exports = logger;
