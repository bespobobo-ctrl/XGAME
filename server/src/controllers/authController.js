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

exports.telegramAuth = async (req, res, next) => {
    try {
        const { tgUser, clubId } = req.body;
        if (!tgUser || !tgUser.id) {
            return res.status(400).json({ success: false, message: "Telegram ma'lumoti yo'q" });
        }

        let user = await User.findOne({ where: { telegramId: tgUser.id.toString() } });
        let isNew = false;

        if (!user) {
            isNew = true;
            const count = await User.count({ where: { username: { [Op.like]: 'gamer%' } } });
            let username = `gamer_${count + 1}`;

            user = await User.create({
                telegramId: tgUser.id.toString(),
                firstName: tgUser.first_name || '',
                lastName: tgUser.last_name || '',
                username: username,
                role: 'customer',
                ClubId: clubId || null,
                status: 'active'
            });

            let clubName = "Noma'lum Klub";
            if (clubId) {
                const clubInfo = await Club.findByPk(clubId);
                if (clubInfo) clubName = clubInfo.name;
            }

            await Broadcast.create({
                message: `🎉 Yangi O'yinchi(Telegram) ro'yxatdan o'tdi!\nIsmi: ${tgUser.first_name}\nKlub: ${clubName}`,
                type: 'global',
                senderRole: 'system'
            });
        } else {
            // Agar boshqa klubga o'tgan bo'lsa, ClubId ni almashtiramiz
            if (clubId && user.ClubId != clubId) {
                user.ClubId = clubId;
            }
            user.lastLogin = new Date();
            await user.save();
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            config.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            isNew,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                ClubId: user.ClubId,
                telegramId: user.telegramId
            }
        });
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
