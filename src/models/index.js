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
const Ward = require('./Ward');
const Room = require('./Room');
const Bed = require('./Bed');
const PatientAdmission = require('./PatientAdmission');
const StaffSchedule = require('./StaffSchedule');
const Attendance = require('./Attendance');
const LeaveRequest = require('./LeaveRequest');
const StaffPerformance = require('./StaffPerformance');
const EmergencyCase = require('./EmergencyCase');
const Ambulance = require('./Ambulance');
const EmergencyDispatch = require('./EmergencyDispatch');
const TriageProtocol = require('./TriageProtocol');
const DrugInventory = require('./DrugInventory');
const PrescriptionFulfillment = require('./PrescriptionFulfillment');
const DrugStockTransaction = require('./DrugStockTransaction');
const InsuranceFormulary = require('./InsuranceFormulary');
const AnalyticsView = require('./AnalyticsView');
const ReportTemplate = require('./ReportTemplate');
const ExternalIntegration = require('./ExternalIntegration');
const CommunicationLog = require('./CommunicationLog');
const ExternalDataSync = require('./ExternalDataSync');

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

// Ward relationships
User.hasMany(Ward, { foreignKey: 'wardIncharge', as: 'managedWards' });
Ward.belongsTo(User, { foreignKey: 'wardIncharge', as: 'incharge' });

Ward.hasMany(Room, { foreignKey: 'wardId', as: 'rooms' });
Room.belongsTo(Ward, { foreignKey: 'wardId', as: 'ward' });

Ward.hasMany(Bed, { foreignKey: 'wardId', as: 'beds' });
Bed.belongsTo(Ward, { foreignKey: 'wardId', as: 'ward' });

// Room relationships
Room.hasMany(Bed, { foreignKey: 'roomId', as: 'beds' });
Bed.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

// Bed relationships
Patient.hasMany(Bed, { foreignKey: 'currentPatientId', as: 'currentBeds' });
Bed.belongsTo(Patient, { foreignKey: 'currentPatientId', as: 'currentPatient' });

User.hasMany(Bed, { foreignKey: 'assignedNurse', as: 'assignedBeds' });
Bed.belongsTo(User, { foreignKey: 'assignedNurse', as: 'nurse' });

// Patient Admission relationships
Patient.hasMany(PatientAdmission, { foreignKey: 'patientId', as: 'admissions' });
PatientAdmission.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Doctor.hasMany(PatientAdmission, { foreignKey: 'admittingDoctorId', as: 'admissions' });
PatientAdmission.belongsTo(Doctor, { foreignKey: 'admittingDoctorId', as: 'admittingDoctor' });

Bed.hasMany(PatientAdmission, { foreignKey: 'bedId', as: 'admissions' });
PatientAdmission.belongsTo(Bed, { foreignKey: 'bedId', as: 'bed' });

Room.hasMany(PatientAdmission, { foreignKey: 'roomId', as: 'admissions' });
PatientAdmission.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

Ward.hasMany(PatientAdmission, { foreignKey: 'wardId', as: 'admissions' });
PatientAdmission.belongsTo(Ward, { foreignKey: 'wardId', as: 'ward' });

User.hasMany(PatientAdmission, { foreignKey: 'admittedBy', as: 'admittedPatients' });
PatientAdmission.belongsTo(User, { foreignKey: 'admittedBy', as: 'admittedByUser' });

User.hasMany(PatientAdmission, { foreignKey: 'dischargedBy', as: 'dischargedPatients' });
PatientAdmission.belongsTo(User, { foreignKey: 'dischargedBy', as: 'dischargedByUser' });

// Staff Schedule relationships
User.hasMany(StaffSchedule, { foreignKey: 'userId', as: 'schedules' });
StaffSchedule.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(StaffSchedule, { foreignKey: 'createdBy', as: 'createdSchedules' });
StaffSchedule.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Ward.hasMany(StaffSchedule, { foreignKey: 'wardId', as: 'schedules' });
StaffSchedule.belongsTo(Ward, { foreignKey: 'wardId', as: 'ward' });

// Attendance relationships
User.hasMany(Attendance, { foreignKey: 'userId', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

StaffSchedule.hasMany(Attendance, { foreignKey: 'scheduleId', as: 'attendances' });
Attendance.belongsTo(StaffSchedule, { foreignKey: 'scheduleId', as: 'schedule' });

User.hasMany(Attendance, { foreignKey: 'approvedBy', as: 'approvedAttendances' });
Attendance.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Leave Request relationships
User.hasMany(LeaveRequest, { foreignKey: 'userId', as: 'leaveRequests' });
LeaveRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LeaveRequest, { foreignKey: 'reviewedBy', as: 'reviewedLeaves' });
LeaveRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Performance relationships
User.hasMany(StaffPerformance, { foreignKey: 'userId', as: 'performances' });
StaffPerformance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(StaffPerformance, { foreignKey: 'evaluatedBy', as: 'evaluatedPerformances' });
StaffPerformance.belongsTo(User, { foreignKey: 'evaluatedBy', as: 'evaluator' });

// Emergency Case relationships
Patient.hasMany(EmergencyCase, { foreignKey: 'patientId', as: 'emergencyCases' });
EmergencyCase.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Doctor.hasMany(EmergencyCase, { foreignKey: 'assignedDoctorId', as: 'emergencyCases' });
EmergencyCase.belongsTo(Doctor, { foreignKey: 'assignedDoctorId', as: 'assignedDoctor' });

User.hasMany(EmergencyCase, { foreignKey: 'assignedNurseId', as: 'assignedEmergencies' });
EmergencyCase.belongsTo(User, { foreignKey: 'assignedNurseId', as: 'assignedNurse' });

User.hasMany(EmergencyCase, { foreignKey: 'triageBy', as: 'triagedCases' });
EmergencyCase.belongsTo(User, { foreignKey: 'triageBy', as: 'triageNurse' });

User.hasMany(EmergencyCase, { foreignKey: 'createdBy', as: 'createdEmergencies' });
EmergencyCase.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Bed.hasMany(EmergencyCase, { foreignKey: 'bedId', as: 'emergencyCases' });
EmergencyCase.belongsTo(Bed, { foreignKey: 'bedId', as: 'bed' });

// Ambulance relationships
Ambulance.hasMany(EmergencyCase, { foreignKey: 'ambulanceId', as: 'emergencyCases' });
EmergencyCase.belongsTo(Ambulance, { foreignKey: 'ambulanceId', as: 'ambulance' });

Ambulance.hasMany(EmergencyDispatch, { foreignKey: 'ambulanceId', as: 'dispatches' });
EmergencyDispatch.belongsTo(Ambulance, { foreignKey: 'ambulanceId', as: 'ambulance' });

// Emergency Dispatch relationships
User.hasMany(EmergencyDispatch, { foreignKey: 'dispatchedBy', as: 'dispatches' });
EmergencyDispatch.belongsTo(User, { foreignKey: 'dispatchedBy', as: 'dispatcher' });

User.hasMany(EmergencyDispatch, { foreignKey: 'completedBy', as: 'completedDispatches' });
EmergencyDispatch.belongsTo(User, { foreignKey: 'completedBy', as: 'completedByUser' });

// Triage Protocol relationships
User.hasMany(TriageProtocol, { foreignKey: 'createdBy', as: 'createdProtocols' });
TriageProtocol.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Drug Inventory relationships
Supplier.hasMany(DrugInventory, { foreignKey: 'supplierId', as: 'drugs' });
DrugInventory.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

User.hasMany(DrugInventory, { foreignKey: 'lastUpdatedBy', as: 'updatedDrugs' });
DrugInventory.belongsTo(User, { foreignKey: 'lastUpdatedBy', as: 'updatedBy' });

// Prescription Fulfillment relationships
Prescription.hasMany(PrescriptionFulfillment, { foreignKey: 'prescriptionId', as: 'fulfillments' });
PrescriptionFulfillment.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });

Patient.hasMany(PrescriptionFulfillment, { foreignKey: 'patientId', as: 'fulfillments' });
PrescriptionFulfillment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(PrescriptionFulfillment, { foreignKey: 'pharmacistId', as: 'dispensedPrescriptions' });
PrescriptionFulfillment.belongsTo(User, { foreignKey: 'pharmacistId', as: 'pharmacist' });

// Drug Stock Transaction relationships
DrugInventory.hasMany(DrugStockTransaction, { foreignKey: 'drugId', as: 'transactions' });
DrugStockTransaction.belongsTo(DrugInventory, { foreignKey: 'drugId', as: 'drug' });

PrescriptionFulfillment.hasMany(DrugStockTransaction, { foreignKey: 'prescriptionFulfillmentId', as: 'stockTransactions' });
DrugStockTransaction.belongsTo(PrescriptionFulfillment, { foreignKey: 'prescriptionFulfillmentId', as: 'fulfillment' });

User.hasMany(DrugStockTransaction, { foreignKey: 'performedBy', as: 'performedDrugTransactions' });
DrugStockTransaction.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });

Supplier.hasMany(DrugStockTransaction, { foreignKey: 'supplierId', as: 'drugTransactions' });
DrugStockTransaction.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Insurance Formulary relationships
DrugInventory.hasMany(InsuranceFormulary, { foreignKey: 'drugId', as: 'formularies' });
InsuranceFormulary.belongsTo(DrugInventory, { foreignKey: 'drugId', as: 'drug' });

// Add relationships
User.hasMany(ReportTemplate, { foreignKey: 'createdBy', as: 'createdReports' });
ReportTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(ExternalIntegration, { foreignKey: 'createdBy', as: 'createdIntegrations' });
ExternalIntegration.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

ExternalIntegration.hasMany(CommunicationLog, { foreignKey: 'integrationId', as: 'communications' });
CommunicationLog.belongsTo(ExternalIntegration, { foreignKey: 'integrationId', as: 'integration' });

Patient.hasMany(CommunicationLog, { foreignKey: 'patientId', as: 'communications' });
CommunicationLog.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

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
  InventoryItem,    
  StockTransaction,
  Supplier,
  PurchaseOrder,
  Ward,              
  Room,
  Bed,
  PatientAdmission,
  StaffSchedule,       
  Attendance,
  LeaveRequest,
  StaffPerformance,
  EmergencyCase,        // Add these
  Ambulance,
  EmergencyDispatch,
  TriageProtocol,
  DrugInventory,              // Add these
  PrescriptionFulfillment,
  DrugStockTransaction,
  InsuranceFormulary,
  AnalyticsView,
  ReportTemplate,
  ExternalIntegration,
  CommunicationLog,
  ExternalDataSync
};
