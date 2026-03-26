const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Club = sequelize.define('Club', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active', // 'active' | 'blocked' | 'inactive'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    img: {
        type: DataTypes.STRING, // Main image
    },
    images: {
        type: DataTypes.TEXT, // Stored as JSON string of array [img1, img2, ...]
    },
    locationUrl: {
        type: DataTypes.STRING,
    },
    coordinates: {
        type: DataTypes.STRING, // "lat, long"
    },
    price: {
        type: DataTypes.STRING,
        defaultValue: "20,000",
    },
    description: {
        type: DataTypes.TEXT,
    }
});

module.exports = Club;
