require('dotenv').config({ path: '../../.env' });
const TelegramBot = require('node-telegram-bot-api');
const { User, Computer, Club } = require('../../server/src/database/index');
const i18n = require('./services/i18n');

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error("❌ Xatolik: BOT_TOKEN topilmadi. '.env' faylni tekshiring!");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('🤖 GameZone boti muvaffaqiyatli ulangan!');

// 🚀 PERSISTENT MENU BUTTON (Senior UX)
const miniAppUrl = process.env.MINI_APP_URL;
if (miniAppUrl) {
    bot.setChatMenuButton({
        menu_button: JSON.stringify({
            type: 'web_app',
            text: '🎮 GameZone',
            web_app: { url: miniAppUrl }
        })
    }).then(() => console.log('✅ Menu Button yangilandi.'))
        .catch(e => console.error('❌ Menu Button xatosi:', e.message));
}

// --- Helper Functions ---
const getMainMenu = (user) => {
    const lang = user.language || 'uz';
    return {
        inline_keyboard: [
            [{ text: i18n.get('menu_cabinet', lang), web_app: { url: `${process.env.MINI_APP_URL}/?userId=${user.id}` } }],
            [{ text: i18n.get('menu_balance', lang), callback_data: 'view_balance' }],
            [{ text: i18n.get('menu_lang', lang), callback_data: 'change_lang' }],
            [{ text: i18n.get('menu_help', lang), callback_data: 'help' }]
        ]
    };
};

const getLangKeyboard = () => ({
    inline_keyboard: [
        [{ text: '🇺🇿 O`zbekcha', callback_data: 'set_lang_uz' }],
        [{ text: '🇷🇺 Русский', callback_data: 'set_lang_ru' }]
    ]
});

// --- Commands ---

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        let user = await User.findOne({ where: { telegramId: String(chatId) } });
        if (!user) {
            user = await User.create({
                telegramId: String(chatId),
                firstName: msg.from.first_name,
                lastName: msg.from.last_name || '',
                username: msg.from.username || 'user',
                balance: 0,
                language: 'uz'
            });
            console.log(`👤 Yangi Mijoz (ID:${user.id}) ro'yxatdan o'tdi!`);
        }

        const lang = user.language || 'uz';
        const welcomeMsg = i18n.get('welcome', lang).replace('{name}', msg.from.first_name);

        bot.sendMessage(chatId, welcomeMsg, {
            parse_mode: 'HTML',
            reply_markup: getMainMenu(user)
        });
    } catch (error) {
        console.error("❌ Start error:", error);
        bot.sendMessage(chatId, "⚠️ Tizimda xatolik yuz berdi.");
    }
});

bot.onText(/\/lang/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌐 Tilni tanlang / Выберите язык:", {
        reply_markup: getLangKeyboard()
    });
});

// --- Callbacks ---

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const action = query.data;
    const userId = query.from.id;

    try {
        const user = await User.findOne({ where: { telegramId: String(userId) } });
        if (!user) return;
        const lang = user.language || 'uz';

        if (action === 'view_balance') {
            const text = i18n.get('balance_text', lang).replace('{balance}', user.balance);
            bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
            bot.answerCallbackQuery(query.id);
        }

        if (action === 'help') {
            bot.sendMessage(chatId, i18n.get('help_text', lang));
            bot.answerCallbackQuery(query.id);
        }

        if (action === 'change_lang') {
            bot.sendMessage(chatId, i18n.get('choose_lang', lang), {
                reply_markup: getLangKeyboard()
            });
            bot.answerCallbackQuery(query.id);
        }

        if (action.startsWith('set_lang_')) {
            const newLang = action.split('_')[2];
            await user.update({ language: newLang });
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, i18n.get('lang_changed', newLang), {
                reply_markup: getMainMenu(user)
            });
            bot.answerCallbackQuery(query.id);
        }

    } catch (e) {
        console.error("Callback error:", e);
    }
});

