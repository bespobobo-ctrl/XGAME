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

                // 🚨 AUTO-STOP: Fixed time sessions (expectedMinutes)
                let isLimitReached = false;
                if (session.expectedMinutes && session.totalMinutes >= session.expectedMinutes) {
                    isLimitReached = true;
                    logger.info(`⏰ LIMIT REACHED: ${computer.name} (${session.expectedMinutes} min). Closing session.`);
                }

                // Agar User ulangan bo'lsa (registered player), balansini kamaytirish
                if (user && user.balance !== undefined) {
                    // User ni fresh olish (race condition oldini olish)
                    const freshUser = await User.findByPk(user.id, { transaction: t, lock: true });
                    if (freshUser) {
                        freshUser.balance = Math.max(0, freshUser.balance - pricePerMinute);

                        // 🚨 AUTO-LOCK: Puli tugagan bo'lsa
                        if (freshUser.balance <= 0) {
                            isLimitReached = true;
                            logger.info(`🚨 BALANCE EMPTY: ${computer.name} (User: ${freshUser.username}). Closing session.`);
                        }

                        // 🔔 LOW BALANCE NOTIFICATION ( < 5000 UZS )
                        if (freshUser.balance > 0 && freshUser.balance < 5000) {
                            const { broadcastMessage } = require('../utils/bot');
                            if (freshUser.telegramId) {
                                // Faqat har 10 daqiqada bir marta ogohlantirish (spam bo'lmasligi uchun)
                                const lastAlertKey = `alert_${freshUser.id}`;
                                const now = Date.now();
                                if (!global[lastAlertKey] || now - global[lastAlertKey] > 10 * 60000) {
                                    broadcastMessage([freshUser.telegramId],
                                        `⚠️ <b>BALANS KAM!</b>\n\nHisobingizda <b>${Math.floor(freshUser.balance)} UZS</b> qoldi. O'yin uzilib qolmasligi uchun balansingizni to'ldiring! 🔌`
                                    ).catch(() => { });
                                    global[lastAlertKey] = now;
                                }
                            }
                        }
                        await freshUser.save({ transaction: t });
                    }
                }

                if (isLimitReached) {
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
                    }
                } else {
                    // 💓 HEARTBEAT: Har daqiqa dashboardga ma'lumot yuborib turadi (Real-time update uchun)
                    if (io) {
                        io.emit('pc-status-updated', {
                            pcId: computer.id,
                            clubId: computer.ClubId,
                            status: computer.status,
                            totalMinutes: session.totalMinutes
                        });
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

        // 🧪 BRONLARNI TEKSHIRISH (10 daqiqa qolganda xabar berish)
        await checkUpcomingReservations(io);

    } catch (err) {
        logger.error('❌ Global Billing Error:', err);
    }
}

/**
 * 📅 BRONLARNI TEKSHIRISH VA TELEGRAMDA XABAR BERISH
 */
async function checkUpcomingReservations(io) {
    const { broadcastMessage } = require('../utils/bot');
    const now = new Date();
    const tenMinsLater = new Date(now.getTime() + 11 * 60000); // 11 daqiqa ichida

    const reservations = await Session.findAll({
        where: {
            status: 'paused',
            reserveTime: { [Op.between]: [now, tenMinsLater] },
            notifiedAt: null // Faqat bir marta xabar berish
        },
        include: [
            { model: Computer, include: [Room] },
            { model: User }
        ]
    });

    for (const res of reservations) {
        const clubId = res.ClubId;
        const pcName = res.Computer?.name || 'Noma\'lum PC';
        const guestName = res.User?.username || res.guestName || 'Mehmon';
        const guestPhone = res.User?.phone || res.guestPhone || 'Tel topilmadi';
        const rTime = new Date(res.reserveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const managers = await User.findAll({ where: { ClubId: clubId, role: 'manager' } });
        const managerTgIds = managers.map(m => m.telegramId).filter(id => id && !id.startsWith('MANAGER_'));

        const msg = `📅 <b>BRON ESALATMASI!</b>\n\n` +
            `🖥 <b>PC:</b> ${pcName}\n` +
            `👤 <b>Mijoz:</b> ${guestName}\n` +
            `📞 <b>Telefon:</b> ${guestPhone}\n` +
            `⏰ <b>Vaqt:</b> ${rTime}\n\n` +
            `<i>Mijozga telefon qilib kelishini takidlang!</i>`;

        // Telegramga yuborish
        if (managerTgIds.length > 0) {
            await broadcastMessage(managerTgIds, msg);
        }

        // Dashboardga yuborish (Socket)
        if (io) {
            io.emit('upcoming-alert', { pcName, guestName, guestPhone, rTime });
        }

        res.notifiedAt = new Date();
        await res.save();
        logger.info(`🔔 Alert sent for reservation ${res.id} (${pcName})`);
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
