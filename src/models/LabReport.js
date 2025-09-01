const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LabReport = sequelize.define('LabReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reportId: {
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
    references: {
      model: 'Doctors',
      key: 'id'
    }
  },
  testName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  testType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sampleCollectedAt: {
    type: DataTypes.DATE
  },
  reportDate: {
    type: DataTypes.DATEONLY
  },
  results: {
    type: DataTypes.JSONB, // Store test results as JSON
    allowNull: false
  },
  normalRanges: {
    type: DataTypes.JSONB
  },
  status: {
    type: DataTypes.ENUM('sample_collected', 'in_progress', 'completed', 'reviewed'),
    defaultValue: 'sample_collected'
  },
  priority: {
    type: DataTypes.ENUM('normal', 'urgent', 'critical'),
    defaultValue: 'normal'
  },
  technician: {
    type: DataTypes.STRING
  },
  comments: {
    type: DataTypes.TEXT
  },
  pdfPath: {
    type: DataTypes.STRING
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailSentAt: {
    type: DataTypes.DATE
  }
});

module.exports = LabReport;
