const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    telegramId: { type: DataTypes.STRING, unique: true, allowNull: true }, // MENEJERLAR U-N NULL BOLISHI MUMKIN
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    username: { type: DataTypes.STRING, unique: true }, // LOGIN MUST BE UNIQUE
    phone: { type: DataTypes.STRING },
    balance: { type: DataTypes.INTEGER, defaultValue: 0 },
    role: { type: DataTypes.STRING, defaultValue: 'customer' }, // 'customer' | 'manager' | 'super_admin'
    password: { type: DataTypes.STRING }, // MENEJERLAR U-N
    ClubId: { type: DataTypes.INTEGER, allowNull: true } // MENEJER BIRIKKANI
}, {
    hooks: {
        beforeCreate: async (user) => { if (user.password) user.password = await bcrypt.hash(user.password, 10); },
        beforeUpdate: async (user) => { if (user.changed('password')) user.password = await bcrypt.hash(user.password, 10); }
    }
});

User.prototype.comparePassword = async function (p) { return await bcrypt.compare(p, this.password); };

module.exports = User;
