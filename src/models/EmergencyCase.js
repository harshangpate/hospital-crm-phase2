const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmergencyCase = sequelize.define('EmergencyCase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  emergencyId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  patientId: {
    type: DataTypes.UUID,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  triageLevel: {
    type: DataTypes.ENUM('critical', 'urgent', 'semi_urgent', 'non_urgent', 'deceased'),
    allowNull: false
  },
  triageColor: {
    type: DataTypes.ENUM('red', 'orange', 'yellow', 'green', 'black'),
    allowNull: false
  },
  chiefComplaint: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  symptoms: {
    type: DataTypes.JSONB // Array of symptoms
  },
  vitalSigns: {
    type: DataTypes.JSONB // BP, HR, temp, etc.
  },
  painLevel: {
    type: DataTypes.INTEGER, // 1-10 scale
    validate: { min: 0, max: 10 }
  },
  arrivalMethod: {
    type: DataTypes.ENUM('walk_in', 'ambulance', 'police', 'helicopter', 'transfer'),
    allowNull: false
  },
  ambulanceId: {
    type: DataTypes.UUID,
    references: {
      model: 'Ambulances',
      key: 'id'
    }
  },
  bedId: {
    type: DataTypes.UUID,
    references: {
      model: 'Beds',
      key: 'id'
    }
  },
  assignedDoctorId: {
    type: DataTypes.UUID,
    references: {
      model: 'Doctors',
      key: 'id'
    }
  },
  assignedNurseId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('arrived', 'triaged', 'in_treatment', 'admitted', 'discharged', 'transferred', 'deceased'),
    defaultValue: 'arrived'
  },
  priority: {
    type: DataTypes.INTEGER, // 1-5 priority ranking
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  estimatedWaitTime: {
    type: DataTypes.INTEGER // minutes
  },
  actualWaitTime: {
    type: DataTypes.INTEGER // minutes
  },
  arrivalTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  triageTime: {
    type: DataTypes.DATE
  },
  treatmentStartTime: {
    type: DataTypes.DATE
  },
  dischargeTime: {
    type: DataTypes.DATE
  },
  emergencyContact: {
    type: DataTypes.JSONB
  },
  allergies: {
    type: DataTypes.TEXT
  },
  medications: {
    type: DataTypes.JSONB
  },
  medicalHistory: {
    type: DataTypes.TEXT
  },
  triageNotes: {
    type: DataTypes.TEXT
  },
  treatmentNotes: {
    type: DataTypes.TEXT
  },
  isTrauma: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isContagious: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requiresIsolation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  triageBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
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

module.exports = EmergencyCase;
