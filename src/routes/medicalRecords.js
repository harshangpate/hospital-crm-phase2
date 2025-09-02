const express = require('express');
const router = express.Router();

const {
  getMedicalRecords,
  getMedicalRecord,          // Make sure these exist in your controller
  updateMedicalRecord,       // Make sure these exist in your controller
  getPatientMedicalRecords,
  createMedicalRecord,
  recordVitalSigns,
  getPatientVitalSigns
} = require('../controllers/medicalRecordController');

const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// IMPORTANT: Specific routes MUST come before parameterized routes
router.get('/patient/:patientId',
  authorize('admin', 'doctor', 'nurse'),
  getPatientMedicalRecords
);

router.get('/vital-signs/:patientId',
  authorize('admin', 'doctor', 'nurse'),
  getPatientVitalSigns
);

router.post('/vital-signs',
  authorize('doctor', 'nurse'),
  recordVitalSigns
);

// General routes
router.get('/:id',
  authorize('admin', 'doctor', 'nurse'),
  getMedicalRecord
);

router.put('/:id',
  authorize('doctor'),
  updateMedicalRecord
);

router.get('/',
  authorize('admin', 'doctor', 'nurse'),
  getMedicalRecords
);

router.post('/',
  authorize('doctor'),
  createMedicalRecord
);

module.exports = router;
