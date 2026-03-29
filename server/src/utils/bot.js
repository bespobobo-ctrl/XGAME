const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');

const token = process.env.BOT_TOKEN;
let bot = null;

if (token) {
    bot = new TelegramBot(token, { polling: false });
} else {
    logger.warn('⚠️ BOT_TOKEN not found in environment, broadcasts will be disabled.');
}

// Rate limiting: Telegram allows ~30 messages/second
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1100; // 1.1 soniya har batch orasida

/**
 * Ma'lum vaqt kutish (rate limiting uchun)
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends a message to a list of telegram IDs with rate limiting
 * @param {Array<string|number>} telegramIds
 * @param {string} message
 */
const broadcastMessage = async (telegramIds, message) => {
    if (!bot) return { success: false, error: 'Bot not initialized' };

    const results = {
        success: 0,
        failed: 0,
        errors: []
    };

    // Batch bo'lib yuborish
    for (let i = 0; i < telegramIds.length; i++) {
        const tid = telegramIds[i];
        try {
            if (tid) {
                await bot.sendMessage(tid, message, { parse_mode: 'HTML' });
                results.success++;
            }
        } catch (err) {
            results.failed++;
            results.errors.push({ tid, error: err.message });
            // Agar user botni bloklagan bo'lsa, log qilish
            if (err.response?.statusCode === 403) {
                logger.warn(`User ${tid} has blocked the bot`);
            } else {
                logger.error(`Failed to send message to ${tid}:`, err.message);
            }
        }

        // Har BATCH_SIZE xabardan keyin kutish (rate limit)
        if ((i + 1) % BATCH_SIZE === 0 && i < telegramIds.length - 1) {
            await delay(BATCH_DELAY_MS);
        }
    }

    logger.info(`Broadcast complete: ${results.success} sent, ${results.failed} failed`);
    return results;
};

module.exports = {
    bot,
    broadcastMessage
};
