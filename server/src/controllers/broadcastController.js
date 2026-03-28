const { User, Broadcast } = require('../database');
const { broadcastMessage } = require('../utils/bot');
const { Op } = require('sequelize');

exports.sendBroadcast = async (req, res, next) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    try {
        const broadcast = await Broadcast.create({
            message,
            type: 'global',
            senderRole: req.user ? req.user.role : 'system'
        });

        // Fetch all users with valid telegramId
        const users = await User.findAll({
            where: {
                telegramId: { [Op.ne]: null },
                status: 'active'
            },
            attributes: ['telegramId'],
            raw: true
        });

        const telegramIds = users.filter(u => u.telegramId && !u.telegramId.startsWith('MANAGER_')).map(u => u.telegramId);

        // Perform broadcast (async, don't wait for all to finish before replying to user)
        broadcastMessage(telegramIds, `<b>📣 GLOBAL XABAR (ADMIN)</b>\n\n${message}`);

        res.json({ success: true, message: `Broadcast yuborilmoqda (${telegramIds.length} users)...`, data: broadcast });
    } catch (err) {
        next(err);
    }
};

exports.getBroadcasts = async (req, res, next) => {
    const broadcasts = await Broadcast.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']]
    });
    res.json(broadcasts);
};
