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
                    startTime: { [Op.gte]: new Date(now.getTime() - 15 * 60000) } // Catch sessions that started recently too
                },
                include: [{ model: User }, { model: Computer }]
            });

            for (const res of reservations) {
                const startTime = new Date(res.startTime);
                const diffMs = startTime - now;
                const diffMin = Math.floor(diffMs / 60000);

                // --- Case 0: 30 Minutes Before (Reminder 0) ---
                if (diffMin <= 35 && diffMin >= 20 && !res.notifiedAt) {
                    await this.notify30m(res, io);
                }

                // --- Case 1: 10 Minutes Before (Reminder 1 - BUTTONS) ---
                if (diffMin <= 15 && diffMin >= 8 && !res.notified10m) {
                    await this.notify10m(res, io);
                }

                // --- Case 2: 5 Minutes Before (Reminder 2 + Manager Alert) ---
                if (diffMin <= 7 && diffMin >= 2 && !res.notified5m) {
                    await this.notify5m(res, io);
                }

                // --- Case 3: Start Time (Final Warning Request) ---
                if (diffMin <= 1 && diffMin >= -10 && !res.notifiedStart) {
                    await this.notifyStart(res, io);
                }

                // --- Case 4: AUTO FINAL WARNING (DB-based, setTimeout o'rniga) ---
                // notifiedStart=true, lekin notifiedPenalty=false va 1 daqiqa o'tgan
                if (res.notifiedStart && !res.notifiedPenalty) {
                    await this.checkAutoFinalWarning(res);
                }

                // --- Case 5: AUTO PENALTY (DB-based, setTimeout o'rniga) ---
                // notifiedPenalty=true va 10 daqiqa o'tgan — auto-cancel
                if (res.notifiedPenalty && !res.penaltyApplied) {
                    await this.checkAutoPenalty(res);
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

        // notifiedStart vaqtini saqlaymiz — keyingi check'larda DB orqali tekshiriladi
        // setTimeout EMAS — server restart bo'lsa ham ishlaydi!
        await res.update({ notifiedStart: true, notifiedAt: new Date() });
    }

    /**
     * DB-BASED auto penalty warning (setTimeout o'rniga)
     * checkReservations() interval'da chaqiriladi, notifiedStart=true, notifiedPenalty=false
     * va notifiedAt + 1 daqiqa o'tgan bo'lsa avtomatik ishlaydi
     */
    async checkAutoFinalWarning(res) {
        // notifiedAt dan 1 daqiqa o'tganmi?
        if (!res.notifiedAt) return;
        const elapsed = Date.now() - new Date(res.notifiedAt).getTime();
        if (elapsed < 60000) return; // 1 daqiqa kutamiz

        await this.sendFinalPenaltyWarning(res);
    }

    async sendFinalPenaltyWarning(res) {
        const user = res.User;
        if (!user?.telegramId || user.telegramId === '0') {
            // User ma'lumotlari yo'q — qayta yuklash
            const freshRes = await Session.findByPk(res.id, { include: [User] });
            if (!freshRes) return;
            res = freshRes;
        }

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
    }

    /**
     * DB-BASED auto penalty execution (setTimeout o'rniga)
     * notifiedPenalty=true va notifiedAt + 10 daqiqa o'tgan bo'lsa ishlaydi
     */
    async checkAutoPenalty(res) {
        if (!res.notifiedAt) return;
        const elapsed = Date.now() - new Date(res.notifiedAt).getTime();
        if (elapsed < 600000) return; // 10 daqiqa kutamiz

        if (res.penaltyApplied) return;
        await notificationService.processPenalty(res.id);
        console.log(`⚖️ Auto-penalty applied for Session #${res.id}`);
    }
}

module.exports = new ReservationScheduler();
