const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  poNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  supplierId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Suppliers',
      key: 'id'
    }
  },
  items: {
    type: DataTypes.JSONB, // Array of {itemId, quantity, unitCost, totalCost}
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'),
    defaultValue: 'draft'
  },
  orderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expectedDeliveryDate: {
    type: DataTypes.DATE
  },
  actualDeliveryDate: {
    type: DataTypes.DATE
  },
  createdBy: {
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
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = PurchaseOrder;
