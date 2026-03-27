const Broadcast = require('../database/models/Broadcast');

exports.sendBroadcast = async (req, res, next) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const broadcast = await Broadcast.create({
        message,
        type: 'global',
        senderRole: req.user ? req.user.role : 'system'
    });

    res.json({ success: true, message: 'Broadcast sent successfully!', data: broadcast });
};

exports.getBroadcasts = async (req, res, next) => {
    const broadcasts = await Broadcast.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']]
    });
    res.json(broadcasts);
};
