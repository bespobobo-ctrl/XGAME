const User = require('../database/models/User');
const Club = require('../database/models/Club');

exports.getAllManagers = async (req, res, next) => {
    const managers = await User.findAll({
        where: { role: 'manager' },
        include: [{ model: Club, attributes: ['name'] }]
    });
    res.json(managers.map(m => ({
        id: m.id, username: m.username,
        status: m.status, ClubId: m.ClubId, clubName: m.Club ? m.Club.name : '---'
    })));
};

exports.createManager = async (req, res, next) => {
    const { username, password, clubId } = req.body;
    await User.create({
        username, password,
        role: 'manager', ClubId: clubId, status: 'active'
    });
    res.json({ success: true });
};

exports.updateManager = async (req, res, next) => {
    const { username, password, clubId, status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Manager not found' });

    const updateData = { username, ClubId: clubId, status };
    if (password) {
        updateData.password = password;
    }
    await user.update(updateData);
    res.json({ success: true });
};

exports.deleteManager = async (req, res, next) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Manager not found' });
    await user.destroy();
    res.json({ success: true });
};

exports.toggleBlock = async (req, res, next) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Manager not found' });
    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();
    res.json({ success: true, status: user.status });
};
