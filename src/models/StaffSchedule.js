const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StaffSchedule = sequelize.define('StaffSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  scheduleId: {
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
  shiftType: {
    type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night', 'on_call', 'double'),
    allowNull: false
  },
  shiftDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  shiftStart: {
    type: DataTypes.TIME,
    allowNull: false
  },
  shiftEnd: {
    type: DataTypes.TIME,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  wardId: {
    type: DataTypes.UUID,
    references: {
      model: 'Wards',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'),
    defaultValue: 'scheduled'
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.JSONB // daily, weekly, monthly patterns
  },
  totalHours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false
  },
  overtimeHours: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0.00
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0.00
  },
  overtimeRate: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0.00
  },
  totalPay: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

// Calculate total pay before saving
StaffSchedule.addHook('beforeSave', (schedule) => {
  const regularPay = schedule.totalHours * (schedule.hourlyRate || 0);
  const overtimePay = schedule.overtimeHours * (schedule.overtimeRate || 0);
  schedule.totalPay = regularPay + overtimePay;
});

module.exports = StaffSchedule;
