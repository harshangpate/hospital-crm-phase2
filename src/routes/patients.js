const express = require('express');
const router = express.Router();
const {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');
const { validatePatient } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Routes
router.get('/', authorize('admin', 'doctor', 'nurse', 'receptionist'), getAllPatients);
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'receptionist'), getPatient);
router.post('/', authorize('admin', 'nurse', 'receptionist'), validatePatient, createPatient);
router.put('/:id', authorize('admin', 'nurse', 'receptionist'), validatePatient, updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);

module.exports = router;
