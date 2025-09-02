const express = require('express');
const router = express.Router();
const {
  getAllItems,
  createItem,
  updateStock,
  getLowStockItems,
  getExpiringItems,
  getInventoryStats
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/inventory/stats
// @access  Admin, Pharmacist
router.get('/stats', authorize('admin', 'pharmacist'), getInventoryStats);

// @route   GET /api/inventory/alerts/low-stock
// @access  Admin, Pharmacist
router.get('/alerts/low-stock', authorize('admin', 'pharmacist'), getLowStockItems);

// @route   GET /api/inventory/alerts/expiring
// @access  Admin, Pharmacist
router.get('/alerts/expiring', authorize('admin', 'pharmacist'), getExpiringItems);

// @route   GET /api/inventory/items
// @access  Admin, Pharmacist, Nurse
router.get('/items', authorize('admin', 'pharmacist', 'nurse'), getAllItems);

// @route   POST /api/inventory/items
// @access  Admin, Pharmacist
router.post('/items', authorize('admin', 'pharmacist'), createItem);

// @route   POST /api/inventory/stock/update
// @access  Admin, Pharmacist, Nurse
router.post('/stock/update', authorize('admin', 'pharmacist', 'nurse'), updateStock);

module.exports = router;
