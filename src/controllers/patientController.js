const { validationResult } = require('express-validator');
const { Patient, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate unique patient ID
// Generate unique patient ID
const generatePatientId = async () => {
  try {
    const lastPatient = await Patient.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['patientId']
    });

    // If no patients exist yet, start with P000001
    if (!lastPatient || !lastPatient.patientId) {
      return 'PAT000001';
    }

    // Extract numeric part from patient ID (remove P and leading zeros)
    const numericPart = lastPatient.patientId.replace(/^P0*/, '');
    const lastNumber = parseInt(numericPart, 10);

    // If parsing fails, start from 1
    if (isNaN(lastNumber) || lastNumber < 1) {
      return 'PAT000001';
    }

    // Generate next number
    const nextNumber = lastNumber + 1;
    
    // Format with leading zeros (6 digits total)
    return `P${String(nextNumber).padStart(6, '0')}`;

  } catch (error) {
    console.error('Error generating patient ID:', error);
    // Fallback to timestamp-based ID if database query fails
    const timestamp = Date.now().toString().slice(-6);
    return `P${timestamp}`;
  }
};


// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (admin, receptionist, doctor, nurse)
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

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      city,
      state,
      pincode,
      country,
      height,
      weight,
      occupation,
      maritalStatus,
      preferredLanguage,
      notes,
      // Emergency Contact
      emergencyContact,
      // Insurance
      insurance,
      // Medical Arrays - these are now handled as JSONB
      allergies = [],
      chronicConditions = [],
      currentMedications = []
    } = req.body;

    const patientId = await generatePatientId();

    const patient = await Patient.create({
      patientId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      city,
      state,
      pincode: pincode,
      country,
      height,
      weight,
      occupation,
      maritalStatus,
      preferredLanguage,
      notes,
      
      // Emergency Contact - map from nested object to flat fields
      emergencyContactName: emergencyContact?.name,
      emergencyContactPhone: emergencyContact?.phone,
      emergencyContactRelation: emergencyContact?.relationship,
      
      // Insurance - map from nested object to flat fields
      insuranceProvider: insurance?.provider,
      insuranceNumber: insurance?.policyNumber,
      
      // Medical Information - stored as JSONB arrays
      allergies: Array.isArray(allergies) ? allergies : [],
      chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
      currentMedications: Array.isArray(currentMedications) ? currentMedications : [],
      medicalHistory: [] // Initialize as empty array
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient
    });

  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all patients with pagination and search
// @route   GET /api/patients
// @access  Private (admin, doctor, nurse, receptionist)
const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { patientId: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ],
      isActive: true
    } : { isActive: true };

    const { count, rows } = await Patient.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'patientId', 'firstName', 'lastName', 'email', 'phone',
        'dateOfBirth', 'gender', 'bloodGroup', 'city', 'state', 'createdAt'
      ]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        pages: Math.ceil(count / limit),
        limit,
        total: count
      }
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
    const patient = await Patient.findByPk(req.params.id);

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

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (admin, receptionist, doctor, nurse)
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const {
      firstName, lastName, email, phone, dateOfBirth, gender, bloodGroup,
      address, city, state, pinCode, country, height, weight, occupation,
      maritalStatus, preferredLanguage, notes, emergencyContact, insurance,
      allergies, chronicConditions, currentMedications
    } = req.body;

    await patient.update({
      firstName: firstName || patient.firstName,
      lastName: lastName || patient.lastName,
      email: email || patient.email,
      phone: phone || patient.phone,
      dateOfBirth: dateOfBirth || patient.dateOfBirth,
      gender: gender || patient.gender,
      bloodGroup: bloodGroup || patient.bloodGroup,
      address: address || patient.address,
      city: city || patient.city,
      state: state || patient.state,
      pincode: pinCode || patient.pincode,
      country: country || patient.country,
      height: height || patient.height,
      weight: weight || patient.weight,
      occupation: occupation || patient.occupation,
      maritalStatus: maritalStatus || patient.maritalStatus,
      preferredLanguage: preferredLanguage || patient.preferredLanguage,
      notes: notes || patient.notes,
      
      // Emergency Contact
      emergencyContactName: emergencyContact?.name || patient.emergencyContactName,
      emergencyContactPhone: emergencyContact?.phone || patient.emergencyContactPhone,
      emergencyContactRelation: emergencyContact?.relationship || patient.emergencyContactRelation,
      
      // Insurance
      insuranceProvider: insurance?.provider || patient.insuranceProvider,
      insuranceNumber: insurance?.policyNumber || patient.insuranceNumber,
      
      // Medical Information
      allergies: allergies !== undefined ? (Array.isArray(allergies) ? allergies : []) : patient.allergies,
      chronicConditions: chronicConditions !== undefined ? (Array.isArray(chronicConditions) ? chronicConditions : []) : patient.chronicConditions,
      currentMedications: currentMedications !== undefined ? (Array.isArray(currentMedications) ? currentMedications : []) : patient.currentMedications,
    });

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

// @desc    Delete patient (soft delete)
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

    await patient.update({ isActive: false });

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
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient
};
