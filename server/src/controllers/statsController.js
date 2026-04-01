const { Club, User, Session, Transaction } = require('../shared/database');
const config = require('../config/index');
const { Op } = require('sequelize');
const os = require('os');

exports.getDashboardStats = async (req, res, next) => {
    try {
        // O'zbekiston (UTC+5) bo'yicha kun boshlanishini hisoblash
        const tashkentOffset = 5 * 60 * 60 * 1000;
        const now = new Date();
        const tashkentNow = new Date(now.getTime() + tashkentOffset);
        tashkentNow.setUTCHours(0, 0, 0, 0);
        const dStartTashkentInUTC = new Date(tashkentNow.getTime() - tashkentOffset);

        const [totalClubs, totalManagers, activeSessions, todayRevenue, clubsHistory] = await Promise.all([
            Club.count(),
            User.count({ where: { role: 'manager' } }),
            Session.count({ where: { status: 'active' } }),
            Transaction.sum('amount', {
                where: { createdAt: { [Op.gte]: dStartTashkentInUTC } }
            }),
            Club.findAll({
                attributes: ['name', 'createdAt', 'status'],
                limit: 5,
                order: [['createdAt', 'DESC']]
            })
        ]);

        // Real server load
        const cpuLoad = os.loadavg()[0];
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

        res.json({
            totalClubs,
            totalManagers,
            activeSessions,
            todayRevenue: todayRevenue || 0,
            systemHealth: `v${config.API_STABILITY_VERSION || '2.5'} (Stable)`,
            serverLoad: `CPU: ${cpuLoad.toFixed(1)} | RAM: ${memUsage}%`,
            clubsHistory
        });
    } catch (err) {
        next(err);
    }
};
