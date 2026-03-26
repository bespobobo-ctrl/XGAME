const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🛡️ MODELLAR (Har birini alohida daxshatli - shunchaki to'g'ri import qilamiz)
const Club = require('../database/models/Club');
const User = require('../database/models/User');
const Session = require('../database/models/Session');
const PC = require('../database/models/Computer'); // Computer.js ekan! ✨
const Prize = { findAll: async () => [] }; // Prize modeli hozircha daxshatli - shunchaki vaqtinchalik dummy

// 🛡️ AUTH MIDDLEWARE
const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth failed' });
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'xgame_secret');
        next();
    } catch (e) { res.status(401).json({ error: 'Auth failed' }); }
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

// 🏛️ ADMIN: CLUBS
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

router.put('/admin/clubs/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, address, level, lat, lng, status } = req.body;
        const club = await Club.findByPk(req.params.id);
        if (!club) return res.status(404).json({ error: 'Not found' });
        const updateData = { name, address, level, lat, lng, status };
        if (req.file) updateData.image = `/uploads/${req.file.filename}`;
        await club.update(updateData);
        res.json({ success: true });
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
            status: m.status, ClubId: m.ClubId, clubName: m.Club?.name || '---'
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

router.put('/admin/managers/:id', auth, async (req, res) => {
    try {
        const { username, password, status, clubId } = req.body;
        const manager = await User.findByPk(req.params.id);
        const updateData = { username, status, ClubId: clubId };
        if (password) { updateData.password = password; updateData.rawPassword = password; }
        await manager.update(updateData);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user || user.password !== password) return res.status(401).json({ error: 'Auth failed' });
        const token = jwt.sign({ id: user.id, role: user.role, clubId: user.ClubId }, process.env.JWT_SECRET || 'xgame_secret');
        res.json({ success: true, token, role: user.role });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
