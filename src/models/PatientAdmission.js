const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PatientAdmission = sequelize.define('PatientAdmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  admissionId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  bedId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Beds',
      key: 'id'
    }
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
  admittingDoctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Doctors',
      key: 'id'
    }
  },
  admissionType: {
    type: DataTypes.ENUM('emergency', 'scheduled', 'transfer', 'readmission'),
    allowNull: false
  },
  admissionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expectedDischargeDate: {
    type: DataTypes.DATE
  },
  actualDischargeDate: {
    type: DataTypes.DATE
  },
  dischargeReason: {
    type: DataTypes.ENUM('recovered', 'transferred', 'discharged_against_advice', 'expired', 'referred'),
  },
  admissionDiagnosis: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dischargeDiagnosis: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('admitted', 'discharged', 'transferred'),
    defaultValue: 'admitted'
  },
  totalCost: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  insuranceCovered: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  patientPayable: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  emergencyContact: {
    type: DataTypes.JSONB
  },
  admittedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  dischargedBy: {
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

module.exports = PatientAdmission;
