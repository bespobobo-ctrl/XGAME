const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../database/models/User');
const Broadcast = require('../database/models/Broadcast');
const Club = require('../database/models/Club');
const config = require('../config/index');

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username va parol kiritilishi shart' });
        }

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ success: false, message: 'Hisobingiz bloklangan' });
        }

        // Faqat bcrypt orqali tekshirish (xavfsiz)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Parol noto'g'ri" });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            config.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                ClubId: user.ClubId
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.registerPlayer = async (req, res, next) => {
    try {
        const { phone, password, clubId } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ success: false, message: 'Telefon va parol kiritilishi shart' });
        }

        // Mavjudligini tekshirish
        const existing = await User.findOne({ where: { username: phone } });
        if (existing) {
            return res.status(409).json({ success: false, message: "Bu telefon raqami allaqachon ro'yxatdan o'tgan" });
        }

        const user = await User.create({
            username: phone,
            password: password,
            role: 'player',
            ClubId: clubId || null,
            status: 'active'
        });

        let clubName = "Noma'lum Klub";
        if (clubId) {
            const clubInfo = await Club.findByPk(clubId);
            if (clubInfo) clubName = clubInfo.name;
        }

        // System Notification
        await Broadcast.create({
            message: `🎉 Yangi O'yinchi ro'yxatdan o'tdi!\nTel: ${phone}\nKlub: ${clubName}`,
            type: 'global',
            senderRole: 'system'
        });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: 'player' },
            config.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ success: true, token, role: 'player' });
    } catch (err) {
        next(err);
    }
};

exports.ping = (req, res) => {
    res.json({
        message: "GameZone API is running! 🚀",
        status: "Online",
        version: config.API_STABILITY_VERSION
    });
};
