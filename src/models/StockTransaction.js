const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockTransaction = sequelize.define('StockTransaction', {
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
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'InventoryItems',
      key: 'id'
    }
  },
  transactionType: {
    type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'transfer', 'return', 'damage', 'expired'),
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
  referenceNumber: {
    type: DataTypes.STRING
  },
  patientId: {
    type: DataTypes.UUID,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  billId: {
    type: DataTypes.UUID,
    references: {
      model: 'Billings',
      key: 'id'
    }
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

module.exports = StockTransaction;
