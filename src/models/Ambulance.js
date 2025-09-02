const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ambulance = sequelize.define('Ambulance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  vehicleType: {
    type: DataTypes.ENUM('basic', 'advanced', 'critical_care', 'helicopter', 'motorcycle'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'dispatched', 'en_route', 'at_scene', 'transporting', 'at_hospital', 'out_of_service'),
    defaultValue: 'available'
  },
  currentLocation: {
    type: DataTypes.JSONB // lat, lng coordinates
  },
  baseStation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  crewMembers: {
    type: DataTypes.JSONB // Array of crew member IDs
  },
  equipment: {
    type: DataTypes.JSONB // Medical equipment onboard
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  currentPatients: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fuelLevel: {
    type: DataTypes.DECIMAL(5, 2), // percentage
    validate: { min: 0, max: 100 }
  },
  mileage: {
    type: DataTypes.INTEGER
  },
  lastMaintenance: {
    type: DataTypes.DATE
  },
  nextMaintenanceDue: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emergencyResponse: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = Ambulance;
