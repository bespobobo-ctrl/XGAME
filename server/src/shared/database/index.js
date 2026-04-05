const sequelize = require('../../config/database');
const User = require('./models/User');
const Club = require('./models/Club');
const Computer = require('./models/Computer');
const Room = require('./models/Room');
const Session = require('./models/Session');
const Transaction = require('./models/Transaction');
const AuditLog = require('./models/AuditLog');
const Broadcast = require('./models/Broadcast');
const Product = require('./models/Product');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════
// 🔗 ASSOCIATIONS (Model Relationships)
// ═══════════════════════════════════════════════

// Club → Users
Club.hasMany(User);
User.belongsTo(Club);

// Club → Rooms
Club.hasMany(Room);
Room.belongsTo(Club);

// Club → Products
Club.hasMany(Product);
Product.belongsTo(Club);

// Room → Computers
Room.hasMany(Computer);
Computer.belongsTo(Room);

// Club → Computers
Club.hasMany(Computer);
Computer.belongsTo(Club);

// Club → Sessions
Club.hasMany(Session);
Session.belongsTo(Club);

// User → Sessions
User.hasMany(Session);
Session.belongsTo(User);

// Computer → Sessions
Computer.hasMany(Session);
Computer.hasMany(Session, { as: 'UpcomingReservations', foreignKey: 'ComputerId' });
Session.belongsTo(Computer);

// Room → Sessions
Room.hasMany(Session);
Session.belongsTo(Room);

// Financial Associations
User.hasMany(Transaction);
Transaction.belongsTo(User);
Club.hasMany(Transaction);
Transaction.belongsTo(Club);
Session.hasMany(Transaction);
Transaction.belongsTo(Session);

// Audit Associations
User.hasMany(AuditLog, { foreignKey: 'adminId' });
AuditLog.belongsTo(User, { foreignKey: 'adminId' });

// ═══════════════════════════════════════════════
// 🚀 DATABASE INITIALIZATION
// ═══════════════════════════════════════════════
async function initializeDatabase() {
    try {
        const config = require('../../config/index');

        if (config.NODE_ENV === 'production') {
            await sequelize.authenticate();
            logger.info('✅ Database ulanishi muvaffaqiyatli (Production mode)!');
        } else {
            // SQLite alter mode'dagi FK hatolarini oldini olish uchun qo'lda qo'shamiz
            await sequelize.authenticate();
            await sequelize.sync({ alter: false });
            logger.info('✅ Database sinxronizatsiya qilindi (Safe mode)!');
        }

        // 🛠️ DATABASE MIGRATIONS (Always run these check-and-adds)
        try { await sequelize.query("CREATE TABLE IF NOT EXISTS `Products` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(255) NOT NULL, `price` INTEGER NOT NULL, `category` VARCHAR(255) DEFAULT 'Boshqa', `stock` INTEGER DEFAULT 0, `image` VARCHAR(255), `ClubId` INTEGER NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, FOREIGN KEY (`ClubId`) REFERENCES `Clubs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE);"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `notifiedAt` DATETIME;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `expectedMinutes` INTEGER;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `RoomId` INTEGER;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `ClubId` INTEGER;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `guestName` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `guestPhone` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `lastResumeTime` DATETIME;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `consumedSeconds` INTEGER DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `totalCost` INTEGER DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `notified10m` BOOLEAN DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `notified5m` BOOLEAN DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `notifiedStart` BOOLEAN DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `notifiedPenalty` BOOLEAN DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `userResponse` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `prepaidAmount` INTEGER DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Sessions` ADD COLUMN `penaltyApplied` BOOLEAN DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Clubs` ADD COLUMN `cardNumber` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Clubs` ADD COLUMN `cardOwner` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Transactions` ADD COLUMN `status` TEXT DEFAULT 'approved';"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Transactions` ADD COLUMN `receiptImage` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Transactions` ADD COLUMN `SessionId` INTEGER;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Transactions` ADD COLUMN `ClubId` INTEGER;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Computers` ADD COLUMN `agentToken` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Computers` ADD COLUMN `pairingCode` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Computers` ADD COLUMN `lastOnline` DATETIME;"); } catch (e) { }

        // Rooms table migrations
        try { await sequelize.query("ALTER TABLE `Rooms` ADD COLUMN `isLocked` BOOLEAN DEFAULT 0;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Rooms` ADD COLUMN `openTime` TEXT DEFAULT '00:00';"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Rooms` ADD COLUMN `closeTime` TEXT DEFAULT '23:59';"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Rooms` ADD COLUMN `pcSpecs` TEXT;"); } catch (e) { }
        try { await sequelize.query("ALTER TABLE `Rooms` ADD COLUMN `pcCount` INTEGER DEFAULT 0;"); } catch (e) { }

        const clubCount = await Club.count();
        logger.info(`ℹ️ Jami ${clubCount} ta klub mavjud.`);

    } catch (error) {
        logger.error('❌ Database error:', error);
        throw error; // Serverni to'xtatish uchun
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
    Broadcast,
    Product,
    initializeDatabase,
};
