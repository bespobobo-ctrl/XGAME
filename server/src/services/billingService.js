const { User, Computer, Session, Room } = require('../database/index');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * ⏰ BILLING SERVICE
 * Har daqiqa faol seanslarni tekshiradi va foydalanuvchi balansini nazorat qiladi.
 */
async function runBillingCycle(io) {
    try {
        const activeSessions = await Session.findAll({
            where: { status: 'active' },
            include: [
                User,
                { model: Computer, include: [Room] }
            ]
        });

        if (activeSessions.length === 0) return;

        // Sessiyalarni ketma-ket qayta ishlash (race condition oldini olish)
        for (const session of activeSessions) {
            const t = await sequelize.transaction();
            try {
                const { User: user, Computer: computer } = session;
                if (!computer) {
                    await t.rollback();
                    continue;
                }

                // Narxni Room dan olish
                const room = computer.Room;
                const pricePerHour = room ? room.pricePerHour : 20000;
                const pricePerMinute = Math.ceil(pricePerHour / 60);

                session.totalMinutes += 1;
                session.totalCost += pricePerMinute;

                // Agar User ulangan bo'lsa (registered player), balansini kamaytirish
                if (user && user.balance !== undefined) {
                    // User ni fresh olish (race condition oldini olish)
                    const freshUser = await User.findByPk(user.id, { transaction: t, lock: true });
                    if (freshUser) {
                        freshUser.balance = Math.max(0, freshUser.balance - pricePerMinute);

                        // 🚨 AUTO-LOCK: Puli tugagan bo'lsa
                        if (freshUser.balance <= 0) {
                            session.status = 'completed';
                            session.endTime = new Date();
                            computer.status = 'free';

                            if (io) {
                                io.to(computer.name).emit('lock');
                                io.emit('pc-status-updated', {
                                    pcId: computer.id,
                                    clubId: computer.ClubId,
                                    status: 'free'
                                });
                                logger.info(`🚨 LOCK: ${computer.name} (User: ${freshUser.username}) - Balance exhausted.`);
                            }
                        }

                        await freshUser.save({ transaction: t });
                    }
                }

                await session.save({ transaction: t });
                await computer.save({ transaction: t });
                await t.commit();

            } catch (err) {
                await t.rollback();
                logger.error(`❌ Session billing error (ID:${session.id}):`, err);
            }
        }

        logger.info(`⏱️ Billing Cycle OK: ${activeSessions.length} sessions processed.`);

    } catch (err) {
        logger.error('❌ Global Billing Error:', err);
    }
}

/**
 * 🚀 START SERVICE
 */
function startBillingService(io) {
    setInterval(() => runBillingCycle(io), 60000);
    console.log('⏰ Professional Billing Service: ACTIVE');
}

module.exports = { startBillingService };
