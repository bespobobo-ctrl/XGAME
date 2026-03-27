const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Computer = sequelize.define('Computer', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING, // masalan, PC-01, PC-02
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('free', 'busy', 'offline', 'maintenance', 'reserved', 'vip'),
        defaultValue: 'free',
    },
    ipAddress: {
        type: DataTypes.STRING,
    },
    macAddress: {
        type: DataTypes.STRING,
    },
    ClubId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    RoomId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Computer;
