const { Session, User, Computer, sequelize } = require('../shared/database');
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
            const nowInTashkent = new Date(now.getTime() + TASHKENT_OFFSET);

            const reservations = await Session.findAll({
                where: {
                    status: 'reserved',
                    startTime: { [Op.gt]: now } // Only future or current
                },
                include: [{ model: User }, { model: Computer }]
            });

            for (const res of reservations) {
                const startTime = new Date(res.startTime);
                const diffMs = startTime - now;
                const diffMin = Math.floor(diffMs / 60000);

                // --- Case 0: 30 Minutes Before (Reminder 0) ---
                if (diffMin === 30 && !res.notifiedAt) {
                    await this.notify30m(res, io);
                }

                // --- Case 1: 10 Minutes Before (Reminder 1) ---
                if (diffMin === 10 && !res.notified10m) {
                    await this.notify10m(res, io);
                }

                // --- Case 2: 5 Minutes Before (Reminder 2 + Manager Alert) ---
                if (diffMin === 5 && !res.notified5m) {
                    await this.notify5m(res, io);
                }

                // --- Case 3: Start Time (Manager Permission Alert) ---
                if (diffMin <= 0 && diffMin >= -1 && !res.notifiedStart) {
                    await this.notifyStart(res, io);
                }

                // --- Case 4: 10 Minutes AFTER Start (Auto-Penalty Deadline) ---
                // If not arrived and no response, process penalty automatically
                if (diffMin <= -10 && res.status === 'reserved' && !res.penaltyApplied) {
                    // This is for auto-check if admin didn't take action
                    // But the requested flow says admin gets permission first.
                    // I will implement a task to check those that passed 10m past start.
                }
            }
        } catch (error) {
            console.error("Scheduler error:", error);
        }
    }

    async notify30m(res, io) {
        if (!res.User?.telegramId || res.User.telegramId === '0') return;
        const text = `🔔 <b>ESLATMA (30 DAQIQA):</b>\n\nHurmatli ${res.User.username}, bron qilingan vaqtingizga 30 daqiqa qoldi. Iltimos, o'z vaqtida kelishingizni so'raymiz! ✨`;
        await notificationService.sendTelegramToUser(res.User.telegramId, text);
        await res.update({ notifiedAt: new Date() });
    }

    async notify10m(res, io) {
        if (!res.User?.telegramId || res.User.telegramId === '0') return;

        const markup = {
            inline_keyboard: [[{ text: "🚀 BORYABMAN", callback_data: `coming_${res.id}` }]]
        };

        const text = `🔔 <b>HURMATLI ${res.User.username.toUpperCase()}!</b>\n\nSizni 10 daqiqadan so'ng <b>GAMEZONE</b> klubimizda (PC: ${res.Computer?.name || '?'}) kutib qolamiz. Ko'rishguncha hursandmiz! ✨`;

        await notificationService.sendTelegramToUser(res.User.telegramId, text, markup);
        await res.update({ notified10m: true });
    }

    async notify5m(res, io) {
        // User reminder
        if (res.User?.telegramId && res.User.telegramId !== '0') {
            const markup = {
                inline_keyboard: [[{ text: "🏃 YO'LDAMAN", callback_data: `coming_${res.id}` }]]
            };
            const text = `⚠️ <b>ESLATMA (5 DAQIQA QOLDI):</b>\n\nHurmatli ${res.User.username}, bron qilingan vaqtga oz qoldi. Iltimos, o'z vaqtida kelishingizni so'raymiz.`;
            await notificationService.sendTelegramToUser(res.User.telegramId, text, markup);
        }

        // Manager alert
        notificationService.notifyManager(io, res.ClubId, 'RESERVE_WARNING', {
            type: 'call_user',
            message: `Bron qilingan mijoz (${res.User?.username || res.guestName}) raqamiga qo'ng'iroq qilishingizni so'raymiz! 📞`,
            phone: res.User?.phone || res.guestPhone,
            pc: res.Computer?.name
        });

        await res.update({ notified5m: true });
    }

    async notifyStart(res, io) {
        // Broadcast to manager for final warning permission
        notificationService.notifyManager(io, res.ClubId, 'RESERVE_WARNING', {
            type: 'final_warning_request',
            sessionId: res.id,
            message: `Bron vaqti keldi (PC: ${res.Computer?.name}). Mijoz kelmadimi? Oxirgi ogohlantirishni yuboramizmi? ⚠️`,
            user: res.User?.username || res.guestName
        });

        // Auto-send warning after 60 seconds if no action
        setTimeout(async () => {
            const freshRes = await Session.findByPk(res.id);
            if (freshRes && freshRes.status === 'reserved' && !freshRes.notifiedPenalty) {
                await this.sendFinalPenaltyWarning(freshRes);
            }
        }, 60000);

        await res.update({ notifiedStart: true });
    }

    async sendFinalPenaltyWarning(res) {
        if (!res.User?.telegramId || res.User.telegramId === '0') return;

        const markup = {
            inline_keyboard: [
                [{ text: "🏃 BORYABMAN", callback_data: `coming_${res.id}` }],
                [{ text: "❌ BEKOR QILISH", callback_data: `cancel_penalty_${res.id}` }]
            ]
        };

        const text = `🚨 <b>DIQQAT - OXIRGI OGOHLANTIRISH:</b>\n\nHurmatli mijoz, agar 10 daqiqada kelmasangiz, shartnomamizga ko'ra bron uchun to'lagan mablag'ingiz shtraf (penalty) sifatida olib qolinadi va bron bekor qilinadi.`;

        await notificationService.sendTelegramToUser(res.User.telegramId, text, markup);
        await res.update({ notifiedPenalty: true, notifiedAt: new Date() });

        // Set ultimate auto-penalty timer for 10 MORE minutes
        setTimeout(async () => {
            const finalCheck = await Session.findByPk(res.id);
            if (finalCheck && finalCheck.status === 'reserved' && finalCheck.penaltyApplied === false) {
                await notificationService.processPenalty(res.id);
            }
        }, 600000);
    }
}

module.exports = new ReservationScheduler();
