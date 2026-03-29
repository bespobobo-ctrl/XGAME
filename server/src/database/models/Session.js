const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    totalMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    expectedMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    reserveTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    pausedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    totalCost: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('active', 'paused', 'completed', 'forced_stop'),
        defaultValue: 'active',
    },
    guestName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    guestPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    }
});

module.exports = Session;
