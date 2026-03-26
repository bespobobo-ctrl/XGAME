const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    telegramId: { type: DataTypes.STRING, unique: true, allowNull: true },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    username: { type: DataTypes.STRING, unique: true },
    phone: { type: DataTypes.STRING },
    balance: { type: DataTypes.INTEGER, defaultValue: 0 },
    role: { type: DataTypes.STRING, defaultValue: 'customer' },
    password: { type: DataTypes.STRING },
    ClubId: { type: DataTypes.INTEGER, allowNull: true },

    // 🕵️‍♂️ TRACKING FIELDS (ADD THESE!)
    lastLogin: { type: DataTypes.DATE },
    lastActive: { type: DataTypes.DATE },
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) user.password = await bcrypt.hash(user.password, 10);
            if (!user.telegramId && user.role === 'manager') {
                user.telegramId = `MANAGER_${user.username}_${Date.now()}`;
            }
        },
        beforeUpdate: async (user) => { if (user.changed('password')) user.password = await bcrypt.hash(user.password, 10); }
    }
});

User.prototype.comparePassword = async function (p) { return await bcrypt.compare(p, this.password); };

module.exports = User;
