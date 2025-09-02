const express = require('express');
const router = express.Router();
const {
  getPatientMedicalRecords,
  createMedicalRecord,
  recordVitalSigns,
  getPatientVitalSigns
} = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/medical-records/patient/:patientId
// @access  Doctor, Admin, Nurse
router.get('/patient/:patientId', 
  authorize('admin', 'doctor', 'nurse'), 
  getPatientMedicalRecords
);

// @route   POST /api/medical-records
// @access  Doctor only
router.post('/', 
  authorize('doctor'), 
  createMedicalRecord
);

// @route   POST /api/medical-records/vital-signs
// @access  Doctor, Nurse
router.post('/vital-signs', 
  authorize('doctor', 'nurse'), 
  recordVitalSigns
);

// @route   GET /api/medical-records/vital-signs/:patientId
// @access  Doctor, Nurse, Admin
router.get('/vital-signs/:patientId', 
  authorize('admin', 'doctor', 'nurse'), 
  getPatientVitalSigns
);

module.exports = router;
