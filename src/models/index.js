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
  Billing,        // Add these
  Payment,
  ServiceCatalog
};
