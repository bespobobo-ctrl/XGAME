const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    RoomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    ComputerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ClubId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
        type: DataTypes.ENUM('active', 'paused', 'completed', 'forced_stop', 'reserved'),
        defaultValue: 'active',
    },
    guestName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    guestPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    notifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    penaltyApplied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lastResumeTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    consumedSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    notified10m: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    notified5m: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    notifiedStart: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    notifiedPenalty: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    userResponse: {
        type: DataTypes.STRING, // 'coming', 'cancel'
        allowNull: true
    }
});

module.exports = Session;
