const { body } = require('express-validator');

// Registration validation
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('role')
    .isIn(['admin', 'doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number')
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Patient validation
const validatePatient = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .notEmpty()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('dateOfBirth')
    .isDate()
    .withMessage('Please enter a valid date of birth'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  body('bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  body('pincode')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be exactly 6 digits'),
  body('emergencyContactName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name must be less than 100 characters'),
  body('emergencyContactPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid emergency contact phone number'),
  body('emergencyContactRelation')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Emergency contact relation must be less than 50 characters'),
  body('allergies')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Allergies must be less than 1000 characters'),
  body('medicalHistory')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Medical history must be less than 2000 characters'),
  body('insuranceProvider')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Insurance provider must be less than 100 characters'),
  body('insuranceNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Insurance number must be less than 50 characters')
];

// Doctor validation
const validateDoctor = [
  body('userId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('specialization')
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Specialization is required and must be less than 100 characters'),
  body('qualification')
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Qualification is required and must be less than 200 characters'),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  body('licenseNumber')
    .trim()
    .notEmpty()
    .isLength({ max: 50 })
    .withMessage('License number is required and must be less than 50 characters'),
  body('department')
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Department is required and must be less than 100 characters'),
  body('consultationFee')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Consultation fee must be a valid decimal number'),
  body('availabilityStatus')
    .optional()
    .isIn(['available', 'busy', 'on_leave', 'emergency'])
    .withMessage('Invalid availability status'),
  body('roomNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Room number must be less than 20 characters'),
  body('biography')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Biography must be less than 1000 characters')
];

// Appointment validation
const validateAppointment = [
  body('patientId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid patient ID is required'),
  body('doctorId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid doctor ID is required'),
  body('appointmentDate')
    .isDate()
    .withMessage('Valid appointment date is required'),
  body('appointmentTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid appointment time is required (HH:MM format)'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes'),
  body('appointmentType')
    .optional()
    .isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup'])
    .withMessage('Invalid appointment type'),
  body('chiefComplaint')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Chief complaint must be less than 500 characters'),
  body('symptoms')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Symptoms must be less than 1000 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Prescription validation - FIXED VERSION (removed doctorId)
const validatePrescription = [
  body('patientId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid patient ID is required'),
  // REMOVED: doctorId validation (comes from authenticated user)
  body('appointmentId')
    .optional()
    .isUUID()
    .withMessage('Valid appointment ID is required if provided'),
  body('diagnosis')
    .trim()
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Diagnosis is required and must be less than 1000 characters'),
  body('medications')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),
  body('medications.*.name')
    .trim()
    .notEmpty()
    .withMessage('Medication name is required'),
  body('medications.*.dosage')
    .trim()
    .notEmpty()
    .withMessage('Medication dosage is required'),
  body('medications.*.frequency')
    .trim()
    .notEmpty()
    .withMessage('Medication frequency is required'),
  body('medications.*.duration')
    .trim()
    .notEmpty()
    .withMessage('Medication duration is required'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Instructions must be less than 1000 characters'),
  body('followUpDate')
    .optional()
    .isDate()
    .withMessage('Valid follow-up date is required if provided')
];

// Lab Report validation
const validateLabReport = [
  body('patientId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid patient ID is required'),
  body('doctorId')
    .optional()
    .isUUID()
    .withMessage('Valid doctor ID is required if provided'),
  body('testName')
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Test name is required and must be less than 200 characters'),
  body('testType')
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Test type is required and must be less than 100 characters'),
  body('sampleCollectedAt')
    .optional()
    .isISO8601()
    .withMessage('Valid sample collection date and time is required if provided'),
  body('reportDate')
    .optional()
    .isDate()
    .withMessage('Valid report date is required if provided'),
  body('results')
    .notEmpty()
    .withMessage('Test results are required'),
  body('priority')
    .optional()
    .isIn(['normal', 'urgent', 'critical'])
    .withMessage('Invalid priority level'),
  body('technician')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Technician name must be less than 100 characters'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comments must be less than 1000 characters')
];

// Billing validation
const validateBill = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isUUID().withMessage('Valid Patient ID is required'),
  body('billType')
    .isIn(['consultation', 'procedure', 'lab_test', 'pharmacy', 'room_charges', 'emergency'])
    .withMessage('Invalid bill type'),
  body('services')
    .isArray({ min: 1 }).withMessage('At least one service is required'),
  body('services.*.name')
    .notEmpty().withMessage('Service name is required'),
  body('services.*.price')
    .isDecimal().withMessage('Service price must be a valid number'),
  body('services.*.quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('discountPercentage')
    .optional()
    .isDecimal({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
];

// Payment validation
const validatePayment = [
  body('billId')
    .notEmpty().withMessage('Bill ID is required')
    .isUUID().withMessage('Valid Bill ID is required'),
  body('amount')
    .isDecimal({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'net_banking', 'cheque', 'insurance'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .optional()
    .isLength({ max: 100 }).withMessage('Transaction ID too long')
];

// Inventory item validation
const validateInventoryItem = [
  body('itemName')
    .notEmpty().withMessage('Item name is required')
    .isLength({ max: 200 }).withMessage('Item name too long'),
  body('category')
    .isIn(['medicine', 'surgical_equipment', 'consumables', 'lab_supplies', 'office_supplies', 'medical_devices'])
    .withMessage('Invalid category'),
  body('unit')
    .isIn(['pieces', 'boxes', 'bottles', 'strips', 'kg', 'grams', 'liters', 'ml'])
    .withMessage('Invalid unit'),
  body('unitCost')
    .isDecimal({ min: 0 }).withMessage('Unit cost must be a positive number'),
  body('minimumStock')
    .isInt({ min: 0 }).withMessage('Minimum stock must be a positive integer'),
  body('reorderLevel')
    .isInt({ min: 0 }).withMessage('Reorder level must be a positive integer')
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePatient,
  validateDoctor,
  validateAppointment,
  validatePrescription,
  validateLabReport,
  validateBill,     // Add this
  validatePayment,
  validateInventoryItem
};
