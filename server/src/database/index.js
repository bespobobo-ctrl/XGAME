const sequelize = require('../config/database');
const User = require('./models/User');
const Club = require('./models/Club');
const Computer = require('./models/Computer');
const Room = require('./models/Room');
const Session = require('./models/Session');
const Transaction = require('./models/Transaction');
const AuditLog = require('./models/AuditLog');
const logger = require('../utils/logger');

// Associations
Club.hasMany(User);
User.belongsTo(Club);
Club.hasMany(Room);
Room.belongsTo(Club);
Room.hasMany(Computer);
Computer.belongsTo(Room);
Club.hasMany(Computer);
Computer.belongsTo(Club);
User.hasMany(Session);
Session.belongsTo(User);
Computer.hasMany(Session);
Session.belongsTo(Computer);

// Financial Associations
User.hasMany(Transaction);
Transaction.belongsTo(User);
Club.hasMany(Transaction);
Transaction.belongsTo(Club);

// Audit Associations
User.hasMany(AuditLog, { foreignKey: 'adminId' });
AuditLog.belongsTo(User, { foreignKey: 'adminId' });

async function initializeDatabase() {
    try {
        await sequelize.sync({ alter: true });
        logger.info('✅ Database sinxronizatsiya qilindi!');

        // ℹ️ Klublar faqat Super Admin tomonidan qo'shiladi.
        // Avtomatik club yaratish o'chirildi.
        const clubCount = await Club.count();
        logger.info(`ℹ️ Jami ${clubCount} ta klub mavjud. Yangi klub qo'shish uchun Super Admin panelidan foydalaning.`);

    } catch (error) {
        logger.error('❌ Database error:', error);
    }
}

module.exports = {
    sequelize,
    User,
    Club,
    Room,
    Computer,
    Session,
    Transaction,
    AuditLog,
    initializeDatabase,
};
