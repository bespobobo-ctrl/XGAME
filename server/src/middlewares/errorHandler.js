const logger = require('../utils/logger');

/**
 * ⚡ GLOBAL ERROR HANDLER MIDDLEWARE
 */
const errorHandler = (err, req, res, next) => {
    logger.error(`[${req.method}] ${req.path}`, err);

    const statusCode = err.status || 500;
    const message = statusCode === 500
        ? 'Ichki server xatosi (Internal Server Error) 🛠️'
        : err.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;
