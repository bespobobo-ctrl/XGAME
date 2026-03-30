const { User, Club, Session, Computer } = require('../database');

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Club, attributes: ['name'] }]
        });

        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        const recentSessions = await Session.findAll({
            where: { UserId: user.id, status: 'completed' },
            include: [{ model: Computer, attributes: ['name'] }],
            order: [['endTime', 'DESC']],
            limit: 5
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                telegramId: user.telegramId,
                name: user.firstName || user.username,
                balance: user.balance,
                clubName: user.Club ? user.Club.name : 'Unknown Club',
            },
            recentSessions: recentSessions.map(s => ({
                id: s.id,
                pc: s.Computer ? s.Computer.name : 'PC',
                date: s.endTime,
                duration: s.totalMinutes,
                cost: s.totalCost
            }))
        });
    } catch (error) {
        next(error);
    }
};
