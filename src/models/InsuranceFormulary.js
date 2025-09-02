const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InsuranceFormulary = sequelize.define('InsuranceFormulary', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  insuranceProvider: {
    type: DataTypes.STRING,
    allowNull: false
  },
  planType: {
    type: DataTypes.STRING
  },
  drugId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'DrugInventories',
      key: 'id'
    }
  },
  tierLevel: {
    type: DataTypes.INTEGER, // 1, 2, 3, etc.
    validate: { min: 1, max: 5 }
  },
  copayAmount: {
    type: DataTypes.DECIMAL(8, 2)
  },
  coinsurancePercentage: {
    type: DataTypes.DECIMAL(5, 2)
  },
  coveragePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 80.00
  },
  priorAuthorizationRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  quantityLimit: {
    type: DataTypes.INTEGER
  },
  daysSupplyLimit: {
    type: DataTypes.INTEGER
  },
  ageRestrictions: {
    type: DataTypes.JSONB
  },
  isPreferred: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  expirationDate: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = InsuranceFormulary;
