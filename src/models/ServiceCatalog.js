const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceCatalog = sequelize.define('ServiceCatalog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  serviceCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  serviceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('consultation', 'procedure', 'lab_test', 'radiology', 'pharmacy', 'room_charges', 'emergency', 'surgery'),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  insurancePrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  emergencyPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  description: {
    type: DataTypes.TEXT
  },
  duration: {
    type: DataTypes.INTEGER // in minutes
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  taxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = ServiceCatalog;
