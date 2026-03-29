const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/index');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

/**
 * 🛠️ MIDDLEWARES
 */
const allowedOrigins = config.NODE_ENV === 'production'
    ? [process.env.MINI_APP_URL || 'https://xgame-eta.vercel.app']
    : ['*'];

app.use(cors({
    origin: config.NODE_ENV === 'production' ? allowedOrigins : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * 🖼️ STATIC FILES
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const miniAppPath = path.join(__dirname, '../../mini-app/dist');
app.use(express.static(miniAppPath));

/**
 * 🛣️ ROUTES
 */
app.get('/ping', (req, res) => {
    res.json({
        message: 'GameZone API is active! 🚀',
        version: config.API_STABILITY_VERSION,
        status: 'OK'
    });
});

app.use('/api', apiRoutes);

/**
 * 📱 SPA CATCH-ALL
 * Redirects all non-api routes to the frontend SPA.
 */
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(miniAppPath, 'index.html'));
});

/**
 * ⚡ ERROR HANDLING
 */
app.use(errorHandler);

module.exports = app;
