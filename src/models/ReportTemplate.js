const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportTemplate = sequelize.define('ReportTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reportType: {
    type: DataTypes.ENUM('executive', 'clinical', 'financial', 'operational', 'custom'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  queryConfig: {
    type: DataTypes.JSONB, // Query configuration
    allowNull: false
  },
  chartConfig: {
    type: DataTypes.JSONB // Chart and visualization settings
  },
  scheduledFrequency: {
    type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly', 'quarterly'),
    defaultValue: 'none'
  },
  recipients: {
    type: DataTypes.JSONB // Email recipients for scheduled reports
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = ReportTemplate;
