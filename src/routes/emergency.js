const express = require('express');
const router = express.Router();
const {
  createEmergencyCase,
  getEmergencyDashboard,
  dispatchAmbulance,
  updateCaseStatus,
  getEmergencyStats
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/emergency/stats
// @access  Admin
router.get('/stats', authorize('admin'), getEmergencyStats);

// @route   GET /api/emergency/dashboard
// @access  Admin, Nurse, Doctor
router.get('/dashboard', authorize('admin', 'nurse', 'doctor'), getEmergencyDashboard);

// @route   POST /api/emergency/triage
// @access  Admin, Nurse, Doctor
router.post('/triage', authorize('admin', 'nurse', 'doctor'), createEmergencyCase);

// @route   POST /api/emergency/dispatch
// @access  Admin, Dispatcher (can use admin for now)
router.post('/dispatch', authorize('admin'), dispatchAmbulance);

// @route   PUT /api/emergency/cases/:id/status
// @access  Admin, Nurse, Doctor
router.put('/cases/:id/status', authorize('admin', 'nurse', 'doctor'), updateCaseStatus);

module.exports = router;
