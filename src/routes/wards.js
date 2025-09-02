const express = require('express');
const router = express.Router();
const {
  getAllWards,
  getWardBeds,
  admitPatient,
  dischargePatient,
  getWardStats,
  createWard,
  createRoom,
  createBed
} = require('../controllers/wardController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/wards/stats
// @access  Admin, Nurse
router.get('/stats', authorize('admin', 'nurse'), getWardStats);

// @route   GET /api/wards
// @access  Admin, Nurse, Doctor
router.get('/', authorize('admin', 'nurse', 'doctor'), getAllWards);

// @route   POST /api/wards
// @access  Admin
router.post('/', authorize('admin'), createWard);

// @route   POST /api/wards/rooms
// @access  Admin
router.post('/rooms', authorize('admin'), createRoom);

// @route   POST /api/wards/beds
// @access  Admin
router.post('/beds', authorize('admin'), createBed);

// @route   GET /api/wards/:wardId/beds
// @access  Admin, Nurse, Doctor
router.get('/:wardId/beds', authorize('admin', 'nurse', 'doctor'), getWardBeds);

// @route   POST /api/wards/admit
// @access  Admin, Nurse, Doctor
router.post('/admit', authorize('admin', 'nurse', 'doctor'), admitPatient);

// @route   POST /api/wards/discharge/:admissionId
// @access  Admin, Nurse, Doctor
router.post('/discharge/:admissionId', authorize('admin', 'nurse', 'doctor'), dischargePatient);

module.exports = router;
