const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🛡️ MODELLAR (Bitta joyga jamlaymiz)
const Club = require('../database/models/Club');
const User = require('../database/models/User');
const Session = require('../database/models/Session');
const PC = require('../database/models/Computer');
const Room = require('../database/models/Room');

// 🛡️ AUTH MIDDLEWARE
const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Token topilmadi!' });
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'xgame_secret');
        next();
    } catch (e) {
        res.status(401).json({ error: 'Auth failed' });
    }
};

// 📸 MULTER CONFIG
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'club_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ==========================================
// 🏠 PUBLIC ROUTES (O'yinchilar uchun)
// ==========================================

router.get('/clubs', async (req, res) => {
    try {
        const clubs = await Club.findAll({ where: { status: 'active' }, order: [['id', 'DESC']] });
        res.json(clubs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 🛡️ AUTH & LOGIN
// ==========================================

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user || user.password !== password) return res.status(401).json({ error: 'Login yoki parol xato!' });

        const token = jwt.sign({ id: user.id, role: user.role, clubId: user.ClubId }, process.env.JWT_SECRET || 'xgame_secret');
        res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 🏛️ SUPER ADMIN ROUTES
// ==========================================

router.get('/admin/clubs', auth, async (req, res) => {
    try {
        const clubs = await Club.findAll({ order: [['id', 'DESC']] });
        res.json(clubs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin/clubs', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, address, level, lat, lng } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/default_club.png';
        const club = await Club.create({ name, address, level, lat, lng, image: imagePath });
        res.json({ success: true, club });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 📊 ADMIN: STATS
router.get('/admin/stats', auth, async (req, res) => {
    try {
        const totalClubs = await Club.count();
        const totalManagers = await User.count({ where: { role: 'manager' } });
        const clubsHistory = await Club.findAll({ attributes: ['name', 'createdAt'], order: [['createdAt', 'DESC']] });
        res.json({ totalClubs, totalManagers, todayRevenue: 4500000, activeUsers: 142, clubsHistory });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 👤 ADMIN: MANAGERS
router.get('/admin/managers', auth, async (req, res) => {
    try {
        const managers = await User.findAll({
            where: { role: 'manager' },
            include: [{ model: Club, attributes: ['name'] }]
        });
        res.json(managers.map(m => ({
            id: m.id, username: m.username, rawPassword: m.rawPassword,
            status: m.status, ClubId: m.ClubId, clubName: m.Club ? m.Club.name : '---'
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin/managers', auth, async (req, res) => {
    try {
        const { username, password, clubId } = req.body;
        await User.create({ username, password, rawPassword: password, role: 'manager', ClubId: clubId, status: 'active', telegramId: '0' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 👤 MANAGER ROUTES (Klub Sozlash)
// ==========================================

router.post('/manager/setup', auth, async (req, res) => {
    try {
        const { rooms } = req.body;
        const clubId = req.user.clubId;
        if (!clubId) return res.status(400).json({ error: 'Sizda klub biriktirilmagan!' });

        for (const r of rooms) {
            const room = await Room.create({ name: r.name, price: r.price, ClubId: clubId });
            for (let i = 1; i <= r.pcCount; i++) {
                await PC.create({ name: `${r.name} - PC ${i}`, status: 'available', RoomId: room.id, ClubId: clubId });
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PC'larni olish (Menejer uchun)
router.get('/pcs', auth, async (req, res) => {
    try {
        const pcs = await PC.findAll({ where: { ClubId: req.user.clubId }, order: [['id', 'ASC']] });
        res.json(pcs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
