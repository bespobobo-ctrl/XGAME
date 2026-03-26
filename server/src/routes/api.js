const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🛡️ MODELLARNI TO'G'RI IMPORT QILISH (Hech narsa yo'qolmasligi uchun)
const Club = require('../database/models/Club');
const User = require('../database/models/User');
const Session = require('../database/models/Session');
const PC = require('../database/models/Computer');
const Room = require('../database/models/Room');

// 🛡️ AUTH MIDDLEWARE (NEXUS READY)
const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Auth failed' });
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
// 🛡️ UNIVERSAL LOGIN (NEXUS RECONCILED)
// ==========================================

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[LOGIN ATTEMPT] Username: ${username}`); // 🕵️‍♂️ Debug logs

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Login yoki parol xato! ❌' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Login yoki parol xato! ❌' });
        }

        // 🛡️ Token generatsiya (Role va ClubId bilan)
        const token = jwt.sign(
            { id: user.id, role: user.role, clubId: user.ClubId },
            process.env.JWT_SECRET || 'xgame_secret'
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role, clubId: user.ClubId }
        });
    } catch (err) {
        console.error('[LOGIN ERROR]', err);
        res.status(500).json({ success: false, message: 'Server xatosi! 🛑' });
    }
});

// ==========================================
// 🏠 PUBLIC & ADMIN ROUTES
// ==========================================

router.get('/clubs', async (req, res) => {
    try {
        const clubs = await Club.findAll({ order: [['id', 'DESC']] });
        res.json(clubs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
        const club = await Club.create({
            name,
            address,
            level,
            lat: parseFloat(lat) || 0,
            lng: parseFloat(lng) || 0,
            image: imagePath
        });
        res.json({ success: true, club });
    } catch (err) {
        console.error('[CREATE CLUB ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin/clubs/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, address, level, lat, lng, status } = req.body;
        const club = await Club.findByPk(req.params.id);
        if (!club) return res.status(404).json({ error: 'NotFound' });

        const updateData = {
            name,
            address,
            level,
            lat: parseFloat(lat) || club.lat,
            lng: parseFloat(lng) || club.lng,
            status
        };
        if (req.file) updateData.image = `/uploads/${req.file.filename}`;
        await club.update(updateData);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🛠️ DELETE CLUB
router.delete('/admin/clubs/:id', auth, async (req, res) => {
    try {
        const club = await Club.findByPk(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        await club.destroy();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🛠️ TOGGLE BLOCK CLUB
router.patch('/admin/clubs/:id/block', auth, async (req, res) => {
    try {
        const club = await Club.findByPk(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        club.status = club.status === 'active' ? 'blocked' : 'active';
        await club.save();
        res.json({ success: true, status: club.status });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin/stats', auth, async (req, res) => {
    try {
        const [totalClubs, totalManagers, activeSessions] = await Promise.all([
            Club.count(),
            User.count({ where: { role: 'manager' } }),
            Session.count({ where: { status: 'active' } })
        ]);

        // So'nggi 5 ta klub (History)
        const clubsHistory = await Club.findAll({
            attributes: ['name', 'createdAt', 'status'],
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            totalClubs,
            totalManagers,
            activeSessions,
            todayRevenue: 4500000,
            systemHealth: 'v9.2.4 (Stable)',
            serverLoad: '12%',
            clubsHistory
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🛠️ BROADCAST MESSAGE (Ichki tarqatish)
router.post('/admin/broadcast', auth, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        const Broadcast = require('../database/models/Broadcast');
        await Broadcast.create({ message });

        res.json({ success: true, message: 'Broadcast sent successfully!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
        // 🛡️ telegramId ni olib tashladik (model o'zi avtomatik generatsiya qiladi @User.js)
        await User.create({
            username,
            password,
            rawPassword: password,
            role: 'manager',
            ClubId: clubId,
            status: 'active'
        });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🛠️ UPDATE MANAGER
router.put('/admin/managers/:id', auth, async (req, res) => {
    try {
        const { username, password, clubId, status } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const updateData = { username, ClubId: clubId, status };
        if (password) {
            updateData.password = password;
            updateData.rawPassword = password;
        }
        await user.update(updateData);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🛠️ DELETE MANAGER
router.delete('/admin/managers/:id', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await user.destroy();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🛠️ TOGGLE BLOCK MANAGER
router.patch('/admin/managers/:id/block', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.status = user.status === 'active' ? 'blocked' : 'active';
        await user.save();
        res.json({ success: true, status: user.status });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 👤 MANAGER ROUTES
// ==========================================

router.post('/manager/setup', auth, async (req, res) => {
    try {
        const { rooms } = req.body;
        const clubId = req.user.clubId;
        for (const r of rooms) {
            const room = await Room.create({ name: r.name, price: r.price, ClubId: clubId });
            for (let i = 1; i <= r.pcCount; i++) {
                await PC.create({ name: `${r.name} - PC ${i}`, status: 'available', RoomId: room.id, ClubId: clubId });
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/pcs', auth, async (req, res) => {
    try {
        const pcs = await PC.findAll({ where: { ClubId: req.user.clubId }, order: [['id', 'ASC']] });
        res.json(pcs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
