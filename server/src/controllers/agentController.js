const { Computer, Session } = require('../shared/database');
const crypto = require('crypto');

/**
 * 🔗 PC Agentni tizimga bog'lash (Pairing)
 * POST /api/agent/pair
 */
exports.pairAgent = async (req, res, next) => {
    try {
        const { pairingCode, macAddress } = req.body;

        if (!pairingCode) {
            return res.status(400).json({ success: false, message: 'Pairing code kiritilmadi' });
        }

        const pc = await Computer.findOne({ where: { pairingCode } });

        if (!pc) {
            return res.status(404).json({ success: false, message: "Noto'g'ri yoki muddati o'tgan kod" });
        }

        const agentToken = crypto.randomBytes(32).toString('hex');

        pc.macAddress = macAddress || pc.macAddress;
        pc.agentToken = agentToken;
        pc.pairingCode = null;
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

        const { status } = req.body;

        // 🔄 FINAL SYNC check for active sessions
        const activeSession = await Session.findOne({
            where: { ComputerId: pc.id, status: ['active', 'paused'] }
        });

        // Agar sessiya bo'lsa - status har doim 'busy' yoki 'paused' bo'ladi
        let effectiveStatus = pc.status;
        if (activeSession) {
            effectiveStatus = activeSession.status === 'paused' ? 'paused' : 'busy';
            if (pc.status !== effectiveStatus) {
                pc.status = effectiveStatus;
            }
        } else if (status && (pc.status === 'free' || pc.status === 'offline')) {
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
                status: effectiveStatus
            }
        });
    } catch (err) {
        next(err);
    }
};
