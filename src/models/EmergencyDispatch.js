const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmergencyDispatch = sequelize.define('EmergencyDispatch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dispatchId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  callReceived: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  callerName: {
    type: DataTypes.STRING
  },
  callerPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  incidentLocation: {
    type: DataTypes.JSONB, // address, coordinates
    allowNull: false
  },
  incidentType: {
    type: DataTypes.ENUM('medical_emergency', 'trauma', 'cardiac_arrest', 'respiratory_failure', 'accident', 'fire', 'hazmat', 'other'),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('life_threatening', 'urgent', 'non_urgent'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ambulanceId: {
    type: DataTypes.UUID,
    references: {
      model: 'Ambulances',
      key: 'id'
    }
  },
  dispatchTime: {
    type: DataTypes.DATE
  },
  arrivalTime: {
    type: DataTypes.DATE
  },
  transportTime: {
    type: DataTypes.DATE
  },
  hospitalArrivalTime: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('received', 'dispatched', 'en_route', 'at_scene', 'transporting', 'completed', 'cancelled'),
    defaultValue: 'received'
  },
  estimatedArrival: {
    type: DataTypes.DATE
  },
  actualResponseTime: {
    type: DataTypes.INTEGER // minutes
  },
  crewReport: {
    type: DataTypes.TEXT
  },
  vitalsAtScene: {
    type: DataTypes.JSONB
  },
  treatmentProvided: {
    type: DataTypes.JSONB
  },
  patientCondition: {
    type: DataTypes.STRING
  },
  destinationHospital: {
    type: DataTypes.STRING
  },
  dispatchedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  completedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = EmergencyDispatch;
