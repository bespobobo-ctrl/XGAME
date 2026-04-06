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
            where: { ComputerId: pc.id, status: ['active', 'paused'] },
            order: [['createdAt', 'DESC']] // Har doim eng so'nggisini o'qiymiz
        });

        // ⚠️ ENTI-FLICKER SYNC: Agar sessiya bo'lsa, statusni 'busy' qilib qotiramiz
        let effectiveStatus = pc.status;
        if (activeSession) {
            effectiveStatus = activeSession.status === 'paused' ? 'paused' : 'busy';
        } else {
            effectiveStatus = 'free';
        }

        console.log(`🔒 SYNC [PC-${pc.id}]: Database says ${activeSession ? 'ACTIVE' : 'NONE'}, Reporting ${effectiveStatus}`);

        pc.status = effectiveStatus;
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
