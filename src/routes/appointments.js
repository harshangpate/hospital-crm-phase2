const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getDoctorAvailability,
  getAppointmentStats
} = require('../controllers/appointmentController');
const { validateAppointment } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/appointments/stats
// @access  Admin, Doctor
router.get('/stats', authorize('admin', 'doctor'), getAppointmentStats);

// @route   GET /api/appointments/availability/:doctorId/:date
// @access  All authenticated users
router.get('/availability/:doctorId/:date', getDoctorAvailability);

// @route   GET /api/appointments
// @access  Admin, Doctor, Nurse, Receptionist
router.get('/', authorize('admin', 'doctor', 'nurse', 'receptionist'), getAllAppointments);

// @route   GET /api/appointments/:id
// @access  Admin, Doctor, Nurse, Receptionist
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'receptionist'), getAppointment);

// @route   POST /api/appointments
// @access  Admin, Nurse, Receptionist
router.post('/', authorize('admin', 'nurse', 'receptionist'), validateAppointment, createAppointment);

// @route   PUT /api/appointments/:id
// @access  Admin, Nurse, Receptionist
router.put('/:id', authorize('admin', 'nurse', 'receptionist'), validateAppointment, updateAppointment);

// @route   DELETE /api/appointments/:id
// @access  Admin, Receptionist
router.delete('/:id', authorize('admin', 'receptionist'), cancelAppointment);

module.exports = router;
