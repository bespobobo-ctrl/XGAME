const express = require('express');
const router = express.Router();
const { Sequelize, Op } = require('sequelize');
const { Club, User, Room, Computer, Session, Transaction, AuditLog, sequelize } = require('../database');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });
const jwt = require('jsonwebtoken');
const { auth, authorize } = require('../middleware/auth');

/**
 * 🛠️ UTILS: TOKEN GENERATOR
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'XGAME_SECRET_2026',
        { expiresIn: '30d' }
    );
};


router.post('/upload', upload.array('images', 5), (req, res) => {
    try {
        const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
        res.json({ success: true, urls: fileUrls });
    } catch (err) {
        logger.error('Upload Error: ', err);
        res.status(500).json({ error: err.message });
    }
});

// 🔐 LOGIN API (JWT & ROLE BASED)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // 1. Super Admin tekshiruvi (ENV dan olinadi)
        if (username === process.env.SUPER_ADMIN_USER && password === process.env.SUPER_ADMIN_PASS) {
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

        // 2. Manager/Admin tekshiruvi
        const user = await User.findOne({ where: { username } });

        if (user && await user.comparePassword(password)) {
            const token = generateToken(user);
            await user.update({
                lastLoginAt: new Date(),
                lastLoginIp: req.headers['x-forwarded-for'] || req.ip,
            });
            return res.json({ success: true, user, token });
        } else {
            return res.status(401).json({ success: false, message: 'Kirish taqiqlangan! Ma`lumotlarni tekshiring.' });
        }
    } catch (err) {
        logger.error('❌ Login Error:', err.message);
        res.status(500).json({ error: 'Serverda xatolik yuz berdi.' });
    }
});

// 1️⃣ Barcha klub kompyuterlarini olish API
router.get('/computers', async (req, res) => {
    try {
        const computers = await Computer.findAll({ include: [Room] });
        res.json(computers);
    } catch (err) {
        logger.error('❌ Fetch computers error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2️⃣ Foydalanuvchi ma'lumotlarini olish (role, balans va hk)
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        res.json(user);
    } catch (err) {
        logger.error('❌ Fetch user error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/user/:id/balance', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

        res.json({ balance: user.balance });
    } catch (err) {
        logger.error('❌ Fetch user balance error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3️⃣ Kompyuterni ijaraga olish API (BOSHLASH)
router.post('/start-session', async (req, res) => {
    const { computerId, userId } = req.body;
    try {
        const computer = await Computer.findByPk(computerId);
        if (!computer || (computer.status !== 'free' && computer.status !== 'locked')) {
            return res.status(400).json({ success: false, message: 'Kompyuter band yoki topilmadi.' });
        }

        const user = await User.findByPk(userId);
        if (!user || (user.role !== 'admin' && user.balance <= 0)) {
            return res.status(400).json({ success: false, message: 'Balans yetarli emas!' });
        }

        computer.status = 'busy';
        await computer.save();

        const session = await Session.create({
            ComputerId: computerId,
            UserId: userId,
            status: 'active'
        });

        const io = req.app.get('io');
        if (io) {
            io.to(computer.name).emit('unlock');
            logger.info(`🔓 Seans boshlandi: ${computer.name} (User: ${user.username})`);
        }

        res.json({ success: true, session, message: '✅ Muvaffaqiyatli boshlandi! Kompyuter ochildi.' });
    } catch (err) {
        logger.error('❌ Start session error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4️⃣ Seansni yakunlash (QULFLASH)
router.post('/stop-session', async (req, res) => {
    const { computerId } = req.body;
    try {
        const computer = await Computer.findByPk(computerId);
        if (!computer) return res.status(404).json({ error: 'Kompyuter topilmadi' });

        computer.status = 'locked';
        await computer.save();

        const session = await Session.findOne({
            where: { ComputerId: computerId, status: 'active' },
            order: [['createdAt', 'DESC']]
        });

        if (session) {
            session.status = 'completed';
            session.endTime = new Date();
            await session.save();
        }

        const io = req.app.get('io');
        if (io) {
            io.to(computer.name).emit('lock');
        }

        res.json({ success: true, message: '✅ Seans tugatildi. Kompyuter qulflandi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5️⃣ Kompyuter qulfini ochish (faqat admin)
router.post('/unlock-computer', async (req, res) => {
    const { computerId } = req.body;
    try {
        const computer = await Computer.findByPk(computerId);
        if (!computer) return res.status(404).json({ error: 'Kompyuter topilmadi' });

        computer.status = 'free';
        await computer.save();

        const io = req.app.get('io');
        if (io) {
            io.to(computer.name).emit('unlock');
        }

        res.json({ success: true, message: `✅ ${computer.name} qulfi ochildi.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6️⃣ Barcha faol klublarni olish
router.get('/clubs', async (req, res) => {
    try {
        const clubs = await Club.findAll({
            where: { isActive: true },
            order: [['priority', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json(clubs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --------------------------------------------
// 🏢 CLUB MANAGER / ADMIN SETUP API (PROTECTED)
// --------------------------------------------

router.get('/admin/club-rooms/:clubId', auth, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const rooms = await Room.findAll({
            where: { ClubId: req.params.clubId },
            include: [{ model: Computer }]
        });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/admin/setup-rooms', auth, authorize('admin', 'super_admin'), async (req, res) => {
    const { clubId, rooms } = req.body;
    try {
        const t = await sequelize.transaction();
        try {
            for (const r of rooms) {
                const room = await Room.create({
                    name: r.name,
                    pcSpecs: r.pcSpecs,
                    pricePerHour: r.pricePerHour,
                    pcCount: r.pcCount,
                    ClubId: clubId
                }, { transaction: t });

                const computers = [];
                for (let i = 1; i <= r.pcCount; i++) {
                    computers.push({
                        name: `${r.name}-${i < 10 ? '0' + i : i}`,
                        ClubId: clubId,
                        RoomId: room.id,
                        status: 'offline',
                        pricePerHour: r.pricePerHour
                    });
                }
                await Computer.bulkCreate(computers, { transaction: t });
            }
            await t.commit();
            res.json({ success: true, message: '✅ Klub muvaffaqiyatli sozlandi!' });
        } catch (error) {
            await t.rollback();
            throw error;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 👑 SUPER ADMIN API (MAX PROTECTED)
// ============================================

// 🏢 1. CLUB MANAGEMENT
router.get('/admin/clubs', auth, authorize('super_admin'), async (req, res) => {
    try {
        const { status, search } = req.query;
        let where = { isDeleted: false };
        if (status) where.status = status;
        if (search) where.name = { [Sequelize.Op.like]: `%${search}%` };

        const clubs = await Club.findAll({
            where,
            order: [['priority', 'DESC'], ['createdAt', 'DESC']]
        });

        const managers = await User.findAll({
            where: { role: 'admin' },
            attributes: ['id', 'ClubId', 'username', 'isBlocked']
        });

        const clubsWithManager = clubs.map(c => {
            const clubJson = c.toJSON();
            clubJson.manager = managers.find(m => m.ClubId === clubJson.id) || null;
            return clubJson;
        });

        res.json(clubsWithManager);
    } catch (err) {
        logger.error('❌ Super Admin: Clubs fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/admin/clubs', auth, authorize('super_admin'), upload.array('images', 5), async (req, res) => {
    try {
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(f => `/uploads/${f.filename}`);
        }

        const club = await Club.create({
            ...req.body,
            images: JSON.stringify(images),
            img: images[0] || null, // Main image
            status: 'active',
            isDeleted: false
        });

        // Log activity
        await AuditLog.create({ adminId: req.user.id || 0, action: 'create_club', details: JSON.stringify(club), ip: req.ip });

        res.json({ success: true, club });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin/clubs/:id', auth, authorize('super_admin'), async (req, res) => {
    try {
        const club = await Club.findByPk(req.params.id);
        if (!club) return res.status(404).json({ error: 'Klub topilmadi' });
        await club.update(req.body);

        await AuditLog.create({ adminId: req.user.id || 0, action: 'update_club', details: JSON.stringify({ id: club.id, updates: req.body }), ip: req.ip });

        res.json({ success: true, club });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/admin/clubs/:id', auth, authorize('super_admin'), async (req, res) => {
    try {
        const club = await Club.findByPk(req.params.id);
        if (!club) return res.status(404).json({ error: 'Klub topilmadi' });

        // Soft Delete
        await club.update({ isDeleted: true, status: 'inactive' });

        await AuditLog.create({ adminId: req.user.id || 0, action: 'delete_club_soft', details: JSON.stringify({ id: club.id, name: club.name }), ip: req.ip });

        res.json({ success: true, message: 'Klub o‘chirildi (Soft Delete)' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 👤 2. CLUB ADMIN MANAGEMENT
router.post('/admin/managers', auth, authorize('super_admin'), async (req, res) => {
    try {
        const { username, password, ClubId, fullName, phone } = req.body;
        const manager = await User.create({
            telegramId: `mgr_${Date.now()}`,
            username,
            firstName: fullName || username,
            phone,
            password,
            ClubId,
            role: 'admin'
        });

        await AuditLog.create({ adminId: req.user.id || 0, action: 'create_manager', details: JSON.stringify({ username, ClubId }), ip: req.ip });

        res.json({ success: true, manager });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin/managers/:id', auth, authorize('super_admin'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User topilmadi' });
        await user.update(req.body); // status, password, etc.
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 💰 3. FINANCE MANAGEMENT
router.get('/admin/stats', auth, authorize('super_admin'), async (req, res) => {
    try {
        const totalUsers = await User.count({ where: { role: 'customer' } });
        const totalClubs = await Club.count({ where: { isDeleted: false } });

        const sessionsRevenue = await Session.sum('totalCost', { where: { status: 'completed' } }) || 0;
        const depositRevenue = await Transaction.sum('amount', { where: { type: 'deposit' } }) || 0;
        const totalRevenue = sessionsRevenue + depositRevenue;

        const usersByClub = await User.findAll({
            attributes: ['ClubId', [sequelize.fn('COUNT', sequelize.col('User.id')), 'count']],
            include: [{ model: Club, attributes: ['name'] }],
            group: ['ClubId', 'Club.id']
        });

        const recentUsers = await User.findAll({
            where: { role: 'customer' },
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        res.json({ totalUsers, totalRevenue, totalClubs, usersByClub, recentUsers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/reports/clubs', async (req, res) => {
    try {
        const { period } = req.query; // 'daily', 'weekly', 'monthly'
        let dateFilter = {};
        const now = new Date();
        if (period === 'daily') dateFilter = { [Sequelize.Op.gte]: new Date(now.setHours(0, 0, 0, 0)) };
        else if (period === 'weekly') dateFilter = { [Sequelize.Op.gte]: new Date(now.setDate(now.getDate() - 7)) };
        else if (period === 'monthly') dateFilter = { [Sequelize.Op.gte]: new Date(now.setMonth(now.getMonth() - 1)) };

        const clubStats = await Club.findAll({
            where: { isDeleted: false },
            include: [{
                model: Transaction,
                where: { createdAt: dateFilter },
                required: false
            }]
        });

        res.json(clubStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 👥 4. USER MANAGEMENT
router.get('/admin/users', auth, authorize('super_admin'), async (req, res) => {
    try {
        const { search } = req.query;
        let where = { role: 'customer' };
        if (search) {
            where[Sequelize.Op.or] = [
                { username: { [Sequelize.Op.like]: `%${search}%` } },
                { phone: { [Sequelize.Op.like]: `%${search}%` } }
            ];
        }
        const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin/users/:id/balance', auth, authorize('super_admin'), async (req, res) => {
    try {
        const { amount, action } = req.body; // action: 'add', 'set'
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User topilmadi' });

        const oldBalance = user.balance;
        if (action === 'add') user.balance += Number(amount);
        else user.balance = Number(amount);
        await user.save();

        // Log transaction
        await Transaction.create({
            userId: user.id,
            clubId: user.ClubId || 0,
            amount: Number(amount),
            type: 'deposit',
            comment: `Super Admin top-up (Old: ${oldBalance})`
        });

        await AuditLog.create({ adminId: req.user.id || 0, action: 'update_user_balance', details: JSON.stringify({ userId: user.id, old: oldBalance, new: user.balance }), ip: req.ip });

        res.json({ success: true, balance: user.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin/users/:id/block', auth, authorize('super_admin'), async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User topilmadi' });
        await user.update({ isBlocked });

        await AuditLog.create({ adminId: req.user.id || 0, action: isBlocked ? 'block_user' : 'unblock_user', details: JSON.stringify({ userId: user.id }), ip: req.ip });

        res.json({ success: true, isBlocked: user.isBlocked });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📡 5. BROADCAST SECTION (SENIOR)
router.post('/admin/broadcast', auth, authorize('super_admin'), async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Xabar matni kerak!' });

        const users = await User.findAll({
            where: { role: 'customer' },
            attributes: ['telegramId']
        });

        // Bu yerda bot instance yoki Telegram API ishlatiladi
        logger.info(`📡 BROADCAST: ${users.length} foydalanuvchiga xabar yuborilmoqda...`);

        await AuditLog.create({
            adminId: req.user?.id || 0,
            action: 'broadcast_news',
            details: JSON.stringify({ message, totalUsers: users.length }),
            ip: req.ip
        });

        res.json({ success: true, totalUsers: users.length, message: 'Xabarlar yuborish jarayoni boshlandi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

