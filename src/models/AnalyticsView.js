const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnalyticsView = sequelize.define('AnalyticsView', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  viewName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  viewType: {
    type: DataTypes.ENUM('patient_flow', 'financial', 'operational', 'clinical', 'staff', 'inventory'),
    allowNull: false
  },
  dateRange: {
    type: DataTypes.STRING, // daily, weekly, monthly, yearly
    allowNull: false
  },
  calculatedDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  metrics: {
    type: DataTypes.JSONB, // Stored calculated metrics
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = AnalyticsView;
