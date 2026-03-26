const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
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
    }
});

module.exports = Room;
