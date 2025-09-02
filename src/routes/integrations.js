const express = require('express');
const router = express.Router();
const {
  createIntegration,
  sendWhatsAppMessage,
  sendAppointmentReminder,
  syncGovernmentHealthRecords,
  getIntegrationAnalytics
} = require('../controllers/integrationController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/integrations/analytics
// @access  Admin
router.get('/analytics', authorize('admin'), getIntegrationAnalytics);

// @route   POST /api/integrations
// @access  Admin
router.post('/', authorize('admin'), createIntegration);

// @route   POST /api/integrations/whatsapp/send
// @access  Admin, Nurse, Doctor
router.post('/whatsapp/send', authorize('admin', 'nurse', 'doctor'), sendWhatsAppMessage);

// @route   POST /api/integrations/reminders/appointment
// @access  Admin, Nurse, Receptionist
router.post('/reminders/appointment', authorize('admin', 'nurse', 'receptionist'), sendAppointmentReminder);

// @route   POST /api/integrations/government/sync
// @access  Admin
router.post('/government/sync', authorize('admin'), syncGovernmentHealthRecords);

module.exports = router;
