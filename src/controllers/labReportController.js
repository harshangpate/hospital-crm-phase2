const { validationResult } = require('express-validator');
const { LabReport, Patient, Doctor, User } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate unique lab report ID
const generateLabReportId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastReport = await LabReport.findOne({
    where: {
      reportId: { [Op.like]: `LAB${today}%` }
    },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastReport ? parseInt(lastReport.reportId.slice(-4)) : 0;
  return `LAB${today}${String(lastId + 1).padStart(4, '0')}`;
};

// Normal ranges database for common tests
const normalRanges = {
  'Complete Blood Count': {
    'Hemoglobin': { min: 12.0, max: 15.5, unit: 'g/dL', gender: 'female' },
    'Hemoglobin_male': { min: 13.5, max: 17.5, unit: 'g/dL', gender: 'male' },
    'White Blood Cells': { min: 4500, max: 11000, unit: 'cells/μL' },
    'Platelets': { min: 150000, max: 450000, unit: 'cells/μL' },
    'Hematocrit': { min: 36, max: 44, unit: '%', gender: 'female' },
    'Hematocrit_male': { min: 41, max: 50, unit: '%', gender: 'male' }
  },
  'Lipid Profile': {
    'Total Cholesterol': { min: 0, max: 200, unit: 'mg/dL', optimal: '<200' },
    'LDL Cholesterol': { min: 0, max: 100, unit: 'mg/dL', optimal: '<100' },
    'HDL Cholesterol': { min: 40, max: 999, unit: 'mg/dL', optimal: '>40' },
    'Triglycerides': { min: 0, max: 150, unit: 'mg/dL', optimal: '<150' }
  },
  'Liver Function Test': {
    'ALT': { min: 7, max: 56, unit: 'U/L' },
    'AST': { min: 10, max: 40, unit: 'U/L' },
    'Bilirubin Total': { min: 0.3, max: 1.2, unit: 'mg/dL' },
    'Alkaline Phosphatase': { min: 44, max: 147, unit: 'U/L' }
  },
  'Kidney Function Test': {
    'Creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
    'BUN': { min: 6, max: 20, unit: 'mg/dL' },
    'Uric Acid': { min: 3.4, max: 7.0, unit: 'mg/dL' }
  },
  'Thyroid Function Test': {
    'TSH': { min: 0.27, max: 4.2, unit: 'μIU/mL' },
    'T3': { min: 80, max: 200, unit: 'ng/dL' },
    'T4': { min: 5.1, max: 14.1, unit: 'μg/dL' }
  }
};

// @desc Create new lab report
// @route POST /api/lab-reports
// @access Private (doctor)
const createLabReport = async (req, res) => {
  try {
    console.log('🔍 Creating lab report - Request body:', req.body);
    console.log('🔍 User making request:', req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if user is a doctor
    const doctor = await Doctor.findOne({ where: { userId: req.user.userId } });
    if (!doctor) {
      console.log('❌ User is not a doctor');
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create lab reports'
      });
    }

    console.log('✅ Doctor found:', doctor.id);

    // Verify patient exists
    const patient = await Patient.findByPk(req.body.patientId);
    if (!patient) {
      console.log('❌ Patient not found');
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    console.log('✅ Patient found:', patient.id);

    // Generate unique report ID
    const reportId = await generateLabReportId();
    console.log('✅ Generated report ID:', reportId);

    // Extract data from request
    const {
      patientId,
      testName,
      testType,
      priority,
      comments
    } = req.body;

    // Add normal ranges for the test type
    const testNormalRanges = normalRanges[testType] || {};

    // Create lab report
    const labReport = await LabReport.create({
      reportId,
      patientId,
      doctorId: doctor.id,
      testName,
      testType,
      priority: priority || 'normal',
      status: 'sample_collected',
      comments: comments || '',
      results: {}, // Initialize empty results
      normalRanges: testNormalRanges
    });

    console.log('✅ Lab report created:', labReport.id);

    // Get the created report with full details
    const createdReport = await LabReport.findByPk(labReport.id, {
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
          ]
        }
      ]
    });

    console.log('✅ Lab report created successfully');

    res.status(201).json({
      success: true,
      message: 'Lab report created successfully',
      labReport: createdReport
    });

  } catch (error) {
    console.error('❌ Create lab report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc Get all lab reports
// @route GET /api/lab-reports
// @access Private (doctor, admin, lab_technician)
const getAllLabReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const patientId = req.query.patientId;
    const testType = req.query.testType;
    const priority = req.query.priority;
    const status = req.query.status;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereCondition = {};

    if (patientId) {
      whereCondition.patientId = patientId;
    }

    if (testType) {
      whereCondition.testType = { [Op.iLike]: `%${testType}%` };
    }

    if (priority) {
      whereCondition.priority = priority;
    }

    if (status) {
      whereCondition.status = status;
    }

    const includeOptions = [
      {
        model: Patient,
        as: 'patient',
        attributes: ['firstName', 'lastName', 'patientId', 'email', 'phone'],
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
        required: false,
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }]
      }
    ];

    const { count, rows: labReports } = await LabReport.findAndCountAll({
      where: whereCondition,
      include: includeOptions,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    res.json({
      success: true,
      labReports: {
        reports: labReports,
        pagination: {
          page,
          pages: Math.ceil(count / limit),
          limit,
          total: count
        }
      }
    });

  } catch (error) {
    console.error('Get lab reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Get single lab report
// @route GET /api/lab-reports/:id
// @access Private
const getLabReport = async (req, res) => {
  try {
    const labReport = await LabReport.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: Doctor,
          as: 'doctor',
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    res.json({
      success: true,
      report: labReport
    });

  } catch (error) {
    console.error('Get lab report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Download lab report PDF
// @route GET /api/lab-reports/:id/download
// @access Private
const downloadLabReport = async (req, res) => {
  try {
    const labReport = await LabReport.findByPk(req.params.id);

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    if (!labReport.pdfPath || !fs.existsSync(labReport.pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }

    const fileName = `lab_report_${labReport.reportId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(labReport.pdfPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download lab report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Get lab statistics
// @route GET /api/lab-reports/stats
// @access Private (admin, lab_technician)
const getLabStats = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Today's reports
    const todayReports = await LabReport.count({
      where: {
        reportDate: today
      }
    });

    // This month's reports
    const thisMonthReports = await LabReport.count({
      where: {
        reportDate: { [Op.like]: `${thisMonth}%` }
      }
    });

    // Critical reports pending
    const criticalReports = await LabReport.count({
      where: {
        priority: 'critical',
        status: { [Op.in]: ['sample_collected', 'in_progress'] }
      }
    });

    res.json({
      success: true,
      stats: {
        today: todayReports,
        thisMonth: thisMonthReports,
        criticalPending: criticalReports
      }
    });

  } catch (error) {
    console.error('Get lab stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// 🆕 NEW: Assign test to technician
// @desc Assign lab test to technician
// @route PUT /api/lab-reports/:id/assign
// @access Private (admin only)
const assignTestToTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianEmail } = req.body;

    // Verify technician exists
    const technician = await User.findOne({
      where: {
        email: technicianEmail,
        role: 'lab_technician',
        isActive: true
      }
    });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Lab technician not found or inactive'
      });
    }

    // Update lab report
    const labReport = await LabReport.findByPk(id);
    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    await labReport.update({
      assignedTechnician: technicianEmail,
      status: 'sample_collected' // Update status when assigned
    });

    res.json({
      success: true,
      message: 'Test assigned to technician successfully',
      labReport: await LabReport.findByPk(id, {
        include: [
          {
            model: Patient,
            as: 'patient',
            attributes: ['firstName', 'lastName', 'patientId']
          },
          {
            model: Doctor,
            as: 'doctor',
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          }
        ]
      })
    });

  } catch (error) {
    console.error('Assign test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createLabReport,
  getAllLabReports,
  getLabReport,
  downloadLabReport,
  getLabStats,
  assignTestToTechnician // 🆕 Export new function
};
