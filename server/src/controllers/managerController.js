const User = require('../database/models/User');
const Club = require('../database/models/Club');

exports.getAllManagers = async (req, res, next) => {
    try {
        const managers = await User.findAll({
            where: { role: 'manager' },
            include: [{ model: Club, attributes: ['name'] }]
        });
        res.json(managers.map(m => ({
            id: m.id, username: m.username,
            status: m.status, ClubId: m.ClubId, clubName: m.Club ? m.Club.name : '---'
        })));
    } catch (err) {
        next(err);
    }
};

exports.createManager = async (req, res, next) => {
    try {
        const { username, password, clubId } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username va parol kiritilishi shart' });
        }

        // Mavjudligini tekshirish
        const existing = await User.findOne({ where: { username } });
        if (existing) {
            return res.status(409).json({ error: 'Bu username allaqachon band' });
        }

        await User.create({
            username, password,
            role: 'manager', ClubId: clubId || null, status: 'active'
        });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.updateManager = async (req, res, next) => {
    try {
        const { username, password, clubId, status } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Manager not found' });

        if (username) user.username = username;
        if (clubId !== undefined) user.ClubId = clubId;
        if (status) user.status = status;
        if (password) user.password = password;

        await user.save();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.deleteManager = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Manager not found' });
        await user.destroy();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.toggleBlock = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Manager not found' });
        user.status = user.status === 'active' ? 'blocked' : 'active';
        await user.save();
        res.json({ success: true, status: user.status });
    } catch (err) {
        next(err);
    }
};
