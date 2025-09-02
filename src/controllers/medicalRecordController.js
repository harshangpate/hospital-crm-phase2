const { validationResult } = require('express-validator');
const { MedicalRecord, VitalSigns, Patient, Doctor, User, Appointment } = require('../models');
const { Op } = require('sequelize');

// Generate unique medical record ID
const generateRecordId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastRecord = await MedicalRecord.findOne({
    where: {
      recordId: { [Op.like]: `MR${today}%` }
    },
    order: [['createdAt', 'DESC']]
  });

  const lastId = lastRecord ? parseInt(lastRecord.recordId.slice(-4)) : 0;
  return `MR${today}${String(lastId + 1).padStart(4, '0')}`;
};

// @desc Get all medical records with search and filters
// @route GET /api/medical-records
// @access Private
const getMedicalRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const recordType = req.query.recordType || '';
    const offset = (page - 1) * limit;

    let whereCondition = {};

    if (recordType) {
      whereCondition.recordType = recordType;
    }

    const includeOptions = [
      {
        model: Patient,
        as: 'patient',
        attributes: ['firstName', 'lastName', 'patientId', 'phone', 'email'],
        where: search ? {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
            { patientId: { [Op.iLike]: `%${search}%` } }
          ]
        } : undefined,
        required: search ? true : false
      },
      {
        model: Doctor,
        as: 'doctor',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }
        ]
      }
    ];

    const { count, rows: records } = await MedicalRecord.findAndCountAll({
      where: whereCondition,
      include: includeOptions,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    res.json({
      success: true,
      medicalRecords: {
        records,
        pagination: {
          page,
          pages: Math.ceil(count / limit),
          limit,
          total: count
        }
      }
    });

  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Get single medical record by ID
// @route GET /api/medical-records/:id
// @access Private (doctor, admin, nurse)
const getMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findOne({
      where: { id: id },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'phone', 'email']
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }
          ],
          attributes: ['specialization', 'department']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['appointmentId', 'appointmentDate'],
          required: false
        }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    res.json({
      success: true,
      record
    });

  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Update medical record
// @route PUT /api/medical-records/:id
// @access Private (doctor)
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a doctor
    const doctor = await Doctor.findOne({ where: { userId: req.user.userId } });
    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can update medical records'
      });
    }

    const record = await MedicalRecord.findOne({
      where: { id: id }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Extract and clean the data - handle empty appointmentId
    const {
      patientId,
      appointmentId: rawAppointmentId,
      recordType,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      differentialDiagnosis,
      treatmentPlan,
      followUpInstructions,
      doctorNotes,
      isConfidential,
      status
    } = req.body;

    // Convert empty string to null for UUID fields
    const appointmentId = rawAppointmentId && rawAppointmentId.trim() !== '' ? rawAppointmentId : null;

    await record.update({
      patientId,
      appointmentId,
      recordType,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      differentialDiagnosis,
      treatmentPlan,
      followUpInstructions,
      doctorNotes,
      isConfidential: isConfidential || false,
      status: status || 'draft'
    });

    // Get updated record with full details
    const updatedRecord = await MedicalRecord.findByPk(record.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'phone', 'email']
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }
          ],
          attributes: ['specialization', 'department']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      record: updatedRecord
    });

  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Get patient medical records timeline
// @route GET /api/medical-records/patient/:patientId
// @access Private (doctor, admin)
const getPatientMedicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const recordType = req.query.recordType;
    const offset = (page - 1) * limit;

    let whereCondition = { patientId };

    if (recordType) {
      whereCondition.recordType = recordType;
    }

    // Check if patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const { count, rows: records } = await MedicalRecord.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }
          ]
        },
        {
          model: Appointment,
          as: 'appointment',
          required: false
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Get recent vital signs
    const recentVitalSigns = await VitalSigns.findAll({
      where: { patientId },
      limit: 5,
      order: [['recordedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'recordedByUser',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        patientId: patient.patientId
      },
      medicalRecords: {
        count,
        pagination: {
          page,
          pages: Math.ceil(count / limit),
          limit,
          total: count
        },
        records
      },
      recentVitalSigns
    });

  } catch (error) {
    console.error('Get patient medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Create new medical record
// @route POST /api/medical-records
// @access Private (doctor)
const createMedicalRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if user is a doctor
    const doctor = await Doctor.findOne({ where: { userId: req.user.userId } });
    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create medical records'
      });
    }

    // Extract and clean the data - FIX THE EMPTY UUID ISSUE
    const {
      patientId,
      appointmentId: rawAppointmentId,
      recordType,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      differentialDiagnosis,
      treatmentPlan,
      followUpInstructions,
      doctorNotes,
      isConfidential,
      status
    } = req.body;

    // Convert empty string to null for UUID fields
    const appointmentId = rawAppointmentId && rawAppointmentId.trim() !== '' ? rawAppointmentId : null;

    // Generate unique record ID
    const recordId = await generateRecordId();

    const medicalRecord = await MedicalRecord.create({
      recordId,
      patientId,
      doctorId: doctor.id,
      appointmentId, // Now properly null instead of empty string
      recordType,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      differentialDiagnosis,
      treatmentPlan,
      followUpInstructions,
      doctorNotes,
      isConfidential: isConfidential || false,
      status: status || 'draft'
    });

    // Get the created record with full details
    const createdRecord = await MedicalRecord.findByPk(medicalRecord.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId']
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      medicalRecord: createdRecord
    });

  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Record vital signs
// @route POST /api/medical-records/vital-signs
// @access Private (doctor, nurse)
const recordVitalSigns = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const vitalSigns = await VitalSigns.create({
      ...req.body,
      recordedBy: req.user.userId
    });

    // Get the created vital signs with full details
    const createdVitalSigns = await VitalSigns.findByPk(vitalSigns.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId']
        },
        {
          model: User,
          as: 'recordedByUser',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Vital signs recorded successfully',
      vitalSigns: createdVitalSigns
    });

  } catch (error) {
    console.error('Record vital signs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Get patient vital signs history
// @route GET /api/medical-records/vital-signs/:patientId
// @access Private (doctor, nurse)
const getPatientVitalSigns = async (req, res) => {
  try {
    const { patientId } = req.params;
    const days = parseInt(req.query.days) || 30; // Default last 30 days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const vitalSigns = await VitalSigns.findAll({
      where: {
        patientId,
        recordedAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: User,
          as: 'recordedByUser',
          attributes: ['firstName', 'lastName', 'role']
        }
      ],
      order: [['recordedAt', 'DESC']]
    });

    // Calculate trends and statistics
    const stats = {
      totalRecords: vitalSigns.length,
      averages: {},
      trends: {}
    };

    if (vitalSigns.length > 0) {
      // Calculate averages
      const vitals = ['bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'temperature', 'respiratoryRate', 'oxygenSaturation'];
      vitals.forEach(vital => {
        const values = vitalSigns
          .map(v => v[vital])
          .filter(v => v !== null && v !== undefined);

        if (values.length > 0) {
          stats.averages[vital] = {
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
            min: Math.min(...values),
            max: Math.max(...values),
            latest: values[0]
          };
        }
      });
    }

    res.json({
      success: true,
      patientId,
      period: `Last ${days} days`,
      vitalSigns,
      statistics: stats
    });

  } catch (error) {
    console.error('Get patient vital signs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getMedicalRecords,
  getMedicalRecord,
  updateMedicalRecord,
  getPatientMedicalRecords,
  createMedicalRecord,
  recordVitalSigns,
  getPatientVitalSigns
};
