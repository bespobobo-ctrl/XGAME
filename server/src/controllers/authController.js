const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../database/models/User');
const Broadcast = require('../database/models/Broadcast');
const Club = require('../database/models/Club');
const config = require('../config/index');

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user) return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Parol noto\'g\'ri' });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            config.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ success: true, token, role: user.role });
    } catch (err) { next(err); }
};

// 🎮 YANGI O'YINCHI RO'YXATDAN O'TISHI (Player Registration)
exports.registerPlayer = async (req, res, next) => {
    try {
        const { phone, password, clubId } = req.body;

        // 1. O'yinchini bazaga saqlaymiz (phone ni username o'rnida ishlatamiz)
        const user = await User.create({
            username: phone, // Username sifatida tel raqam saqlanadi
            password: password,
            rawPassword: password, // Xavfsizlik bo'yicha ehtiyot choralari bilan
            role: 'player',
            ClubId: clubId,
            status: 'active'
        });

        // Klub ma'lumotini xavfsiz izlash, agar bazadan topilmasa Error (crash) bermaydi!
        let clubName = 'Noma\'lum Klub';
        try {
            if (clubId) {
                const clubInfo = await Club.findByPk(clubId);
                if (clubInfo && clubInfo.name) clubName = clubInfo.name;
            }
        } catch (e) { /* Xatoni yutib yuboramiz va davom etamiz */ }

        // 2. Super Admin va Menejer uchun BILDIRISHNOMA (Notification) yuboramiz
        await Broadcast.create({
            message: `🎉 Yangi O'yinchi ro'yxatdan o'tdi!\nTel: ${phone}\nKlub: ${clubName}`,
            type: 'global',
            senderRole: 'system' // System yubormoqda
        });

        const token = jwt.sign(
            { id: user.id, role: 'player' },
            config.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ success: true, token, role: 'player' });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, error: 'Bu nomer allaqachon ro\'yxatdan o\'tgan!' });
        }
        next(err);
    }
};

exports.ping = (req, res) => {
    res.json({ message: "GameZone API is running! 🚀", status: "Online" });
};
