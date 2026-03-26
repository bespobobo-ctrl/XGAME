const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING, // 'deposit' | 'session' | 'withdraw'
        allowNull: false,
    },
    comment: {
        type: DataTypes.STRING,
    }
});

module.exports = Transaction;
