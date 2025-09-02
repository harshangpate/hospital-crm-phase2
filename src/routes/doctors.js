const express = require('express');
const router = express.Router();
const { Doctor, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/doctors
// @desc    Get all doctors for dropdown selection
// @access  Private
const getDoctors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const doctors = await Doctor.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email'],
          where: { role: 'doctor', isActive: true }
        }
      ],
      attributes: ['id', 'specialization', 'department'],
      limit
    });

    res.json({
      success: true,
      data: doctors,
      total: doctors.length
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors'
    });
  }
};

router.get('/', authorize('admin', 'doctor', 'nurse', 'receptionist'), getDoctors);

module.exports = router;
