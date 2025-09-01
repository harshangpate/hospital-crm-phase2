const sequelize = require('../config/database');
const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const Prescription = require('./Prescription');
const LabReport = require('./LabReport');

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

module.exports = {
  sequelize,
  User,
  Patient,
  Doctor,
  Appointment,
  Prescription,
  LabReport
};
