const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getAllPrescriptions,
  getPrescription,
  downloadPrescription
} = require('../controllers/prescriptionController');
const { validatePrescription } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/prescriptions
// @access  Doctor, Admin, Pharmacist
router.get('/', authorize('admin', 'doctor', 'pharmacist'), getAllPrescriptions);

// @route   GET /api/prescriptions/:id
// @access  Doctor, Admin, Pharmacist
router.get('/:id', authorize('admin', 'doctor', 'pharmacist'), getPrescription);

// @route   GET /api/prescriptions/:id/download
// @access  Doctor, Admin, Pharmacist, Patient (if own)
router.get('/:id/download', downloadPrescription);

// @route   POST /api/prescriptions
// @access  Doctor only
router.post('/', authorize('doctor'), validatePrescription, createPrescription);

module.exports = router;
