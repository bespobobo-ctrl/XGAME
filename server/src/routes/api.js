const express = require('express');
const router = express.Router();
const { Sequelize, Op } = require('sequelize');
const { Club, User, Room, Computer, Session, Transaction, AuditLog, sequelize } = require('../database');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { auth, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role, ClubId: user.ClubId },
        process.env.JWT_SECRET || 'XGAME_SECRET_2026',
        { expiresIn: '30d' }
    );
};

// 🔐 LOGIN API
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // DEBUG LOGGING (Terminalda ko'rish uchun)
        console.log('Login Attempt Received:', { username, password });

        // SUPER ADMIN CHECK (123 / 123) - SUPER RELAXED FORCED
        if (String(username) === '123' && String(password) === '123') {
            console.log('Master Admin Login Success! 🥂');
            const token = jwt.sign(
                { id: 0, username: 'Master Admin', role: 'super_admin' },
                process.env.JWT_SECRET || 'XGAME_SECRET_2026',
                { expiresIn: '30d' }
            );
            return res.json({
                success: true,
                user: { id: 0, username: 'Master Admin', role: 'super_admin' },
                token
            });
        }

        // CLUB ADMIN (MANAGER) CHECK
        const user = await User.findOne({ where: { username } });
        if (user && await user.comparePassword(password)) {
            const token = generateToken(user);
            return res.json({ success: true, user, token });
        } else {
            return res.status(401).json({ success: false, message: 'Xato login yoki parol!' });
        }
    } catch (err) {
        logger.error('Login Error:', err);
        res.status(500).json({ error: 'Serverda xatolik yuz berdi.' });
    }
});

// 🏢 PUBLIC API: CLUBS LIST
router.get('/clubs', async (req, res) => {
    try {
        const clubs = await Club.findAll({ where: { status: 'active' } });
        res.json(clubs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/clubs/:id', async (req, res) => {
    try {
        const club = await Club.findByPk(req.params.id, { include: [Room] });
        res.json(club);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🏠 ROOMS & PCS
router.get('/rooms/:roomId/computers', async (req, res) => {
    try {
        const computers = await Computer.findAll({ where: { RoomId: req.params.roomId } });
        res.json(computers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ⚙️ MANAGER SETUP (Questions & Initial Config)
router.post('/manager/setup', auth, async (req, res) => {
    const { rooms } = req.body; // Array: [{ name, pcCount, price }]
    const userId = req.user.id;
    const t = await sequelize.transaction();

    try {
        const user = await User.findByPk(userId);
        if (!user || !user.ClubId || user.role !== 'manager') throw new Error('Ruxsat yoq yoki klub egasi emassiz!');

        // Delete existing setup to overwrite
        await Room.destroy({ where: { ClubId: user.ClubId } }, { transaction: t });

        for (const data of rooms) {
            const room = await Room.create({
                name: data.name,
                ClubId: user.ClubId,
                basePrice: data.price || 15000
            }, { transaction: t });

            for (let i = 1; i <= data.pcCount; i++) {
                await Computer.create({
                    name: `PC-${String(i).padStart(2, '0')}`,
                    RoomId: room.id,
                    status: 'free'
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ success: true, message: 'Klub muvaffaqiyatli sozlandi!' });
    } catch (err) {
        await t.rollback();
        res.status(400).json({ error: err.message });
    }
});

// 📊 SUPER ADMIN MANAGEMENT
router.get('/admin/stats', auth, authorize('super_admin'), async (req, res) => {
    const totalClubs = await Club.count();
    const totalUsers = await User.count();
    res.json({ totalClubs, totalUsers });
});

router.get('/admin/clubs', auth, authorize('super_admin'), async (req, res) => {
    const clubs = await Club.findAll();
    res.json(clubs);
});

router.post('/admin/clubs', auth, authorize('super_admin'), upload.single('image'), async (req, res) => {
    try {
        const { name, address } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        const club = await Club.create({ name, address, image: imagePath });
        res.json({ success: true, club });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/admin/managers', auth, authorize('super_admin'), async (req, res) => {
    try {
        const managers = await User.findAll({ where: { role: 'manager' } });
        res.json(managers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/admin/managers', auth, authorize('super_admin'), async (req, res) => {
    try {
        const { username, password, clubId } = req.body;

        // Login bandligini tekshirish
        const existing = await User.findOne({ where: { username } });
        if (existing) return res.status(400).json({ success: false, message: 'Bu login band! 🚫' });

        const user = await User.create({
            username,
            password,
            role: 'manager',
            ClubId: clubId,
            telegramId: `M-${Date.now()}` // Menejerlar uchun vaqtinchalik ID
        });

        res.json({ success: true, user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.post('/start-session', auth, async (req, res) => {
    const { computerId } = req.body;
    const computer = await Computer.findByPk(computerId);
    if (!computer || computer.status !== 'free') return res.status(400).json({ error: 'PC band!' });

    computer.status = 'busy';
    await computer.save();

    const session = await Session.create({ ComputerId: computerId, UserId: req.user.id, status: 'active' });

    const io = req.app.get('io');
    if (io) io.to(computer.name).emit('unlock');

    res.json({ success: true, session });
});

router.post('/stop-session', auth, async (req, res) => {
    const { computerId } = req.body;
    const computer = await Computer.findByPk(computerId);
    if (!computer) return res.status(404).json({ error: 'PC topilmadi' });

    computer.status = 'free';
    await computer.save();

    const session = await Session.findOne({ where: { ComputerId: computerId, status: 'active' } });
    if (session) {
        session.status = 'closed';
        session.endTime = new Date();
        await session.save();
    }

    const io = req.app.get('io');
    if (io) io.to(computer.name).emit('lock');

    res.json({ success: true });
});

module.exports = router;
