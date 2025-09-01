const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctor,
  createDoctor,
  updateDoctor
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/doctors
// @access  All authenticated users
router.get('/', getAllDoctors);

// @route   GET /api/doctors/:id
// @access  All authenticated users
router.get('/:id', getDoctor);

// @route   POST /api/doctors
// @access  Admin only
router.post('/', authorize('admin'), createDoctor);

// @route   PUT /api/doctors/:id
// @access  Admin or own profile
router.put('/:id', authorize('admin', 'doctor'), updateDoctor);

module.exports = router;
