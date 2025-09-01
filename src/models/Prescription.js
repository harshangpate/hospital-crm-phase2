const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  prescriptionId: {
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
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  medications: {
    type: DataTypes.JSONB, // Store array of medication objects
    allowNull: false
  },
  instructions: {
    type: DataTypes.TEXT
  },
  followUpDate: {
    type: DataTypes.DATEONLY
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
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active'
  }
});

module.exports = Prescription;
