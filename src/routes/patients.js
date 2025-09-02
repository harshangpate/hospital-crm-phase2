const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Import the controller functions
const { 
  createPatient, 
  getPatients, 
  getPatient, 
  updatePatient, 
  deletePatient 
} = require('../controllers/patientController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Validation middleware for patient creation
const validatePatient = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
];

// @route   GET /api/patients
// @desc    Get all patients with pagination and search
// @access  Private (admin, doctor, nurse, receptionist)
router.get('/', authorize('admin', 'doctor', 'nurse', 'receptionist'), getPatients);

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (admin, receptionist, doctor, nurse)
router.post('/', authorize('admin', 'receptionist', 'doctor', 'nurse'), validatePatient, createPatient);

// @route   GET /api/patients/:id
// @desc    Get single patient
// @access  Private (admin, doctor, nurse, receptionist)
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'receptionist'), getPatient);

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (admin, receptionist, doctor, nurse)
router.put('/:id', authorize('admin', 'receptionist', 'doctor', 'nurse'), updatePatient);

// @route   DELETE /api/patients/:id
// @desc    Delete patient (soft delete)
// @access  Private (admin only)
router.delete('/:id', authorize('admin'), deletePatient);

module.exports = router;
