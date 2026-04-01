const Club = require('../database/models/Club');
const User = require('../database/models/User');
const Room = require('../database/models/Room');
const Computer = require('../database/models/Computer');
const Session = require('../database/models/Session');
const Transaction = require('../database/models/Transaction');
const sequelize = require('../config/database');

exports.getAllClubs = async (req, res, next) => {
    try {
        const clubs = await Club.findAll({
            attributes: ['id', 'name', 'address', 'level', 'image', 'images', 'lat', 'lng', 'price', 'description', 'status'],
            order: [['id', 'DESC']]
        });
        res.json(clubs);
    } catch (err) {
        next(err);
    }
};

exports.createClub = async (req, res, next) => {
    try {
        const { name, address, level, lat, lng } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Klub nomi kiritilishi shart' });
        }

        const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/default_club.png';
        const club = await Club.create({
            name, address, level,
            lat: parseFloat(lat) || 0,
            lng: parseFloat(lng) || 0,
            image: imagePath
        });
        res.json({ success: true, club });
    } catch (err) {
        next(err);
    }
};

exports.updateClub = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, address, level, lat, lng } = req.body;

        const club = await Club.findByPk(id);
        if (!club) return res.status(404).json({ error: 'Club not found' });

        const updateData = {
            name: name || club.name,
            address: address || club.address,
            level: level || club.level,
            lat: parseFloat(lat) || club.lat,
            lng: parseFloat(lng) || club.lng
        };

        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }

        await club.update(updateData);
        res.json({ success: true, club });
    } catch (err) {
        next(err);
    }
};

exports.deleteClub = async (req, res, next) => {
    const clubId = req.params.id;
    const t = await sequelize.transaction();

    try {
        const club = await Club.findByPk(clubId, { transaction: t });
        if (!club) {
            await t.rollback();
            return res.status(404).json({ error: 'Club not found' });
        }

        // Tartib bilan o'chirish (foreign key dependency order)
        // 1. Sessiyalarni o'chirish (Computer va User ga bog'liq)
        await Session.destroy({ where: { ClubId: clubId }, transaction: t });

        // 2. Tranzaksiyalarni o'chirish
        await Transaction.destroy({ where: { ClubId: clubId }, transaction: t });

        // 3. Kompyuterlarni o'chirish (Room ga bog'liq)
        await Computer.destroy({ where: { ClubId: clubId }, transaction: t });

        // 4. Xonalarni o'chirish
        await Room.destroy({ where: { ClubId: clubId }, transaction: t });

        // 5. Menegerlarni o'chirish
        await User.destroy({ where: { ClubId: clubId, role: 'manager' }, transaction: t });

        // 6. Xaridorlarni klubdan ozod qilish
        await User.update({ ClubId: null }, { where: { ClubId: clubId, role: 'customer' }, transaction: t });

        // 7. Klubni o'chirish
        await club.destroy({ transaction: t });

        await t.commit();
        res.json({ success: true, message: 'Klub va unga tegishli barcha maʼlumotlar tozalandi.' });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};

exports.toggleBlock = async (req, res, next) => {
    try {
        const club = await Club.findByPk(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        club.status = club.status === 'active' ? 'blocked' : 'active';
        await club.save();
        res.json({ success: true, status: club.status });
    } catch (err) {
        next(err);
    }
};
