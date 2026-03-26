const Broadcast = require('../database/models/Broadcast');

exports.sendBroadcast = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });
        await Broadcast.create({ message });
        res.json({ success: true, message: 'Broadcast sent successfully!' });
    } catch (err) { next(err); }
};

exports.getBroadcasts = async (req, res, next) => {
    try {
        const broadcasts = await Broadcast.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
        res.json(broadcasts);
    } catch (err) { next(err); }
};
