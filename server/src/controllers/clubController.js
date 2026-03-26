const Club = require('../database/models/Club');
const User = require('../database/models/User');

exports.getAllClubs = async (req, res, next) => {
    try {
        const clubs = await Club.findAll({ order: [['id', 'DESC']] });
        res.json(clubs);
    } catch (err) { next(err); }
};

exports.createClub = async (req, res, next) => {
    try {
        const { name, address, level, lat, lng } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/default_club.png';
        const club = await Club.create({
            name, address, level,
            lat: parseFloat(lat) || 0,
            lng: parseFloat(lng) || 0,
            image: imagePath
        });
        res.json({ success: true, club });
    } catch (err) { next(err); }
};

exports.deleteClub = async (req, res, next) => {
    try {
        const clubId = req.params.id;
        const club = await Club.findByPk(clubId);
        if (!club) return res.status(404).json({ error: 'Club not found' });

        await User.update({ ClubId: null }, { where: { ClubId: clubId } });
        await club.destroy();
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.toggleBlock = async (req, res, next) => {
    try {
        const club = await Club.findByPk(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        club.status = club.status === 'active' ? 'blocked' : 'active';
        await club.save();
        res.json({ success: true, status: club.status });
    } catch (err) { next(err); }
};
