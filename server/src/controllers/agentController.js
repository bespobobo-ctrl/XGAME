const { Computer } = require('../shared/database');
const jwt = require('jsonwebtoken');
const config = require('../config/index');
const crypto = require('crypto');

/**
 * 🔗 PC Agentni tizimga bog'lash (Pairing)
 * POST /api/agent/pair
 */
exports.pairAgent = async (req, res, next) => {
    try {
        const { pairingCode, macAddress, hostname } = req.body;

        if (!pairingCode) {
            return res.status(400).json({ success: false, message: 'Pairing code kiritilmadi' });
        }

        // 1. Shu kodga ega kompyuterni topish
        const pc = await Computer.findOne({ where: { pairingCode } });

        if (!pc) {
            return res.status(404).json({ success: false, message: "Noto'g'ri yoki muddati o'tgan kod" });
        }

        // 2. Agent uchun maxfiy Token va ID yaratish
        const agentToken = crypto.randomBytes(32).toString('hex');

        // 3. Bazani yangilash
        pc.macAddress = macAddress || pc.macAddress;
        // pc.name = hostname || pc.name; // Keep the original PC name (e.g. PC-1)
        pc.agentToken = agentToken;
        pc.pairingCode = null; // Bir marta ishlatilgandan so'ng o'chiriladi
        pc.status = 'free';
        pc.lastOnline = new Date();
        await pc.save();

        res.json({
            success: true,
            message: 'PC muvaffaqiyatli bog\'landi',
            agentToken,
            pcDetails: {
                id: pc.id,
                name: pc.name,
                ClubId: pc.ClubId,
                RoomId: pc.RoomId
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * 💓 Agent Heartbeat (Status Update)
 * POST /api/agent/status
 */
exports.updateStatus = async (req, res, next) => {
    try {
        const authHeader = req.headers['x-agent-token'];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Agent token topilmadi' });
        }

        const pc = await Computer.findOne({ where: { agentToken: authHeader } });
        if (!pc) {
            return res.status(403).json({ success: false, message: 'Yaroqsiz token' });
        }

        const { status, metrics } = req.body;

        // Agar status yuborilgan bo'lsa va PC hozir band bo'lmasa, uni yangilaymiz
        // (Sessiya vaqtida agent statusni o'zgartirmasligi kerak)
        if (status && (pc.status === 'free' || pc.status === 'offline')) {
            pc.status = status;
        }

        pc.lastOnline = new Date();
        await pc.save();

        res.json({
            success: true,
            serverTime: new Date(),
            pcDetails: {
                id: pc.id,
                name: pc.name,
                status: pc.status
            },
            commands: []
        });
    } catch (err) {
        next(err);
    }
};
