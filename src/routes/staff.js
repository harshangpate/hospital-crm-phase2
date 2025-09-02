const express = require('express');
const router = express.Router();
const {
  createSchedule,
  getSchedules,
  clockAttendance,
  getStaffStats
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/staff/stats
// @access  Admin
router.get('/stats', authorize('admin'), getStaffStats);

// @route   GET /api/staff/schedules
// @access  Admin, Staff (own schedules)
router.get('/schedules', getSchedules);

// @route   POST /api/staff/schedules
// @access  Admin
router.post('/schedules', authorize('admin'), createSchedule);

// @route   POST /api/staff/attendance/clock
// @access  All Staff
router.post('/attendance/clock', clockAttendance);

module.exports = router;
