const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TriageProtocol = sequelize.define('TriageProtocol', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  protocolName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('adult', 'pediatric', 'trauma', 'cardiac', 'respiratory', 'mental_health', 'disaster'),
    allowNull: false
  },
  symptoms: {
    type: DataTypes.JSONB, // Array of symptoms
    allowNull: false
  },
  vitalSignCriteria: {
    type: DataTypes.JSONB, // BP, HR, temp ranges
  },
  recommendedTriageLevel: {
    type: DataTypes.ENUM('critical', 'urgent', 'semi_urgent', 'non_urgent'),
    allowNull: false
  },
  recommendedActions: {
    type: DataTypes.JSONB, // Array of immediate actions
  },
  estimatedWaitTime: {
    type: DataTypes.INTEGER // minutes
  },
  requiredResources: {
    type: DataTypes.JSONB // Equipment, staff needed
  },
  contraindications: {
    type: DataTypes.JSONB
  },
  specialInstructions: {
    type: DataTypes.TEXT
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
  },
  version: {
    type: DataTypes.STRING,
    defaultValue: '1.0'
  },
  effectiveDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = TriageProtocol;
