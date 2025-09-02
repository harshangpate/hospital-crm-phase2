const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bed = sequelize.define('Bed', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bedNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Rooms',
      key: 'id'
    }
  },
  wardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Wards',
      key: 'id'
    }
  },
  bedType: {
    type: DataTypes.ENUM('standard', 'electric', 'icu', 'pediatric', 'bariatric'),
    allowNull: false,
    defaultValue: 'standard'
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'cleaning', 'reserved'),
    defaultValue: 'available'
  },
  currentPatientId: {
    type: DataTypes.UUID,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  admissionDate: {
    type: DataTypes.DATE
  },
  expectedDischargeDate: {
    type: DataTypes.DATE
  },
  actualDischargeDate: {
    type: DataTypes.DATE
  },
  bedFeatures: {
    type: DataTypes.JSONB // monitors, ventilator, etc.
  },
  lastCleaned: {
    type: DataTypes.DATE
  },
  assignedNurse: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = Bed;
