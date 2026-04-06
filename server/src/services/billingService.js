const { User, Computer, Session, Room, Transaction, sequelize } = require('../shared/database');
const { Op } = require('sequelize');
const logger = require('../shared/utils/logger');

/**
 * ⏰ BILLING SERVICE
 * Har daqiqa faol seanslarni tekshiradi va foydalanuvchi balansini nazorat qiladi.
 */
let isRunning = false;

async function runBillingCycle(io) {
    if (isRunning) return; // ⛔ Oldingi cycle hali tugamagan
    isRunning = true;
    try {
        const activeSessions = await Session.findAll({
            where: { status: 'active' },
            include: [User, { model: Computer, include: [Room] }]
        });

        // 1. ACTIVE SESSIONS PROCESSING
        for (const session of activeSessions) {
            const t = await sequelize.transaction();
            try {
                const { User: user, Computer: computer } = session;
                if (!computer) { await t.rollback(); continue; }

                const room = computer.Room;
                const pricePerHour = room ? room.pricePerHour : 20000;
                const pricePerMinute = Math.ceil(pricePerHour / 60);

                session.consumedSeconds = (session.consumedSeconds || 0) + 60;
                session.totalCost = Math.ceil((session.consumedSeconds / 3600) * pricePerHour);
                session.lastResumeTime = new Date(); // 🛡️ RESET TIMER: Keyingi delta hisoblashda xatolik bo'lmasligi uchun

                let isLimitReached = false;
                if (session.expectedMinutes && (session.consumedSeconds / 60) >= session.expectedMinutes) {
                    isLimitReached = true;
                }

                if (user && user.balance !== undefined) {
                    const freshUser = await User.findByPk(user.id, { transaction: t, lock: true });
                    if (freshUser) {
                        freshUser.balance = Math.max(0, freshUser.balance - pricePerMinute);
                        if (freshUser.balance <= 0) isLimitReached = true;

                        // Notify low balance
                        if (freshUser.balance < 5000 && freshUser.balance > 0 && freshUser.telegramId) {
                            // bot notification
                        }
                        await freshUser.save({ transaction: t });
                    }
                }

                if (isLimitReached) {
                    session.status = 'completed';
                    session.endTime = new Date();
                    computer.status = 'free';
                    if (io) {
                        io.to(`pc_${computer.id}`).emit('lock');
                        io.emit('pc-status-updated', { pcId: computer.id, clubId: computer.ClubId, status: 'free' });
                    }
                }

                await session.save({ transaction: t });
                await computer.save({ transaction: t });
                await t.commit();
            } catch (err) {
                if (t) await t.rollback();
                logger.error(`❌ Session billing error:`, err);
            }
        }

    } catch (err) {
        logger.error('❌ Global Billing Error:', err);
    } finally {
        isRunning = false;
    }
}

function startBillingService(io) {
    setInterval(() => runBillingCycle(io), 60000);
    console.log('⏰ Billing Service: SESSIONS ONLY (Reserves handled by Scheduler)');
}

module.exports = { startBillingService };
