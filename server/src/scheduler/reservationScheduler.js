const { Session, User, Computer, Room, sequelize } = require('../shared/database');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const TASHKENT_OFFSET = 5 * 3600000;

class ReservationScheduler {
    constructor() {
        this.timers = {}; // Store timers for 10m penalty deadline
    }

    start(io) {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.checkReservations(io), 60000); // Check every minute
        console.log("⏰ Reservation Scheduler started.");
    }

    async checkReservations(io) {
        try {
            const now = new Date();

            // 1️⃣ AUTO-ACTIVATE RESERVED SESSIONS (Bron vaqti kelganda PC ni ochish)
            const pendingReservations = await Session.findAll({
                where: {
                    status: 'reserved',
                    startTime: { [Op.lte]: now }
                },
                include: [{ model: Computer }]
            });

            for (const res of pendingReservations) {
                console.log(`🚀 [AUTO-ACTIVATE] PC: ${res.Computer?.name}. Session ID: ${res.id}`);
                try {
                    await res.update({
                        status: 'active',
                        lastResumeTime: now,
                        notifiedAt: now
                    });
                    await Computer.update({ status: 'busy' }, { where: { id: res.ComputerId } });

                    if (io) {
                        console.log(`🔑 Sending unlock to pc_${res.ComputerId}`);
                        io.to(`pc_${res.ComputerId}`).emit('unlock', { reason: 'booking_auto_start' });
                        io.to(`club_${res.ClubId}`).emit('room_update');
                        io.emit('pc-status-updated', { clubId: res.ClubId, pcId: res.ComputerId });
                    }
                } catch (updateErr) {
                    console.error(`❌ Activation error for Session #${res.id}:`, updateErr);
                }
            }

            // 2️⃣ CHECK ACTIVE SESSIONS (Mijoz kelganini tasdiqlash)
            const activeReservations = await Session.findAll({
                where: {
                    status: 'active',
                    prepaidAmount: { [Op.gt]: 0 },
                    isConfirmed: false
                },
                include: [{ model: User }, { model: Computer }]
            });

            for (const res of activeReservations) {
                const startTime = new Date(res.startTime);
                const elapsedMin = Math.floor((now - startTime) / 60000);

                // --- 45 DAQIQA: ADMINGA XABAR ---
                if (elapsedMin >= 45 && elapsedMin < 60 && !res.notifiedPresence) {
                    notificationService.notifyManager(io, res.ClubId, 'RESERVE_WARNING', {
                        type: 'presence_confirmation',
                        sessionId: res.id,
                        message: `Mijoz (${res.guestName || res.User?.username}) keldimi? (45 daqiqa o'tdi)`,
                        pc: res.Computer?.name
                    });
                    await res.update({ notifiedPresence: true });
                }

                // --- 60 DAQIQA: AVTO-STOP (TASDIQLANMASA) ---
                if (elapsedMin >= 60) {
                    console.log(`⚖️ [AUTO-STOP] Session #${res.id} yopildi (Mijoz kelmadi).`);
                    const pc = await Computer.findByPk(res.ComputerId);
                    const sessionService = require('../modules/panelC/sessionService');
                    await sessionService._handleStop(pc, null, 'no_show_after_1h');

                    if (io) {
                        io.to(`pc_${res.ComputerId}`).emit('lock');
                        io.to(`club_${res.ClubId}`).emit('room_update');
                    }
                }
            }

            // 3️⃣ REMINDERS (KELISHIDAN OLDIN)
            const reminders = await Session.findAll({
                where: { status: 'reserved', startTime: { [Op.gt]: now } },
                include: [{ model: User }, { model: Computer, include: [{ model: Room }] }]
            });

            for (const res of reminders) {
                const startTime = new Date(res.startTime);
                const diffMin = Math.floor((startTime - now) / 60000);

                if (diffMin <= 35 && diffMin >= 25 && !res.notifiedAt) await this.notify30m(res, io);
                if (diffMin <= 15 && diffMin >= 10 && !res.notified10m) await this.notify10m(res, io);
            }

        } catch (error) {
            console.error("Scheduler error:", error);
        }
    }

    async notify30m(res, io) {
        if (!res.User?.telegramId || res.User.telegramId === '0') return;
        const timeString = new Date(res.startTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
        const text = `🔔 <b>ESLATMA:</b>\n\nHurmatli ${res.User.username}, bron qilingan vaqtingizga 30 daqiqa qoldi (${timeString}). Kelishingizni kutib qolamiz! ✨`;
        await notificationService.sendTelegramToUser(res.User.telegramId, text);
        await res.update({ notifiedAt: new Date() });
    }

    async notify10m(res, io) {
        if (!res.User?.telegramId || res.User.telegramId === '0') return;
        const timeString = new Date(res.startTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
        const text = `🔔 <b>ESLATMA:</b>\n\nHurmatli ${res.User.username}, o'yin boshlanishiga 10 daqiqa qoldi (${timeString}). Iltimos, kechikmang! 🚀`;
        await notificationService.sendTelegramToUser(res.User.telegramId, text);
        await res.update({ notified10m: true });
    }
}

module.exports = new ReservationScheduler();
