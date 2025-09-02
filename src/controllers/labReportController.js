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
  
  const lastId = lastReport ? 
    parseInt(lastReport.reportId.slice(-4)) : 0;
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

// Check if result is normal
const checkNormalRange = (testType, testName, value, patientGender = 'female') => {
  const testRanges = normalRanges[testType];
  if (!testRanges) return { isNormal: true, range: 'N/A' };

  // Check for gender-specific ranges
  const genderSpecificKey = `${testName}_${patientGender}`;
  const range = testRanges[genderSpecificKey] || testRanges[testName];
  
  if (!range) return { isNormal: true, range: 'N/A' };

  const numValue = parseFloat(value);
  const isNormal = numValue >= range.min && numValue <= range.max;
  
  return {
    isNormal,
    range: `${range.min}-${range.max} ${range.unit}`,
    optimal: range.optimal || `${range.min}-${range.max} ${range.unit}`,
    unit: range.unit
  };
};

// Create professional lab report PDF
const createLabReportPDF = async (labReport, patient, doctor) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `lab_report_${labReport.reportId}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(24).fillColor('#2c3e50').text('HOSPITAL CRM LABORATORY', { align: 'center' });
    doc.fontSize(12).fillColor('#7f8c8d').text('Comprehensive Lab Report', { align: 'center' });
    
    // Line separator
    doc.moveTo(50, 120).lineTo(550, 120).stroke();

    // Report details
    doc.fontSize(14).fillColor('#2c3e50').text(`Report ID: ${labReport.reportId}`, 50, 140);
    doc.text(`Report Date: ${new Date(labReport.reportDate || labReport.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 350, 140);

    // Patient Information
    doc.fontSize(16).fillColor('#34495e').text('PATIENT INFORMATION', 50, 180);
    doc.fontSize(12).fillColor('#2c3e50')
      .text(`Name: ${patient.firstName} ${patient.lastName}`, 50, 205)
      .text(`Patient ID: ${patient.patientId}`, 50, 225)
      .text(`Age: ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years`, 50, 245)
      .text(`Gender: ${patient.gender}`, 50, 265)
      .text(`DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}`, 50, 285);

    // Test Information
    doc.fontSize(16).fillColor('#e74c3c').text('TEST INFORMATION', 300, 180);
    doc.fontSize(12).fillColor('#2c3e50')
      .text(`Test Name: ${labReport.testName}`, 300, 205)
      .text(`Test Type: ${labReport.testType}`, 300, 225)
      .text(`Priority: ${labReport.priority.toUpperCase()}`, 300, 245)
      .text(`Technician: ${labReport.technician || 'N/A'}`, 300, 265);

    if (labReport.sampleCollectedAt) {
      doc.text(`Sample Collected: ${new Date(labReport.sampleCollectedAt).toLocaleDateString()}`, 300, 285);
    }

    // Results Section
    doc.fontSize(16).fillColor('#27ae60').text('TEST RESULTS', 50, 320);
    let yPosition = 345;

    if (Array.isArray(labReport.results)) {
      // Tabular results
      doc.fontSize(12).fillColor('#34495e')
        .text('Parameter', 50, yPosition)
        .text('Result', 200, yPosition)
        .text('Normal Range', 300, yPosition)
        .text('Status', 450, yPosition);
      
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      labReport.results.forEach((result) => {
        const normalCheck = checkNormalRange(labReport.testType, result.parameter, result.value, patient.gender);
        const statusColor = normalCheck.isNormal ? '#27ae60' : '#e74c3c';
        const status = normalCheck.isNormal ? 'Normal' : 'Abnormal';

        doc.fontSize(11).fillColor('#2c3e50')
          .text(result.parameter, 50, yPosition)
          .text(`${result.value} ${result.unit || ''}`, 200, yPosition)
          .text(normalCheck.range, 300, yPosition);
        
        doc.fillColor(statusColor).text(status, 450, yPosition);
        
        yPosition += 20;
      });
    } else {
      // Text-based results
      doc.fontSize(12).fillColor('#2c3e50').text(labReport.results, 50, yPosition, { width: 500 });
      yPosition += 100;
    }

    // Doctor Information
    if (doctor) {
      doc.fontSize(16).fillColor('#f39c12').text('REVIEWED BY', 50, yPosition + 20);
      doc.fontSize(12).fillColor('#2c3e50')
        .text(`Dr. ${doctor.user.firstName} ${doctor.user.lastName}`, 50, yPosition + 45)
        .text(`Specialization: ${doctor.specialization}`, 50, yPosition + 65)
        .text(`License: ${doctor.licenseNumber}`, 50, yPosition + 85);
    }

    // Comments
    if (labReport.comments) {
      const commentsY = yPosition + 120;
      doc.fontSize(16).fillColor('#9b59b6').text('COMMENTS & RECOMMENDATIONS', 50, commentsY);
      doc.fontSize(12).fillColor('#2c3e50').text(labReport.comments, 50, commentsY + 25, { width: 500 });
    }

    // Footer
    const footerY = doc.page.height - 100;
    doc.moveTo(50, footerY - 20).lineTo(550, footerY - 20).stroke();
    doc.fontSize(10).fillColor('#95a5a6')
      .text('This is a digitally generated lab report from Hospital CRM System', 50, footerY)
      .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 15)
      .text('For any queries, please contact the laboratory directly', 50, footerY + 30);

    doc.end();

    doc.on('finish', () => {
      resolve(filePath);
    });

    doc.on('error', (err) => {
      reject(err);
    });
  });
};

// Setup email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send lab report email
const sendLabReportEmail = async (patient, doctor, labReport, pdfPath) => {
  const transporter = createEmailTransporter();

  // Determine priority styling
  const priorityColor = {
    'normal': '#28a745',
    'urgent': '#ffc107', 
    'critical': '#dc3545'
  };

  const priorityBg = {
    'normal': '#d4edda',
    'urgent': '#fff3cd',
    'critical': '#f8d7da'
  };

  const mailOptions = {
    from: {
      name: 'Hospital CRM Laboratory',
      address: process.env.EMAIL_USER
    },
    to: patient.email,
    cc: doctor ? doctor.user.email : undefined,
    subject: `Lab Report Ready - ${labReport.reportId} [${labReport.priority.toUpperCase()}]`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #2c3e50; margin: 0;">🔬 Lab Report Ready</h1>
          <p style="color: #6c757d; margin: 5px 0;">Hospital CRM Laboratory Services</p>
        </div>
        
        <div style="padding: 30px; background-color: white;">
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          <p>Your laboratory test results are now available. Please find your detailed report attached as a PDF document.</p>
          
          <div style="background-color: ${priorityBg[labReport.priority]}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${priorityColor[labReport.priority]};">
            <h3 style="color: ${priorityColor[labReport.priority]}; margin: 0 0 10px 0;">
              ${labReport.priority.toUpperCase()} PRIORITY REPORT
            </h3>
            <p style="margin: 0; color: #495057;"><strong>Report ID:</strong> ${labReport.reportId}</p>
            <p style="margin: 0; color: #495057;"><strong>Test:</strong> ${labReport.testName}</p>
            <p style="margin: 0; color: #495057;"><strong>Date:</strong> ${new Date(labReport.reportDate || labReport.createdAt).toLocaleDateString()}</p>
          </div>
          
          ${labReport.priority === 'critical' ? `
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border: 2px solid #dc3545;">
            <h4 style="color: #721c24; margin: 0 0 10px 0;">⚠️ CRITICAL VALUES DETECTED</h4>
            <p style="color: #721c24; margin: 0;">Please contact your doctor immediately or visit the emergency department if you experience any concerning symptoms.</p>
          </div>
          ` : ''}
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin: 0 0 15px 0;">📋 Important Information:</h4>
            <ul style="color: #495057; margin: 0; padding-left: 20px;">
              <li>Review your results with your healthcare provider</li>
              <li>Keep this report for your medical records</li>
              <li>Follow any recommendations provided in the report</li>
              <li>Contact us if you have questions about the testing process</li>
              ${labReport.priority !== 'normal' ? '<li><strong>Schedule a follow-up appointment with your doctor</strong></li>' : ''}
            </ul>
          </div>
          
          ${doctor ? `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #495057; margin: 0 0 10px 0;">👨‍⚕️ Reviewed By:</h4>
            <p style="margin: 0; color: #6c757d;">Dr. ${doctor.user.firstName} ${doctor.user.lastName}</p>
            <p style="margin: 0; color: #6c757d;">${doctor.specialization}</p>
          </div>
          ` : ''}
        </div>
        
        <div style="background-color: #6c757d; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="color: white; margin: 0; font-size: 12px;">
            This is an automated email from Hospital CRM Laboratory Services.<br>
            For technical support or questions, please contact our laboratory directly.
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `lab_report_${labReport.reportId}.pdf`,
        path: pdfPath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Create new lab report
// @route   POST /api/lab-reports
// @access  Private (lab_technician, doctor, admin)
const createLabReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Verify patient exists
    const patient = await Patient.findByPk(req.body.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get doctor if provided
    let doctor = null;
    if (req.body.doctorId) {
      doctor = await Doctor.findByPk(req.body.doctorId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });
    }

    // Generate lab report ID
    const reportId = await generateLabReportId();

    // Add normal ranges for the test type
    const testNormalRanges = normalRanges[req.body.testType] || {};

    // Create lab report
    const labReport = await LabReport.create({
      ...req.body,
      reportId,
      normalRanges: testNormalRanges
    });

    // Generate PDF
    const pdfPath = await createLabReportPDF(labReport, patient, doctor);
    
    // Update lab report with PDF path
    await labReport.update({ pdfPath });

    // Send email if patient has email
    if (patient.email) {
      try {
        await sendLabReportEmail(patient, doctor, labReport, pdfPath);
        await labReport.update({
          emailSent: true,
          emailSentAt: new Date()
        });
        console.log('✅ Lab report email sent successfully');
        
        // Send critical value alert if needed
        if (labReport.priority === 'critical' && doctor && doctor.user.email) {
          // Send urgent notification to doctor
          const urgentMailOptions = {
            from: process.env.EMAIL_USER,
            to: doctor.user.email,
            subject: `🚨 CRITICAL LAB VALUES - ${patient.firstName} ${patient.lastName} (${labReport.reportId})`,
            html: `
              <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 5px;">
                <h2>🚨 CRITICAL LAB VALUES ALERT</h2>
                <p><strong>Patient:</strong> ${patient.firstName} ${patient.lastName} (${patient.patientId})</p>
                <p><strong>Test:</strong> ${labReport.testName}</p>
                <p><strong>Report ID:</strong> ${labReport.reportId}</p>
                <p><strong>Immediate action may be required.</strong></p>
              </div>
            `
          };
          
          const transporter = createEmailTransporter();
          await transporter.sendMail(urgentMailOptions);
          console.log('🚨 Critical value alert sent to doctor');
        }
        
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    // Get complete lab report with relationships
    const completeLabReport = await LabReport.findByPk(labReport.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'email', 'gender']
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

    res.status(201).json({
      success: true,
      message: 'Lab report created successfully',
      labReport: completeLabReport,
      emailSent: patient.email ? labReport.emailSent : false,
      criticalAlert: labReport.priority === 'critical'
    });

  } catch (error) {
    console.error('Create lab report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all lab reports
// @route   GET /api/lab-reports
// @access  Private (doctor, admin, lab_technician)
const getAllLabReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const patientId = req.query.patientId;
    const testType = req.query.testType;
    const priority = req.query.priority;
    const status = req.query.status;
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

    const { count, rows: labReports } = await LabReport.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'email', 'phone']
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
      ],
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
      labReports
    });

  } catch (error) {
    console.error('Get lab reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single lab report
// @route   GET /api/lab-reports/:id
// @access  Private
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
      labReport
    });

  } catch (error) {
    console.error('Get lab report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Download lab report PDF
// @route   GET /api/lab-reports/:id/download
// @access  Private
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

// @desc    Get lab statistics
// @route   GET /api/lab-reports/stats
// @access  Private (admin, lab_technician)
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

    // Reports by status
    const statusCounts = await LabReport.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']
      ],
      group: ['status']
    });

    // Reports by priority
    const priorityCounts = await LabReport.findAll({
      attributes: [
        'priority',
        [require('sequelize').fn('COUNT', require('sequelize').col('priority')), 'count']
      ],
      group: ['priority']
    });

    res.json({
      success: true,
      stats: {
        today: todayReports,
        thisMonth: thisMonthReports,
        criticalPending: criticalReports,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        byPriority: priorityCounts.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.dataValues.count);
          return acc;
        }, {})
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

module.exports = {
  createLabReport,
  getAllLabReports,
  getLabReport,
  downloadLabReport,
  getLabStats
};
