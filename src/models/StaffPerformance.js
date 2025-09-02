const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StaffPerformance = sequelize.define('StaffPerformance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  evaluationPeriod: {
    type: DataTypes.STRING, // "2025-Q1", "2025-Jan"
    allowNull: false
  },
  attendanceScore: {
    type: DataTypes.DECIMAL(3, 1), // 0.0 to 10.0
    defaultValue: 0.0
  },
  punctualityScore: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 0.0
  },
  productivityScore: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 0.0
  },
  teamworkScore: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 0.0
  },
  patientSatisfactionScore: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 0.0
  },
  overallRating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 0.0
  },
  strengths: {
    type: DataTypes.TEXT
  },
  areasForImprovement: {
    type: DataTypes.TEXT
  },
  goals: {
    type: DataTypes.JSONB
  },
  achievements: {
    type: DataTypes.JSONB
  },
  evaluatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  evaluationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = StaffPerformance;
