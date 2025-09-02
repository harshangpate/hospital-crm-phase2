const express = require('express');
const router = express.Router();
const {
  addDrug,
  getAllDrugs,
  fulfillPrescription,
  getPharmacyAlerts,
  getPharmacyStats
} = require('../controllers/pharmacyController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/pharmacy/stats
// @access  Admin, Pharmacist
router.get('/stats', authorize('admin', 'pharmacist'), getPharmacyStats);

// @route   GET /api/pharmacy/alerts
// @access  Admin, Pharmacist
router.get('/alerts', authorize('admin', 'pharmacist'), getPharmacyAlerts);

// @route   GET /api/pharmacy/drugs
// @access  Admin, Pharmacist, Doctor
router.get('/drugs', authorize('admin', 'pharmacist', 'doctor'), getAllDrugs);

// @route   POST /api/pharmacy/drugs
// @access  Admin, Pharmacist
router.post('/drugs', authorize('admin', 'pharmacist'), addDrug);

// @route   POST /api/pharmacy/fulfill-prescription
// @access  Admin, Pharmacist
router.post('/fulfill-prescription', authorize('admin', 'pharmacist'), fulfillPrescription);

module.exports = router;
