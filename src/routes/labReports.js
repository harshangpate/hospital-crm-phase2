const express = require('express');
const router = express.Router();
const {
  createLabReport,
  getAllLabReports,
  getLabReport,
  downloadLabReport,
  getLabStats
} = require('../controllers/labReportController');
const { validateLabReport } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/lab-reports/stats
// @access  Admin, Lab Technician
router.get('/stats', authorize('admin', 'lab_technician'), getLabStats);

// @route   GET /api/lab-reports
// @access  Doctor, Admin, Lab Technician
router.get('/', authorize('admin', 'doctor', 'lab_technician'), getAllLabReports);

// @route   GET /api/lab-reports/:id
// @access  Doctor, Admin, Lab Technician
router.get('/:id', authorize('admin', 'doctor', 'lab_technician'), getLabReport);

// @route   GET /api/lab-reports/:id/download
// @access  Doctor, Admin, Lab Technician, Patient (if own)
router.get('/:id/download', downloadLabReport);

// @route   POST /api/lab-reports
// @access  Lab Technician, Doctor, Admin
router.post('/', authorize('admin', 'doctor', 'lab_technician'), validateLabReport, createLabReport);

module.exports = router;
