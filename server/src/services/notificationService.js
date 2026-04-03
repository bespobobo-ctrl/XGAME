const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const { Session, User, Computer, Transaction, sequelize } = require('../shared/database');

// Create a sender-only bot instance
const bot = new TelegramBot(config.BOT_TOKEN);

class NotificationService {
    /**
     * Send Telegram message to user
     */
    async sendTelegramToUser(telegramId, text, replyMarkup = null) {
        try {
            if (!telegramId || telegramId === '0') return;
            await bot.sendMessage(telegramId, text, {
                parse_mode: 'HTML',
                reply_markup: replyMarkup
            });
        } catch (error) {
            console.error(`❌ Telegram send error to ${telegramId}:`, error.message);
        }
    }

    /**
     * Notify Manager via WebSocket
     */
    notifyManager(io, clubId, event, data) {
        if (!io || !clubId) return;
        io.to(`club_${clubId}`).emit(event, data);
    }

    /**
     * Process auto-penalty
     */
    async processPenalty(sessionId) {
        const transaction = await sequelize.transaction();
        try {
            const session = await Session.findByPk(sessionId, {
                include: [{ model: Computer }],
                transaction
            });
            if (!session || session.status !== 'reserved') {
                await transaction.rollback();
                return false;
            }

            const penaltyAmount = session.prepaidAmount || 0;

            await session.update({
                status: 'cancelled',
                penaltyApplied: true,
                userResponse: 'cancelled_penalty'
            }, { transaction });

            if (penaltyAmount > 0) {
                const existingTx = await Transaction.findOne({ where: { SessionId: session.id, type: 'income' }, transaction });
                if (existingTx) {
                    await existingTx.update({
                        type: 'penalty',
                        description: `Shtraf: Bron vaqtida kelmagani uchun (PC: ${session.Computer?.name || '?'})`
                    }, { transaction });
                }
            }

            // Free the PC
            if (session.ComputerId) {
                await Computer.update({ status: 'free' }, { where: { id: session.ComputerId }, transaction });
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error("Penalty process error:", error);
            return false;
        }
    }
}

module.exports = new NotificationService();
