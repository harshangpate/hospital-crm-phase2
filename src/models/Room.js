const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roomNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  wardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Wards',
      key: 'id'
    }
  },
  roomType: {
    type: DataTypes.ENUM('single', 'double', 'triple', 'ward', 'icu', 'emergency', 'operation_theater'),
    allowNull: false
  },
  totalBeds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  availableBeds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  bedNumbers: {
    type: DataTypes.JSONB // Array of bed identifiers
  },
  amenities: {
    type: DataTypes.JSONB // TV, AC, WiFi, etc.
  },
  dailyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'cleaning', 'reserved'),
    defaultValue: 'available'
  },
  lastCleaned: {
    type: DataTypes.DATE
  },
  nextMaintenanceDate: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = Room;
