const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  itemCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('medicine', 'surgical_equipment', 'consumables', 'lab_supplies', 'office_supplies', 'medical_devices'),
    allowNull: false
  },
  subCategory: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  manufacturer: {
    type: DataTypes.STRING
  },
  brand: {
    type: DataTypes.STRING
  },
  unit: {
    type: DataTypes.ENUM('pieces', 'boxes', 'bottles', 'strips', 'kg', 'grams', 'liters', 'ml'),
    allowNull: false,
    defaultValue: 'pieces'
  },
  currentStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  minimumStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  maximumStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000
  },
  reorderLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  location: {
    type: DataTypes.STRING
  },
  barcode: {
    type: DataTypes.STRING,
    unique: true
  },
  expiryDate: {
    type: DataTypes.DATE
  },
  batchNumber: {
    type: DataTypes.STRING
  },
  supplierId: {
    type: DataTypes.UUID,
    references: {
      model: 'Suppliers',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiresPrescription: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isControlledSubstance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  storageConditions: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  lastUpdatedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

module.exports = InventoryItem;
