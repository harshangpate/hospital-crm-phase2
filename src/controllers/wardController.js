const { validationResult } = require('express-validator');
const { Ward, Room, Bed, PatientAdmission, Patient, Doctor, User } = require('../models');
const { Op } = require('sequelize');

// Generate unique admission ID
const generateAdmissionId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastAdmission = await PatientAdmission.findOne({
    where: { admissionId: { [Op.like]: `ADM${today}%` } },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastAdmission ? 
    parseInt(lastAdmission.admissionId.slice(-4)) : 0;
  return `ADM${today}${String(lastId + 1).padStart(4, '0')}`;
};

// @desc    Create new ward
// @route   POST /api/wards
// @access  Private (admin)
const createWard = async (req, res) => {
  try {
    const { wardName, wardType, department, floor } = req.body;

    // Generate ward code
    const wardCode = `${wardType.toUpperCase().slice(0,3)}-${String(floor).padStart(2, '0')}-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

    const ward = await Ward.create({
      wardCode,
      wardName,
      wardType,
      department,
      floor,
      wardIncharge: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Ward created successfully',
      ward
    });

  } catch (error) {
    console.error('Create ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all wards with bed availability
// @route   GET /api/wards
// @access  Private (admin, nurse, doctor)
const getAllWards = async (req, res) => {
  try {
    const wards = await Ward.findAll({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: 'incharge',
          attributes: ['firstName', 'lastName', 'phone'],
          required: false
        }
      ],
      order: [['wardName', 'ASC']]
    });

    res.json({
      success: true,
      count: wards.length,
      wards: wards
    });

  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new room
// @route   POST /api/wards/rooms
// @access  Private (admin)
const createRoom = async (req, res) => {
  try {
    const { wardId, roomNumber, roomType, totalBeds, dailyRate, amenities } = req.body;

    const room = await Room.create({
      wardId,
      roomNumber,
      roomType,
      totalBeds,
      availableBeds: totalBeds,
      dailyRate,
      amenities
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new bed
// @route   POST /api/wards/beds
// @access  Private (admin)
const createBed = async (req, res) => {
  try {
    const { roomId, wardId, bedNumber, bedType, bedFeatures } = req.body;

    const bed = await Bed.create({
      roomId,
      wardId,
      bedNumber,
      bedType,
      bedFeatures
    });

    res.status(201).json({
      success: true,
      message: 'Bed created successfully',
      bed
    });

  } catch (error) {
    console.error('Create bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get bed availability for a specific ward
// @route   GET /api/wards/:wardId/beds
// @access  Private (admin, nurse, doctor)
const getWardBeds = async (req, res) => {
  try {
    const { wardId } = req.params;

    const ward = await Ward.findByPk(wardId, {
      include: [
        {
          model: Room,
          as: 'rooms',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: Bed,
              as: 'beds',
              where: { isActive: true },
              required: false
            }
          ]
        }
      ]
    });

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    res.json({
      success: true,
      ward
    });

  } catch (error) {
    console.error('Get ward beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admit patient to bed
// @route   POST /api/wards/admit
// @access  Private (admin, nurse, doctor)
const admitPatient = async (req, res) => {
  try {
    const { patientId, bedId, admittingDoctorId, admissionType, admissionDiagnosis } = req.body;

    // Generate admission ID
    const admissionId = await generateAdmissionId();

    // Create admission record
    const admission = await PatientAdmission.create({
      admissionId,
      patientId,
      bedId,
      admittingDoctorId,
      admissionType,
      admissionDiagnosis,
      admittedBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Patient admitted successfully',
      admission
    });

  } catch (error) {
    console.error('Admit patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Discharge patient
// @route   POST /api/wards/discharge/:admissionId
// @access  Private (admin, nurse, doctor)
const dischargePatient = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const { dischargeReason, dischargeDiagnosis } = req.body;

    const admission = await PatientAdmission.findOne({
      where: { admissionId, status: 'admitted' }
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Active admission not found'
      });
    }

    await admission.update({
      status: 'discharged',
      actualDischargeDate: new Date(),
      dischargeReason,
      dischargeDiagnosis,
      dischargedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Patient discharged successfully'
    });

  } catch (error) {
    console.error('Discharge patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ward occupancy statistics
// @route   GET /api/wards/stats
// @access  Private (admin, nurse)
const getWardStats = async (req, res) => {
  try {
    const totalWards = await Ward.count({ where: { isActive: true } });
    const totalRooms = await Room.count({ where: { isActive: true } });
    const totalBeds = await Bed.count({ where: { isActive: true } });

    res.json({
      success: true,
      stats: {
        totalWards,
        totalRooms,
        totalBeds
      }
    });

  } catch (error) {
    console.error('Get ward stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllWards,
  getWardBeds,
  admitPatient,
  dischargePatient,
  getWardStats,
  createWard,
  createRoom,
  createBed
};
