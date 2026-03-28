const Club = require('../database/models/Club');
const User = require('../database/models/User');
const Room = require('../database/models/Room');
const Computer = require('../database/models/Computer');
const Session = require('../database/models/Session');
const Transaction = require('../database/models/Transaction');

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

    // 🧹 KLUBNI O'CHIRISHDAN OLDIN UNGA BOG'LIQ HAMMA NARSANI TOZALASH
    // 1. Menegerlarni o'chirish
    await User.destroy({ where: { ClubId: clubId, role: 'manager' } });

    // 2. Xonalarni o'chirish
    await Room.destroy({ where: { ClubId: clubId } });

    // 3. Kompyuterlarni o'chirish
    await Computer.destroy({ where: { ClubId: clubId } });

    // 4. Sessiyalarni o'chirish
    await Session.destroy({ where: { ClubId: clubId } });

    // 5. Tranzaksiyalarni o'chirish
    await Transaction.destroy({ where: { ClubId: clubId } });

    // 6. Xaridorlarni klubdan ozod qilish (ular o'chmaydi, faqat klubi null bo'ladi)
    await User.update({ ClubId: null }, { where: { ClubId: clubId, role: 'customer' } });

    // 7. Va nihoyat klubni o'zini o'chirish
    await club.destroy();

    res.json({ success: true, message: 'Klub va unga tegishli barcha maʼlumotlar tozalandi.' });
};

exports.toggleBlock = async (req, res, next) => {
    const club = await Club.findByPk(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    club.status = club.status === 'active' ? 'blocked' : 'active';
    await club.save();
    res.json({ success: true, status: club.status });
};
