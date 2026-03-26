const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Club = require('./Club');

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
        type: DataTypes.ENUM('free', 'busy', 'offline', 'maintenance'),
        defaultValue: 'offline', // Agent ulanmasa bu offline holatda turadi
    },
    pricePerHour: {
        type: DataTypes.INTEGER,
        defaultValue: 20000,
    },
    ipAddress: {
        type: DataTypes.STRING,
    },
    macAddress: {
        type: DataTypes.STRING,
    }
});

module.exports = Computer;
