const crypto = require('crypto');
const config = require('../config/index');

/**
 * 🔐 TELEGRAM INITDATA VALIDATOR (HMAC-SHA256)
 * Telegram Mini-App'dan kelgan ma'lumotlarni kriptografik tekshirish.
 * Hech kim boshqaning hisobiga fake request yubora olmaydi.
 * 
 * Qo'llanma: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateTelegramInitData(initData, botToken) {
    if (!initData || !botToken) return false;

    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        if (!hash) return false;

        // hash'ni olib tashlab, qolganlarini sort qilamiz
        params.delete('hash');
        const entries = [...params.entries()];
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

        // Secret key: HMAC-SHA256(bot_token, "WebAppData")
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Hash: HMAC-SHA256(data_check_string, secret_key)
        const computedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        return computedHash === hash;
    } catch (e) {
        console.error('[TG_VALIDATOR] Error:', e.message);
        return false;
    }
}

module.exports = { validateTelegramInitData };
