const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VitalSigns = sequelize.define('VitalSigns', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  recordedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  appointmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'Appointments',
      key: 'id'
    }
  },
  bloodPressureSystolic: {
    type: DataTypes.INTEGER
  },
  bloodPressureDiastolic: {
    type: DataTypes.INTEGER
  },
  heartRate: {
    type: DataTypes.INTEGER
  },
  temperature: {
    type: DataTypes.DECIMAL(4, 1) // 98.6°F
  },
  respiratoryRate: {
    type: DataTypes.INTEGER
  },
  oxygenSaturation: {
    type: DataTypes.INTEGER
  },
  height: {
    type: DataTypes.DECIMAL(5, 2) // in cm
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2) // in kg
  },
  bmi: {
    type: DataTypes.DECIMAL(4, 1)
  },
  painScale: {
    type: DataTypes.INTEGER // 1-10 scale
  },
  notes: {
    type: DataTypes.TEXT
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Calculate BMI automatically
VitalSigns.addHook('beforeSave', (vitalSigns) => {
  if (vitalSigns.height && vitalSigns.weight) {
    const heightInMeters = vitalSigns.height / 100;
    vitalSigns.bmi = (vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
});

module.exports = VitalSigns;
