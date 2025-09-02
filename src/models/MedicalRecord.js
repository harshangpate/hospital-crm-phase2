const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recordId: {
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
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Doctors',
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
  recordType: {
    type: DataTypes.ENUM('consultation', 'diagnosis', 'treatment', 'progress_note', 'discharge_summary'),
    allowNull: false,
    defaultValue: 'consultation'
  },
  chiefComplaint: {
    type: DataTypes.TEXT
  },
  historyOfPresentIllness: {
    type: DataTypes.TEXT
  },
  physicalExamination: {
    type: DataTypes.TEXT
  },
  diagnosis: {
    type: DataTypes.TEXT
  },
  differentialDiagnosis: {
    type: DataTypes.TEXT
  },
  treatmentPlan: {
    type: DataTypes.TEXT
  },
  medications: {
    type: DataTypes.JSONB
  },
  investigations: {
    type: DataTypes.JSONB
  },
  followUpInstructions: {
    type: DataTypes.TEXT
  },
  doctorNotes: {
    type: DataTypes.TEXT
  },
  vitalSigns: {
    type: DataTypes.JSONB // Store BP, HR, Temp, etc.
  },
  attachments: {
    type: DataTypes.JSONB // Store file paths/URLs
  },
  isConfidential: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'final', 'amended'),
    defaultValue: 'draft'
  }
});

module.exports = MedicalRecord;
