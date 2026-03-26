const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    telegramId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    firstName: {
        type: DataTypes.STRING,
    },
    lastName: {
        type: DataTypes.STRING,
    },
    username: {
        type: DataTypes.STRING,
    },
    phone: {
        type: DataTypes.STRING,
    },
    balance: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'customer', // 'customer' | 'admin' | 'cashier' | 'super_admin'
    },
    password: {
        type: DataTypes.STRING,
    },
    lastLoginAt: {
        type: DataTypes.DATE,
    },
    lastLoginIp: {
        type: DataTypes.STRING,
    },
    lastTelegramId: {
        type: DataTypes.STRING,
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
});

// Parolni tekshirish uchun metod
User.prototype.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
