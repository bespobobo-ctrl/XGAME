const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Broadcast = sequelize.define('Broadcast', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'global' }, // Masalan: 'global', 'billing', 'update'
    senderRole: { type: DataTypes.STRING, defaultValue: 'superadmin' }
});

module.exports = Broadcast;
