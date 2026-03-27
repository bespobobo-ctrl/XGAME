const Club = require('../database/models/Club');
const User = require('../database/models/User');
const Session = require('../database/models/Session');
const config = require('../config/index');

exports.getDashboardStats = async (req, res, next) => {
    const [totalClubs, totalManagers, activeSessions] = await Promise.all([
        Club.count(),
        User.count({ where: { role: 'manager' } }),
        Session.count({ where: { status: 'active' } })
    ]);

    const clubsHistory = await Club.findAll({
        attributes: ['name', 'createdAt', 'status'],
        limit: 5,
        order: [['createdAt', 'DESC']]
    });

    res.json({
        totalClubs,
        totalManagers,
        activeSessions,
        todayRevenue: 4500000, // This should be calculated from Transactions in the future
        systemHealth: `v${config.API_STABILITY_VERSION} (Active)`,
        serverLoad: 'Normal (12%)',
        clubsHistory
    });
};
