const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING, // 'create_club', 'block_user', 'update_balance', etc.
        allowNull: false,
    },
    details: {
        type: DataTypes.TEXT, // JSON details
    },
    ip: {
        type: DataTypes.STRING,
    }
});

module.exports = AuditLog;
