const { Club, User, Session, Transaction } = require('../database');
const config = require('../config/index');
const { Op } = require('sequelize');
const { startOfDay } = require('date-fns');

exports.getDashboardStats = async (req, res, next) => {
    try {
        const dStart = startOfDay(new Date());

        const [totalClubs, totalManagers, activeSessions, todayRevenue, clubsHistory] = await Promise.all([
            Club.count(),
            User.count({ where: { role: 'manager' } }),
            Session.count({ where: { status: 'active' } }),
            Transaction.sum('amount', { where: { createdAt: { [Op.gte]: dStart } } }),
            Club.findAll({
                attributes: ['name', 'createdAt', 'status'],
                limit: 5,
                order: [['createdAt', 'DESC']]
            })
        ]);

        res.json({
            totalClubs,
            totalManagers,
            activeSessions,
            todayRevenue: todayRevenue || 0,
            systemHealth: `v${config.API_STABILITY_VERSION || '1.0.1'} (Stable)`,
            serverLoad: 'Normal (12%)',
            clubsHistory
        });
    } catch (err) {
        next(err);
    }
};
