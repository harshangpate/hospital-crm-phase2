const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommunicationLog = sequelize.define('CommunicationLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  logId: {
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
  patientId: {
    type: DataTypes.UUID,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  communicationType: {
    type: DataTypes.ENUM('sms', 'whatsapp', 'email', 'voice_call', 'video_call', 'push_notification'),
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    allowNull: false
  },
  recipient: {
    type: DataTypes.STRING, // Phone number, email, etc.
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING
  },
  message: {
    type: DataTypes.TEXT
  },
  templateId: {
    type: DataTypes.STRING
  },
  templateVariables: {
    type: DataTypes.JSONB
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  deliveryStatus: {
    type: DataTypes.JSONB // Delivery receipts and tracking
  },
  externalMessageId: {
    type: DataTypes.STRING // ID from external service
  },
  cost: {
    type: DataTypes.DECIMAL(8, 4)
  },
  scheduledTime: {
    type: DataTypes.DATE
  },
  sentTime: {
    type: DataTypes.DATE
  },
  deliveredTime: {
    type: DataTypes.DATE
  },
  readTime: {
    type: DataTypes.DATE
  },
  errorMessage: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB // Additional tracking data
  },
  triggeredBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

module.exports = CommunicationLog;
