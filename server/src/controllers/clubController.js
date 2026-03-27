const Club = require('../database/models/Club');
const User = require('../database/models/User');

exports.getAllClubs = async (req, res, next) => {
    const clubs = await Club.findAll({ order: [['id', 'DESC']] });
    res.json(clubs);
};

exports.createClub = async (req, res, next) => {
    const { name, address, level, lat, lng } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/default_club.png';
    const club = await Club.create({
        name, address, level,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        image: imagePath
    });
    res.json({ success: true, club });
};

exports.updateClub = async (req, res, next) => {
    const { id } = req.params;
    const { name, address, level, lat, lng } = req.body;

    const club = await Club.findByPk(id);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const updateData = {
        name, address, level,
        lat: parseFloat(lat) || club.lat,
        lng: parseFloat(lng) || club.lng
    };

    if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
    }

    await club.update(updateData);
    res.json({ success: true, club });
};

exports.deleteClub = async (req, res, next) => {
    const clubId = req.params.id;
    const club = await Club.findByPk(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    await User.update({ ClubId: null }, { where: { ClubId: clubId } });
    await club.destroy();
    res.json({ success: true });
};

exports.toggleBlock = async (req, res, next) => {
    const club = await Club.findByPk(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    club.status = club.status === 'active' ? 'blocked' : 'active';
    await club.save();
    res.json({ success: true, status: club.status });
};
