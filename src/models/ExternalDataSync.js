const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExternalDataSync = sequelize.define('ExternalDataSync', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  syncId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  integrationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ExternalIntegrations',
      key: 'id'
    }
  },
  dataType: {
    type: DataTypes.ENUM('patient_data', 'lab_results', 'insurance_claims', 'prescriptions', 'appointments', 'billing_data'),
    allowNull: false
  },
  operation: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'sync'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.UUID // ID of the local entity being synced
  },
  externalEntityId: {
    type: DataTypes.STRING // ID in the external system
  },
  syncDirection: {
    type: DataTypes.ENUM('push', 'pull', 'bidirectional'),
    allowNull: false
  },
  requestPayload: {
    type: DataTypes.JSONB
  },
  responsePayload: {
    type: DataTypes.JSONB
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'partial'),
    defaultValue: 'pending'
  },
  startTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE
  },
  errorDetails: {
    type: DataTypes.JSONB
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  nextRetryTime: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = ExternalDataSync;
