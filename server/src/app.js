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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 🖼️ STATIC FILES
 */
// Uploads service
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mini App static files (Vite build)
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
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(miniAppPath, 'index.html'));
});

/**
 * ⚡ ERROR HANDLING
 */
app.use(errorHandler);

module.exports = app;
