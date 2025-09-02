const express = require('express');
const router = express.Router();
const {
  createBill,
  processPayment,
  getBillingStats,
  getAllBills,
  getBill,
  downloadBill
} = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/billing/stats
// @access  Admin, Finance
router.get('/stats', authorize('admin', 'receptionist'), getBillingStats);

// @route   GET /api/billing/bills
// @access  Admin, Receptionist, Doctor
router.get('/bills', authorize('admin', 'receptionist', 'doctor'), getAllBills);

// @route   GET /api/billing/bills/:id
// @access  Admin, Receptionist, Doctor
router.get('/bills/:id', authorize('admin', 'receptionist', 'doctor'), getBill);

// @route   POST /api/billing/bills
// @access  Admin, Receptionist
router.post('/bills', authorize('admin', 'receptionist'), createBill);

// @route   POST /api/billing/payments
// @access  Admin, Receptionist
router.post('/payments', authorize('admin', 'receptionist'), processPayment);

module.exports = router;
