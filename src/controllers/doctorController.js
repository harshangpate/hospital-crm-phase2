const { validationResult } = require('express-validator');
const { Doctor, User, Appointment } = require('../models');
const { Op } = require('sequelize');

// Generate unique doctor ID
const generateDoctorId = async () => {
  const lastDoctor = await Doctor.findOne({
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastDoctor ? parseInt(lastDoctor.doctorId.replace('DOC', '')) : 0;
  return `DOC${String(lastId + 1).padStart(4, '0')}`;
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private (all roles)
const getAllDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const specialization = req.query.specialization || '';
    const department = req.query.department || '';
    const offset = (page - 1) * limit;

    let whereCondition = {};
    let userWhereCondition = {};

    if (search) {
      userWhereCondition[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (specialization) {
      whereCondition.specialization = { [Op.iLike]: `%${specialization}%` };
    }

    if (department) {
      whereCondition.department = { [Op.iLike]: `%${department}%` };
    }

    const { count, rows: doctors } = await Doctor.findAndCountAll({
      where: whereCondition,
      include: [{
        model: User,
        as: 'user',
        where: userWhereCondition,
        attributes: ['firstName', 'lastName', 'email', 'phone', 'isActive']
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count,
      pagination: {
        page,
        pages: Math.ceil(count / limit),
        limit,
        total: count
      },
      doctors
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Private (all roles)
const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phone', 'isActive']
        },
        {
          model: Appointment,
          as: 'appointments',
          limit: 10,
          order: [['appointmentDate', 'DESC']]
        }
      ]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      doctor
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create doctor profile
// @route   POST /api/doctors
// @access  Private (admin only)
const createDoctor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.body;

    // Check if user exists and is a doctor
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'User must exist and have doctor role'
      });
    }

    // Check if doctor profile already exists
    const existingDoctor = await Doctor.findOne({ where: { userId } });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor profile already exists for this user'
      });
    }

    // Generate unique doctor ID
    const doctorId = await generateDoctorId();

    const doctor = await Doctor.create({
      ...req.body,
      doctorId
    });

    // Get doctor with user details
    const doctorWithUser = await Doctor.findByPk(doctor.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email', 'phone']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      doctor: doctorWithUser
    });

  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private (admin or own profile)
const updateDoctor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const doctor = await Doctor.findByPk(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if user can update this doctor profile
    if (req.user.role !== 'admin' && doctor.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    await doctor.update(req.body);

    // Get updated doctor with user details
    const updatedDoctor = await Doctor.findByPk(doctor.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email', 'phone']
      }]
    });

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor: updatedDoctor
    });

  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllDoctors,
  getDoctor,
  createDoctor,
  updateDoctor
};
