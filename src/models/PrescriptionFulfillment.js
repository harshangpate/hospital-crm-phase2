const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrescriptionFulfillment = sequelize.define('PrescriptionFulfillment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fulfillmentId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  prescriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Prescriptions',
      key: 'id'
    }
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  pharmacistId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  dispensedMedications: {
    type: DataTypes.JSONB, // Array of dispensed drugs with quantities
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  insuranceCovered: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  patientPayable: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'insurance', 'digital_wallet'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  dispensedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  pickupDate: {
    type: DataTypes.DATE
  },
  deliveryAddress: {
    type: DataTypes.JSONB
  },
  deliveryStatus: {
    type: DataTypes.ENUM('not_applicable', 'pending', 'out_for_delivery', 'delivered', 'failed'),
    defaultValue: 'not_applicable'
  },
  counselingProvided: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  counselingNotes: {
    type: DataTypes.TEXT
  },
  substitutesDispensed: {
    type: DataTypes.JSONB // If generic substitutes were given
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = PrescriptionFulfillment;
