const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const Club = require('./Club');

const Room = sequelize.define('Room', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pcSpecs: {
        type: DataTypes.TEXT, // RTX 3060, 16GB RAM..
    },
    pricePerHour: {
        type: DataTypes.INTEGER,
        defaultValue: 20000,
    },
    pcCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    openTime: {
        type: DataTypes.STRING, // HH:mm
        defaultValue: "00:00",
    },
    closeTime: {
        type: DataTypes.STRING, // HH:mm
        defaultValue: "23:59",
    },
    ClubId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Room;
