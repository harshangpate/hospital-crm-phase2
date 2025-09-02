const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  leaveId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  leaveType: {
    type: DataTypes.ENUM('sick', 'casual', 'emergency', 'maternity', 'paternity', 'annual', 'unpaid'),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  totalDays: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending'
  },
  appliedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  reviewedDate: {
    type: DataTypes.DATE
  },
  reviewedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewComments: {
    type: DataTypes.TEXT
  },
  attachments: {
    type: DataTypes.JSONB // medical certificates, documents
  },
  emergencyContact: {
    type: DataTypes.JSONB
  }
});

module.exports = LeaveRequest;
