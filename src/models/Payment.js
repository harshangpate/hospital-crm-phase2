const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  paymentId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  billId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Billings',
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
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'upi', 'net_banking', 'cheque', 'insurance'),
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING
  },
  paymentGateway: {
    type: DataTypes.STRING // Razorpay, Stripe, etc.
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  receivedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  },
  receiptPath: {
    type: DataTypes.STRING
  }
});

module.exports = Payment;
