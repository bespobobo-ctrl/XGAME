const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');

const token = process.env.BOT_TOKEN;
let bot = null;

if (token) {
    // Initialize without polling for server-side sending only
    bot = new TelegramBot(token, { polling: false });
} else {
    logger.warn('⚠️ BOT_TOKEN not found in environment, broadcasts will be disabled.');
}

/**
 * Sends a message to a list of telegram IDs
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

    // Send in batches to avoid rate limits
    for (const tid of telegramIds) {
        try {
            if (tid) {
                await bot.sendMessage(tid, message, { parse_mode: 'HTML' });
                results.success++;
            }
        } catch (err) {
            results.failed++;
            results.errors.push({ tid, error: err.message });
            logger.error(`Failed to send message to ${tid}:`, err.message);
        }
    }

    return results;
};

module.exports = {
    bot,
    broadcastMessage
};
