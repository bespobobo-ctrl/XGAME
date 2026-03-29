const jwt = require('jsonwebtoken');
const config = require('../config/index');
const { User } = require('../database/index');

/**
 * 🔐 AUTH MIDDLEWARE
 */
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Auth token missing or malformed' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // 🛡️ MASTER ADMIN BYPASS
        if (decoded.username === config.SUPER_ADMIN_USER) {
            // Bazadagi real admin ID ni olish
            const adminUser = await User.findOne({ where: { username: config.SUPER_ADMIN_USER } });
            req.user = {
                id: adminUser ? adminUser.id : decoded.id,
                username: config.SUPER_ADMIN_USER,
                role: 'super_admin'
            };
            req.token = token;
            return next();
        }

        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ error: 'Account is blocked' });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save({ hooks: false }); // Hook'siz saqlash (parolni qayta hash qilmaslik uchun)

        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token muddati tugagan. Qayta kiring.' });
        }
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * 👑 ROLE-BASED ACCESS CONTROL (RBAC)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Unauthorized destination. Insufficient permissions.'
            });
        }
        next();
    };
};

module.exports = { auth, authorize };
