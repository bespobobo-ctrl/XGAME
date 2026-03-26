const Club = require('../database/models/Club');
const User = require('../database/models/User');
const Session = require('../database/models/Session');

exports.getDashboardStats = async (req, res, next) => {
    try {
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
            todayRevenue: 4500000,
            systemHealth: 'v9.2.4 (Stable)',
            serverLoad: '12%',
            clubsHistory
        });
    } catch (err) { next(err); }
};
