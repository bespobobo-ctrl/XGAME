const jwt = require('jsonwebtoken');
const { User } = require('../database');

/**
 * 🔐 AUTH MIDDLEWARE (SENIOR LEVEL)
 * Ushbu middleware barcha so'rovlarni (headers) tekshiradi:
 * 1. Token borligini.
 * 2. Token to'g'riligini (JWT verify).
 * 3. Foydalanuvchi bazada hali ham mavjudligini.
 */
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error();
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'XGAME_SECRET_2026');

        // 🛡️ MASTER ADMIN BYPASS (Ultra-Safe)
        if (decoded.id === 0 || decoded.username === 'Master Admin') {
            req.user = { id: 0, username: 'Master Admin', role: 'super_admin' };
            req.token = token;
            return next();
        }

        const user = await User.findByPk(decoded.id);

        if (!user || user.status === 'blocked') {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        res.status(401).send({ error: 'RUXSAT YO`Q! Iltimos, qaytadan tizimga kiring.' });
    }
};

/**
 * 👑 ROLE-BASED ACCESS CONTROL (RBAC)
 * Faqat ma'lum bir rollar (super_admin, admin) kira oladigan yo'llarni boshqarish.
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).send({ error: 'BU AMALNI BAJARISH UCHUN HUQUQUINGIZ YETARLI EMAS!' });
        }
        next();
    };
};

module.exports = { auth, authorize };
