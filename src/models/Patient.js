const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false
  },
  bloodGroup: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  pincode: {
    type: DataTypes.STRING
  },
  
  // Emergency Contact
  emergencyContactName: {
    type: DataTypes.STRING
  },
  emergencyContactPhone: {
    type: DataTypes.STRING
  },
  emergencyContactRelation: {
    type: DataTypes.STRING
  },
  
  // Medical Information - Change these to JSONB to store arrays
  allergies: {
    type: DataTypes.JSONB, // Changed from STRING to JSONB
    defaultValue: []
  },
  chronicConditions: {
    type: DataTypes.JSONB, // Add this field
    defaultValue: []
  },
  currentMedications: {
    type: DataTypes.JSONB, // Add this field
    defaultValue: []
  },
  medicalHistory: {
    type: DataTypes.JSONB, // Changed from STRING to JSONB
    defaultValue: []
  },
  
  // Insurance Information
  insuranceProvider: {
    type: DataTypes.STRING
  },
  insuranceNumber: {
    type: DataTypes.STRING
  },
  
  // Additional fields from your frontend form
  height: {
    type: DataTypes.DECIMAL(5, 2)
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2)
  },
  occupation: {
    type: DataTypes.STRING
  },
  maritalStatus: {
    type: DataTypes.STRING
  },
  preferredLanguage: {
    type: DataTypes.STRING
  },
  country: {
    type: DataTypes.STRING
  },
  pincode: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  
  profileImage: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Patient;
