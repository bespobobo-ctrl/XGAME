const logger = (err, req, res, next) => {
    console.error(`[SERVER ERROR] ${new Date().toISOString()}`);
    console.error(`Path: ${req.path} | Method: ${req.method}`);
    console.error(err.stack);

    const statusCode = err.status || 500;
    const message = statusCode === 500 ? 'Ichki server xatosi (Internal Server Error) 🛠️' : err.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    });
};

module.exports = logger;
