const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DrugStockTransaction = sequelize.define('DrugStockTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transactionId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  drugId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'DrugInventories',
      key: 'id'
    }
  },
  transactionType: {
    type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'return', 'expired', 'damaged', 'transfer'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  totalCost: {
    type: DataTypes.DECIMAL(12, 2)
  },
  batchNumber: {
    type: DataTypes.STRING
  },
  expiryDate: {
    type: DataTypes.DATE
  },
  prescriptionFulfillmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'PrescriptionFulfillments',
      key: 'id'
    }
  },
  supplierId: {
    type: DataTypes.UUID,
    references: {
      model: 'Suppliers',
      key: 'id'
    }
  },
  referenceNumber: {
    type: DataTypes.STRING // Invoice, PO number, etc.
  },
  reason: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  performedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  transactionDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = DrugStockTransaction;
