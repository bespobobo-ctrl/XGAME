const { User, Broadcast } = require('../database');
const { broadcastMessage } = require('../utils/bot');
const { Op } = require('sequelize');

exports.sendBroadcast = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Xabar matni bo\'sh bo\'lmasligi kerak' });
        }

        const broadcast = await Broadcast.create({
            message: message.trim(),
            type: 'global',
            senderRole: req.user ? req.user.role : 'system'
        });

        const users = await User.findAll({
            where: {
                telegramId: { [Op.ne]: null },
                status: 'active'
            },
            attributes: ['telegramId'],
            raw: true
        });

        const telegramIds = users
            .filter(u => u.telegramId && !u.telegramId.startsWith('MANAGER_'))
            .map(u => u.telegramId);

        // Async broadcast
        broadcastMessage(telegramIds, `<b>📣 GLOBAL XABAR (ADMIN)</b>\n\n${message.trim()}`);

        res.json({
            success: true,
            message: `Broadcast yuborilmoqda (${telegramIds.length} users)...`,
            data: broadcast
        });
    } catch (err) {
        next(err);
    }
};

exports.getBroadcasts = async (req, res, next) => {
    try {
        const broadcasts = await Broadcast.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        res.json(broadcasts);
    } catch (err) {
        next(err);
    }
};
