const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Billing = sequelize.define('Billing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  billId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  appointmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'Appointments',
      key: 'id'
    }
  },
  billType: {
    type: DataTypes.ENUM('consultation', 'procedure', 'lab_test', 'pharmacy', 'room_charges', 'emergency'),
    allowNull: false
  },
  services: {
    type: DataTypes.JSONB, // Array of services with prices
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  taxPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 18.00 // GST
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  outstandingAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'refunded'),
    defaultValue: 'unpaid'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'upi', 'net_banking', 'insurance', 'corporate'),
    defaultValue: 'cash'
  },
  insuranceClaimId: {
    type: DataTypes.STRING
  },
  insuranceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  dueDate: {
    type: DataTypes.DATE
  },
  billDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  },
  pdfPath: {
    type: DataTypes.STRING
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Calculate totals automatically
Billing.addHook('beforeSave', (bill) => {
  // Calculate subtotal from services
  if (bill.services && Array.isArray(bill.services)) {
    bill.subtotal = bill.services.reduce((sum, service) => {
      return sum + (parseFloat(service.price) * parseFloat(service.quantity || 1));
    }, 0);
  }
  
  // Apply discount
  const discountAmt = bill.discountPercentage > 0 
    ? (bill.subtotal * bill.discountPercentage / 100)
    : (bill.discountAmount || 0);
  bill.discountAmount = discountAmt;
  
  // Calculate tax
  const afterDiscount = bill.subtotal - discountAmt;
  bill.taxAmount = afterDiscount * (bill.taxPercentage / 100);
  
  // Calculate total
  bill.totalAmount = afterDiscount + bill.taxAmount;
  
  // Calculate outstanding
  bill.outstandingAmount = bill.totalAmount - (bill.paidAmount || 0);
  
  // Update payment status
  if (bill.paidAmount >= bill.totalAmount) {
    bill.paymentStatus = 'paid';
  } else if (bill.paidAmount > 0) {
    bill.paymentStatus = 'partial';
  } else {
    bill.paymentStatus = 'unpaid';
  }
});

module.exports = Billing;
