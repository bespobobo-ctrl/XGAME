const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('./User');
const Computer = require('./Computer');

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
    totalCost: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('active', 'paused', 'completed', 'forced_stop'),
        defaultValue: 'active',
    }
});

// Relatsiyalar
User.hasMany(Session);
Session.belongsTo(User);

Computer.hasMany(Session);
Session.belongsTo(Computer);

module.exports = Session;
