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
  // 🆕 Simple technician assignment field
  assignedTechnician: {
    type: DataTypes.STRING,  // Email or name of assigned technician
    allowNull: true
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
    allowNull: false,
    defaultValue: {} // 🔄 Changed: Default to empty object instead of required
  },
  normalRanges: {
    type: DataTypes.JSONB,
    defaultValue: {}
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
    type: DataTypes.STRING  // Keep for backward compatibility
  },
  comments: {
    type: DataTypes.TEXT
  },
  // 🆕 New field for technician notes
  technicianNotes: {
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
}, {
  tableName: 'LabReports',
  timestamps: true
});

module.exports = LabReport;
