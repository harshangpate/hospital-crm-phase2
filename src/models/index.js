const sequelize = require('../config/database');
const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const Prescription = require('./Prescription');
const LabReport = require('./LabReport');
const MedicalRecord = require('./MedicalRecord');
const VitalSigns = require('./VitalSigns');
const Billing = require('./Billing');
const Payment = require('./Payment');
const ServiceCatalog = require('./ServiceCatalog');
const InventoryItem = require('./InventoryItem');
const StockTransaction = require('./StockTransaction');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');

// Define associations/relationships
User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });
Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Patient.hasMany(Prescription, { foreignKey: 'patientId', as: 'prescriptions' });
Prescription.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Doctor.hasMany(Prescription, { foreignKey: 'doctorId', as: 'prescriptions' });
Prescription.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Appointment.hasOne(Prescription, { foreignKey: 'appointmentId', as: 'prescription' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

Patient.hasMany(LabReport, { foreignKey: 'patientId', as: 'labReports' });
LabReport.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Doctor.hasMany(LabReport, { foreignKey: 'doctorId', as: 'labReports' });
LabReport.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// Medical Records relationships
Patient.hasMany(MedicalRecord, { foreignKey: 'patientId', as: 'medicalRecords' });
MedicalRecord.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Doctor.hasMany(MedicalRecord, { foreignKey: 'doctorId', as: 'medicalRecords' });
MedicalRecord.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Appointment.hasMany(MedicalRecord, { foreignKey: 'appointmentId', as: 'medicalRecords' });
MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// Vital Signs relationships
Patient.hasMany(VitalSigns, { foreignKey: 'patientId', as: 'vitalSigns' });
VitalSigns.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(VitalSigns, { foreignKey: 'recordedBy', as: 'recordedVitalSigns' });
VitalSigns.belongsTo(User, { foreignKey: 'recordedBy', as: 'recordedByUser' });

Appointment.hasMany(VitalSigns, { foreignKey: 'appointmentId', as: 'vitalSigns' });
VitalSigns.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// Billing relationships
Patient.hasMany(Billing, { foreignKey: 'patientId', as: 'bills' });
Billing.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Appointment.hasMany(Billing, { foreignKey: 'appointmentId', as: 'bills' });
Billing.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

User.hasMany(Billing, { foreignKey: 'createdBy', as: 'createdBills' });
Billing.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Payment relationships
Billing.hasMany(Payment, { foreignKey: 'billId', as: 'payments' });
Payment.belongsTo(Billing, { foreignKey: 'billId', as: 'bill' });

Patient.hasMany(Payment, { foreignKey: 'patientId', as: 'payments' });
Payment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Payment, { foreignKey: 'receivedBy', as: 'receivedPayments' });
Payment.belongsTo(User, { foreignKey: 'receivedBy', as: 'receiver' });

Supplier.hasMany(InventoryItem, { foreignKey: 'supplierId', as: 'items' });
InventoryItem.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

User.hasMany(InventoryItem, { foreignKey: 'lastUpdatedBy', as: 'updatedItems' });
InventoryItem.belongsTo(User, { foreignKey: 'lastUpdatedBy', as: 'updatedBy' });

// Stock Transaction relationships
InventoryItem.hasMany(StockTransaction, { foreignKey: 'itemId', as: 'transactions' });
StockTransaction.belongsTo(InventoryItem, { foreignKey: 'itemId', as: 'item' });

User.hasMany(StockTransaction, { foreignKey: 'performedBy', as: 'performedTransactions' });
StockTransaction.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });

User.hasMany(StockTransaction, { foreignKey: 'approvedBy', as: 'approvedTransactions' });
StockTransaction.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

Patient.hasMany(StockTransaction, { foreignKey: 'patientId', as: 'stockTransactions' });
StockTransaction.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Billing.hasMany(StockTransaction, { foreignKey: 'billId', as: 'stockTransactions' });
StockTransaction.belongsTo(Billing, { foreignKey: 'billId', as: 'bill' });

// Purchase Order relationships
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

User.hasMany(PurchaseOrder, { foreignKey: 'createdBy', as: 'createdOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(PurchaseOrder, { foreignKey: 'approvedBy', as: 'approvedOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

module.exports = {
  sequelize,
  User,
  Patient,
  Doctor,
  Appointment,
  Prescription,
  LabReport,
  MedicalRecord,
  VitalSigns,
  Billing,
  Payment,
  ServiceCatalog,
  InventoryItem,    // Add these
  StockTransaction,
  Supplier,
  PurchaseOrder
};
