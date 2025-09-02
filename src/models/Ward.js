const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ward = sequelize.define('Ward', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  wardCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  wardName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  wardType: {
    type: DataTypes.ENUM('general', 'private', 'semi_private', 'icu', 'emergency', 'pediatric', 'maternity', 'surgical'),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalBeds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  availableBeds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  occupiedBeds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  maintenanceBeds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  nurseStationLocation: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emergencyContactNumber: {
    type: DataTypes.STRING
  },
  wardIncharge: {
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

module.exports = Ward;
