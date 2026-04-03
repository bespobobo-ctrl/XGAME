const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING, defaultValue: 'Boshqa' }, // e.g. Ichimlik, Ovqat, Shirinlik
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    image: { type: DataTypes.STRING }, // Optional image URL
    ClubId: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = Product;
