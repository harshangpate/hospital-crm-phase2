const express = require('express');
const router = express.Router();
const {
  getPatientFlowAnalytics,
  getFinancialAnalytics,
  getOperationalAnalytics,
  getClinicalAnalytics,
  getExecutiveSummary
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/analytics/executive-summary
// @access  Admin
router.get('/executive-summary', authorize('admin'), getExecutiveSummary);

// @route   GET /api/analytics/patient-flow
// @access  Admin, Manager
router.get('/patient-flow', authorize('admin', 'nurse', 'doctor'), getPatientFlowAnalytics);

// @route   GET /api/analytics/financials
// @access  Admin
router.get('/financials', authorize('admin'), getFinancialAnalytics);

// @route   GET /api/analytics/operations
// @access  Admin, Manager
router.get('/operations', authorize('admin', 'nurse'), getOperationalAnalytics);

// @route   GET /api/analytics/clinical
// @access  Admin, Doctor
router.get('/clinical', authorize('admin', 'doctor'), getClinicalAnalytics);

module.exports = router;
