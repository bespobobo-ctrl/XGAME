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

    } catch (error) {
        logger.error('❌ Database error:', error);
        throw error;
    }
}

/**
 * 🛠️ MIGRATION HELPER (Professional approach)
 * Safely adds columns to existing tables if they don't exist
 */
async function runMigrations() {
    const migrations = [
        // Sessions
        "ALTER TABLE `Sessions` ADD COLUMN `notifiedAt` DATETIME",
        "ALTER TABLE `Sessions` ADD COLUMN `expectedMinutes` INTEGER",
        "ALTER TABLE `Sessions` ADD COLUMN `RoomId` INTEGER",
        "ALTER TABLE `Sessions` ADD COLUMN `ClubId` INTEGER",
        "ALTER TABLE `Sessions` ADD COLUMN `guestName` TEXT",
        "ALTER TABLE `Sessions` ADD COLUMN `guestPhone` TEXT",
        "ALTER TABLE `Sessions` ADD COLUMN `lastResumeTime` DATETIME",
        "ALTER TABLE `Sessions` ADD COLUMN `consumedSeconds` INTEGER DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `totalCost` INTEGER DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `notified10m` BOOLEAN DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `notified5m` BOOLEAN DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `notifiedStart` BOOLEAN DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `notifiedPenalty` BOOLEAN DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `userResponse` TEXT",
        "ALTER TABLE `Sessions` ADD COLUMN `prepaidAmount` INTEGER DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `penaltyApplied` BOOLEAN DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `isConfirmed` BOOLEAN DEFAULT 0",
        "ALTER TABLE `Sessions` ADD COLUMN `notifiedPresence` BOOLEAN DEFAULT 0",

        // Clubs
        "ALTER TABLE `Clubs` ADD COLUMN `cardNumber` TEXT",
        "ALTER TABLE `Clubs` ADD COLUMN `cardOwner` TEXT",

        // Transactions
        "ALTER TABLE `Transactions` ADD COLUMN `status` TEXT DEFAULT 'approved'",
        "ALTER TABLE `Transactions` ADD COLUMN `receiptImage` TEXT",
        "ALTER TABLE `Transactions` ADD COLUMN `SessionId` INTEGER",
        "ALTER TABLE `Transactions` ADD COLUMN `ClubId` INTEGER",

        // Computers
        "ALTER TABLE `Computers` ADD COLUMN `agentToken` TEXT",
        "ALTER TABLE `Computers` ADD COLUMN `pairingCode` TEXT",
        "ALTER TABLE `Computers` ADD COLUMN `lastOnline` DATETIME",

        // Rooms
        "ALTER TABLE `Rooms` ADD COLUMN `isLocked` BOOLEAN DEFAULT 0",
        "ALTER TABLE `Rooms` ADD COLUMN `openTime` TEXT DEFAULT '00:00'",
        "ALTER TABLE `Rooms` ADD COLUMN `closeTime` TEXT DEFAULT '23:59'",
        "ALTER TABLE `Rooms` ADD COLUMN `pcSpecs` TEXT",
        "ALTER TABLE `Rooms` ADD COLUMN `pcCount` INTEGER DEFAULT 0"
    ];

    for (const sql of migrations) {
        try {
            await sequelize.query(sql);
            logger.info(`✨ Executed Migration Part: ${sql.substring(0, 35)}...`);
        } catch (e) {
            // Silently skip if column already exists (common SQLite pattern)
        }
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
    runMigrations,
};
