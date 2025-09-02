const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExternalIntegration = sequelize.define('ExternalIntegration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  integrationCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('government', 'insurance', 'messaging', 'telemedicine', 'equipment', 'laboratory', 'pharmacy', 'email'),
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING, // WhatsApp, Twilio, ABDM, IRDAI, etc.
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  apiEndpoint: {
    type: DataTypes.STRING
  },
  authConfig: {
    type: DataTypes.JSONB, // API keys, tokens, certificates
    allowNull: false
  },
  webhookUrl: {
    type: DataTypes.STRING
  },
  supportedFeatures: {
    type: DataTypes.JSONB // Array of supported features
  },
  rateLimits: {
    type: DataTypes.JSONB // Rate limiting configuration
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'error', 'testing'),
    defaultValue: 'inactive'
  },
  lastSync: {
    type: DataTypes.DATE
  },
  syncStatus: {
    type: DataTypes.STRING
  },
  errorLog: {
    type: DataTypes.TEXT
  },
  configuration: {
    type: DataTypes.JSONB // Integration-specific settings
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

module.exports = ExternalIntegration;
