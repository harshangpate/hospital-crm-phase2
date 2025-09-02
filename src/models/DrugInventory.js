const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DrugInventory = sequelize.define('DrugInventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  drugCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  drugName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  genericName: {
    type: DataTypes.STRING
  },
  brandName: {
    type: DataTypes.STRING
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'other'),
    allowNull: false
  },
  strength: {
    type: DataTypes.STRING // e.g., "500mg", "10ml"
  },
  dosageForm: {
    type: DataTypes.STRING
  },
  batchNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  manufacturingDate: {
    type: DataTypes.DATE
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  quantityInStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  minimumStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  reorderLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  mrp: {
    type: DataTypes.DECIMAL(10, 2) // Maximum Retail Price
  },
  gst: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 12.00 // GST percentage
  },
  location: {
    type: DataTypes.STRING // Shelf location
  },
  barcode: {
    type: DataTypes.STRING,
    unique: true
  },
  isControlledSubstance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scheduleCategory: {
    type: DataTypes.ENUM('H', 'H1', 'X', 'G', 'other'), // Drug schedule categories
    defaultValue: 'G'
  },
  requiresPrescription: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  storageConditions: {
    type: DataTypes.TEXT
  },
  sideEffects: {
    type: DataTypes.TEXT
  },
  contraindications: {
    type: DataTypes.TEXT
  },
  interactions: {
    type: DataTypes.JSONB // Drug interactions
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
  lastUpdatedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

// Add hooks for stock alerts
DrugInventory.addHook('afterUpdate', (drug) => {
  if (drug.quantityInStock <= drug.reorderLevel && drug.quantityInStock > 0) {
    console.log(`🔔 REORDER ALERT: ${drug.drugName} is running low. Current: ${drug.quantityInStock}, Reorder Level: ${drug.reorderLevel}`);
  }
  
  if (drug.quantityInStock === 0) {
    console.log(`🚨 OUT OF STOCK: ${drug.drugName} is out of stock!`);
  }
  
  // Check expiry (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  if (drug.expiryDate <= thirtyDaysFromNow) {
    console.log(`⚠️ EXPIRY ALERT: ${drug.drugName} expires on ${drug.expiryDate}`);
  }
});

module.exports = DrugInventory;
