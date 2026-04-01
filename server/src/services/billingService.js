const { User, Computer, Session, Room, Transaction, sequelize } = require('../shared/database');
const { Op } = require('sequelize');
const logger = require('../shared/utils/logger');

/**
 * ⏰ BILLING SERVICE
 * Har daqiqa faol seanslarni tekshiradi va foydalanuvchi balansini nazorat qiladi.
 */
async function runBillingCycle(io) {
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
                            const { broadcastMessage } = require('../utils/bot');
                            broadcastMessage([freshUser.telegramId], `⚠️ <b>BALANS KAM!</b>\n\nHisobingizda <b>${Math.floor(freshUser.balance)} UZS</b> qoldi.`).catch(() => { });
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

        // 2. CHECK RESERVATIONS
        await checkReservations(io);

    } catch (err) {
        logger.error('❌ Global Billing Error:', err);
    }
}

/**
 * 📅 RESERVATION MONITORING (ALERTS & PENALTIES)
 */
async function checkReservations(io) {
    const { broadcastMessage } = require('../utils/bot');
    const now = new Date();

    // 🔔 30 MINUTE CUSTOMER REMINDER
    const thirtyMinsLater = new Date(now.getTime() + 31 * 60000);
    const reminder30 = await Session.findAll({
        where: { status: 'reserved', startTime: { [Op.between]: [now, thirtyMinsLater] }, notifiedAt: null },
        include: [{ model: User }, { model: Computer }]
    });
    for (const res of reminder30) {
        if (res.User?.telegramId) {
            broadcastMessage([res.User.telegramId], `🔔 <b>ESLATMA!</b>\n\nBroningizga 30 minut qoldi. Iltimos, o'z vaqtida keling!`).catch(() => { });
        }
        res.notifiedAt = now;
        await res.save();
    }

    // ❗️ 5 MINUTE URGENT ALERT (BEFORE START)
    const fiveMinsLater = new Date(now.getTime() + 6 * 60000);
    const urgentRes = await Session.findAll({
        where: { status: 'reserved', startTime: { [Op.between]: [now, fiveMinsLater] } },
        include: [Computer]
    });
    for (const res of urgentRes) {
        const pc = res.Computer;
        if (pc && pc.status !== 'reserved') {
            // Auto-stop active session
            const active = await Session.findOne({ where: { ComputerId: pc.id, status: ['active', 'paused'] } });
            if (active) {
                active.status = 'completed'; active.endTime = now; await active.save();
                if (io) io.to(pc.name).emit('lock', { message: `BRON: ${res.guestName} uchun` });
            }
            pc.status = 'reserved'; await pc.save();
            if (io) {
                io.emit('upcoming-alert', { pcName: pc.name, guestName: res.guestName });
                io.emit('pc-status-updated', { pcId: pc.id, clubId: pc.ClubId, status: 'reserved' });
            }
        }
    }

    // ⚠️ LATE RESERVATION PENALTY (5 & 10 MINS AFTER START)
    const activeReserves = await Session.findAll({
        where: { status: 'reserved' },
        include: [{ model: User }, { model: Computer }]
    });

    for (const res of activeReserves) {
        const startTime = new Date(res.startTime);
        const lateMinutes = Math.floor((now - startTime) / 60000);

        // 5 MINS LATE -> Reminder
        if (lateMinutes >= 5 && lateMinutes < 10 && !res.penaltyApplied) {
            if (res.User?.telegramId) {
                broadcastMessage([res.User.telegramId], `⚠️ <b>SIZ 5 MINUT KECHIKDINGIZ!</b>\n\nIltimos, tezroq yetib keling. 😊`).catch(() => { });
            }
            res.penaltyApplied = true;
            await res.save();
        }

        // 10 MINS LATE -> Cancellation (Keep deposit)
        if (lateMinutes >= 10) {
            res.status = 'cancelled';
            res.endTime = now;
            await res.save();
            if (res.Computer) {
                res.Computer.status = 'free';
                await res.Computer.save();
                if (io) io.emit('pc-status-updated', { pcId: res.Computer.id, clubId: res.Computer.ClubId, status: 'free' });
            }
            if (res.User?.telegramId) {
                broadcastMessage([res.User.telegramId], `🚫 <b>BRON BEKOR QILINDI!</b>\n\nSiz 10 daqiqa kechikdingiz. Depozit qaytarilmaydi.`).catch(() => { });
            }
        }
    }
}

function startBillingService(io) {
    setInterval(() => runBillingCycle(io), 60000);
    console.log('⏰ Professional Billing Service (Fixed): ACTIVE');
}

module.exports = { startBillingService };
