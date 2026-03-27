const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../database/models/User');
const Broadcast = require('../database/models/Broadcast');
const Club = require('../database/models/Club');
const config = require('../config/index');

exports.login = async (req, res, next) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });

    // Handle plain passwords if they are not hashed yet (for initial admin) or just use bcrypt
    // Senior note: In production, always hash. 
    let isMatch = false;
    if (password === user.password) {
        isMatch = true;
    } else {
        isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) return res.status(401).json({ success: false, message: 'Parol noto\'g\'ri' });

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
};

exports.registerPlayer = async (req, res, next) => {
    const { phone, password, clubId } = req.body;

    // Create user
    const user = await User.create({
        username: phone,
        password: password,
        role: 'player',
        ClubId: clubId,
        status: 'active'
    });

    let clubName = 'Noma\'lum Klub';
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
};

exports.ping = (req, res) => {
    res.json({ message: "GameZone API is running! 🚀", status: "Online", version: config.API_STABILITY_VERSION });
};
