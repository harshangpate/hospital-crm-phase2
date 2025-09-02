const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  attendanceId: {
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
  scheduleId: {
    type: DataTypes.UUID,
    references: {
      model: 'StaffSchedules',
      key: 'id'
    }
  },
  attendanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  clockInTime: {
    type: DataTypes.TIME
  },
  clockOutTime: {
    type: DataTypes.TIME
  },
  scheduledStart: {
    type: DataTypes.TIME
  },
  scheduledEnd: {
    type: DataTypes.TIME
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'early_out', 'overtime', 'on_leave', 'half_day'),
    allowNull: false
  },
  workHours: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0.00
  },
  overtimeHours: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0.00
  },
  breakDuration: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0.00
  },
  lateMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  earlyOutMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  location: {
    type: DataTypes.STRING // GPS coordinates or department
  },
  notes: {
    type: DataTypes.TEXT
  },
  approvedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Attendance;
