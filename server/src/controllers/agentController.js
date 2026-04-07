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
        } else if (pc.status === 'busy' || pc.status === 'paused') {
            // Manager tomonidan qo'lda ochilgan (Sessiya rekordsiz) — shunday qolsin!
            effectiveStatus = pc.status;
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

/**
 * 🔑 Agent Manual Login (Username / Password)
 * POST /api/agent/login
 */
exports.manualLogin = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const agentToken = req.headers['x-agent-token'];

        if (!agentToken) return res.status(401).json({ success: false, message: 'Agent unauthorized' });

        const pc = await Computer.findOne({ where: { agentToken } });
        if (!pc) return res.status(403).json({ success: false, message: 'Invalid Agent' });

        const { User } = require('../shared/database');
        const user = await User.findOne({ where: { username } });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Login yoki parol xato!' });
        }

        // Faqat Manager yoki balansga ega userlar ochishi mumkin
        if (user.role !== 'manager' && user.role !== 'super_admin' && (user.balance || 0) < 1000) {
            return res.status(403).json({ success: false, message: 'Balansingiz yetarli emas!' });
        }

        // Start session logic if it's a customer
        if (user.role === 'customer') {
            const sessionService = require('../modules/panelC/sessionService');
            await sessionService.executeAction(pc.id, pc.ClubId, {
                action: 'start',
                userId: user.id
            });
        } else {
            // Managerlar shunchaki ochishi mumkin (Dastlabki versiyada)
            pc.status = 'busy';
            await pc.save();
        }

        res.json({ success: true, message: 'Xush kelibsiz!', user: { username: user.username, role: user.role } });
    } catch (err) {
        next(err);
    }
};
