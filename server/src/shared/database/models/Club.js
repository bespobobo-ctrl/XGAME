const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Club = sequelize.define('Club', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    level: { type: DataTypes.STRING, defaultValue: 'standard' },
    priority: { type: DataTypes.INTEGER, defaultValue: 0 },
    image: { type: DataTypes.STRING },
    images: { type: DataTypes.TEXT },
    locationUrl: { type: DataTypes.STRING },
    lat: { type: DataTypes.DOUBLE, defaultValue: 41.2995 }, // Xarita uchun Latitude (Toshkent)
    lng: { type: DataTypes.DOUBLE, defaultValue: 69.2401 }, // Xarita uchun Longitude
    price: { type: DataTypes.STRING, defaultValue: "20,000" },
    description: { type: DataTypes.TEXT },
    cardNumber: { type: DataTypes.STRING },
    cardOwner: { type: DataTypes.STRING }
});

module.exports = Club;
