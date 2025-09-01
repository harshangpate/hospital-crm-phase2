const { validationResult } = require('express-validator');
const { Patient, Appointment, Prescription, LabReport } = require('../models');
const { Op } = require('sequelize');

// Generate unique patient ID
const generatePatientId = async () => {
  const lastPatient = await Patient.findOne({
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastPatient ? parseInt(lastPatient.patientId.replace('PAT', '')) : 0;
  return `PAT${String(lastId + 1).padStart(6, '0')}`;
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (admin, doctor, nurse, receptionist)
const getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereCondition = search ? {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { patientId: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows: patients } = await Patient.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['medicalHistory'] } // Exclude sensitive data from list
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
      patients
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private (admin, doctor, nurse, receptionist)
const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        {
          model: Appointment,
          as: 'appointments',
          limit: 5,
          order: [['appointmentDate', 'DESC']]
        },
        {
          model: Prescription,
          as: 'prescriptions',
          limit: 3,
          order: [['createdAt', 'DESC']]
        },
        {
          model: LabReport,
          as: 'labReports',
          limit: 3,
          order: [['reportDate', 'DESC']]
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      patient
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (admin, nurse, receptionist)
const createPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Generate unique patient ID
    const patientId = await generatePatientId();

    const patient = await Patient.create({
      ...req.body,
      patientId
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      patient
    });

  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (admin, nurse, receptionist)
const updatePatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    await patient.update(req.body);

    res.json({
      success: true,
      message: 'Patient updated successfully',
      patient
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (admin only)
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    await patient.destroy();

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
};
