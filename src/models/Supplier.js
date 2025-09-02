const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  supplierCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
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
  gstNumber: {
    type: DataTypes.STRING
  },
  licenseNumber: {
    type: DataTypes.STRING
  },
  category: {
    type: DataTypes.ENUM('pharmaceutical', 'medical_equipment', 'surgical_supplies', 'lab_equipment', 'general_supplies'),
    allowNull: false
  },
  paymentTerms: {
    type: DataTypes.STRING // "30 days", "COD", etc.
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2), // 1.00 to 5.00
    defaultValue: 0.00
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = Supplier;
