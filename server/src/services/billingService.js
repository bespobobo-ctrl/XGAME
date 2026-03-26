const { User, Computer, Session } = require('../database/index');
const logger = require('../utils/logger');

/**
 * ⏰ BILLING SERVICE (SENIOR OPTIMIZED)
 * Ushbu servis har daqiqa bazadan faol seanslarni olib,
 * foydalanuvchi balansini nazorat qiladi va avtomatik qulflaydi.
 */
async function runBillingCycle(io) {
    try {
        const activeSessions = await Session.findAll({
            where: { status: 'active' },
            include: [User, Computer]
        });

        if (activeSessions.length === 0) return;

        // 🚀 Parallel Processing for high performance
        await Promise.all(activeSessions.map(async (session) => {
            try {
                const { User: user, Computer: computer } = session;
                if (!user || !computer) return;

                const pricePerMinute = Math.ceil(computer.pricePerHour / 60);

                // Start Transactional logic (Calculations)
                user.balance = Math.max(0, user.balance - pricePerMinute);
                session.totalMinutes += 1;
                session.totalCost += pricePerMinute;

                // 🚨 AUTO-LOCK: Puli tugagan bo'lsa
                if (user.balance <= 0) {
                    session.status = 'completed';
                    session.endTime = new Date();
                    computer.status = 'locked';

                    if (io) {
                        io.to(computer.name).emit('lock');
                        logger.info(`🚨 LOCK: ${computer.name} (User: ${user.username}) - Balance exhausted.`);
                    }
                }

                // Batch save all changes at once (Atomic operation per user)
                await Promise.all([
                    user.save(),
                    session.save(),
                    computer.save()
                ]);

            } catch (err) {
                logger.error(`❌ Session billing error (ID:${session.id}):`, err);
            }
        }));

        logger.info(`⏱️ Billing Cycle OK: ${activeSessions.length} sessions updated.`);

    } catch (err) {
        logger.error('❌ Global Billing Error:', err);
    }
}

/**
 * 🚀 START SERVICE
 */
function startBillingService(io) {
    // 60000ms = 1 Minute
    setInterval(() => runBillingCycle(io), 60000);
    console.log('⏰ Professional Billing Service: ACTIVE');
}

module.exports = { startBillingService };
