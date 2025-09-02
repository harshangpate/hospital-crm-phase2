const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Ambulance } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// @route   POST /api/ambulances
// @desc    Add new ambulance
// @access  Admin only
router.post('/', [
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('vehicleType').isIn(['basic', 'advanced', 'critical_care', 'helicopter', 'motorcycle']).withMessage('Invalid vehicle type'),
  body('baseStation').notEmpty().withMessage('Base station is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const ambulance = await Ambulance.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Ambulance added successfully',
      ambulance
    });

  } catch (error) {
    console.error('Add ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/ambulances
// @desc    Get all ambulances
// @access  Admin, Emergency staff
router.get('/', authorize('admin', 'nurse', 'doctor'), async (req, res) => {
  try {
    const ambulances = await Ambulance.findAll({
      where: { isActive: true },
      order: [['vehicleNumber', 'ASC']]
    });

    res.json({
      success: true,
      count: ambulances.length,
      ambulances
    });

  } catch (error) {
    console.error('Get ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
