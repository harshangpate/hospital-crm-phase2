const { validationResult } = require('express-validator');
const { Prescription, Patient, Doctor, User, Appointment } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate unique prescription ID
const generatePrescriptionId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastPrescription = await Prescription.findOne({
    where: {
      prescriptionId: { [Op.like]: `RX${today}%` }
    },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastPrescription ? 
    parseInt(lastPrescription.prescriptionId.slice(-4)) : 0;
  return `RX${today}${String(lastId + 1).padStart(4, '0')}`;
};

// Drug interaction checker (simplified)
const checkDrugInteractions = (medications) => {
  const interactions = [];
  const interactionDatabase = {
    'warfarin': ['aspirin', 'ibuprofen'],
    'aspirin': ['warfarin', 'metformin'],
    'lisinopril': ['potassium', 'spironolactone']
  };

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const drug1 = medications[i].name.toLowerCase();
      const drug2 = medications[j].name.toLowerCase();
      
      if (interactionDatabase[drug1] && interactionDatabase[drug1].includes(drug2)) {
        interactions.push({
          drug1: medications[i].name,
          drug2: medications[j].name,
          severity: 'moderate',
          description: `Potential interaction between ${medications[i].name} and ${medications[j].name}`
        });
      }
    }
  }

  return interactions;
};

// Create professional prescription PDF
const createPrescriptionPDF = async (prescription, patient, doctor) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `prescription_${prescription.prescriptionId}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(24).fillColor('#2c3e50').text('HOSPITAL CRM SYSTEM', { align: 'center' });
    doc.fontSize(12).fillColor('#7f8c8d').text('Digital Prescription', { align: 'center' });
    
    // Line separator
    doc.moveTo(50, 120).lineTo(550, 120).stroke();

    // Prescription details
    doc.fontSize(14).fillColor('#2c3e50').text(`Prescription ID: ${prescription.prescriptionId}`, 50, 140);
    doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString('en-US', {
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
      .text(`Gender: ${patient.gender}`, 50, 265);

    // Doctor Information
    doc.fontSize(16).fillColor('#34495e').text('PRESCRIBING DOCTOR', 300, 180);
    doc.fontSize(12).fillColor('#2c3e50')
      .text(`Dr. ${doctor.user.firstName} ${doctor.user.lastName}`, 300, 205)
      .text(`Specialization: ${doctor.specialization}`, 300, 225)
      .text(`License: ${doctor.licenseNumber}`, 300, 245)
      .text(`Department: ${doctor.department}`, 300, 265);

    // Diagnosis
    doc.fontSize(16).fillColor('#e74c3c').text('DIAGNOSIS', 50, 300);
    doc.fontSize(12).fillColor('#2c3e50').text(prescription.diagnosis, 50, 325, { width: 500 });

    // Medications
    doc.fontSize(16).fillColor('#27ae60').text('PRESCRIBED MEDICATIONS', 50, 370);
    let yPosition = 395;
    
    prescription.medications.forEach((med, index) => {
      doc.fontSize(12).fillColor('#2c3e50')
        .text(`${index + 1}. ${med.name}`, 50, yPosition)
        .text(`   Dosage: ${med.dosage}`, 70, yPosition + 15)
        .text(`   Frequency: ${med.frequency}`, 70, yPosition + 30)
        .text(`   Duration: ${med.duration}`, 70, yPosition + 45);
      
      if (med.instructions) {
        doc.text(`   Instructions: ${med.instructions}`, 70, yPosition + 60);
        yPosition += 95;
      } else {
        yPosition += 80;
      }
    });

    // General Instructions
    if (prescription.instructions) {
      doc.fontSize(16).fillColor('#f39c12').text('GENERAL INSTRUCTIONS', 50, yPosition + 20);
      doc.fontSize(12).fillColor('#2c3e50').text(prescription.instructions, 50, yPosition + 45, { width: 500 });
    }

    // Footer
    const footerY = doc.page.height - 100;
    doc.moveTo(50, footerY - 20).lineTo(550, footerY - 20).stroke();
    doc.fontSize(10).fillColor('#95a5a6')
      .text('This is a digitally generated prescription from Hospital CRM System', 50, footerY)
      .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 15)
      .text('For any queries, please contact the hospital directly', 50, footerY + 30);

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

// Send prescription email
const sendPrescriptionEmail = async (patient, prescription, pdfPath) => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: {
      name: 'Hospital CRM System',
      address: process.env.EMAIL_USER
    },
    to: patient.email,
    subject: `Your Prescription - ${prescription.prescriptionId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Your Digital Prescription</h2>
        <p>Dear ${patient.firstName} ${patient.lastName},</p>
        <p>Please find your prescription attached as a PDF document.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057;">Prescription Details:</h3>
          <p><strong>Prescription ID:</strong> ${prescription.prescriptionId}</p>
          <p><strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}</p>
          <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #1976d2;">Important Instructions:</h4>
          <ul>
            <li>Follow the prescribed dosage and timing strictly</li>
            <li>Complete the full course of medication unless advised otherwise</li>
            <li>Contact your doctor immediately if you experience any adverse reactions</li>
            <li>Keep this prescription for your medical records</li>
          </ul>
        </div>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          This is an automated email from Hospital CRM System. Please do not reply to this email.
          For any queries, please contact the hospital directly.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `prescription_${prescription.prescriptionId}.pdf`,
        path: pdfPath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (doctor only)
const createPrescription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Verify user is a doctor
    const doctor = await Doctor.findOne({ 
      where: { userId: req.user.userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      }]
    });

    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create prescriptions'
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

    // Check for drug interactions
    const interactions = checkDrugInteractions(req.body.medications);
    if (interactions.length > 0) {
      console.log('⚠️  Drug interactions detected:', interactions);
      // Log interactions but don't block prescription (doctor's decision)
    }

    // Generate prescription ID
    const prescriptionId = await generatePrescriptionId();

    // Create prescription
    const prescription = await Prescription.create({
      ...req.body,
      prescriptionId,
      doctorId: doctor.id
    });

    // Generate PDF
    const pdfPath = await createPrescriptionPDF(prescription, patient, doctor);
    
    // Update prescription with PDF path
    await prescription.update({ pdfPath });

    // Send email if patient has email
    if (patient.email) {
      try {
        await sendPrescriptionEmail(patient, prescription, pdfPath);
        await prescription.update({
          emailSent: true,
          emailSentAt: new Date()
        });
        console.log('✅ Prescription email sent successfully');
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    // Get complete prescription with relationships
    const completePrescription = await Prescription.findByPk(prescription.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'email']
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
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription: completePrescription,
      drugInteractions: interactions.length > 0 ? interactions : null,
      emailSent: patient.email ? prescription.emailSent : false
    });

  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private (doctor, admin, pharmacist)
const getAllPrescriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const patientId = req.query.patientId;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let whereCondition = {};

    // If user is doctor, only show their prescriptions
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId: req.user.userId } });
      if (doctor) {
        whereCondition.doctorId = doctor.id;
      }
    }

    if (patientId) {
      whereCondition.patientId = patientId;
    }

    if (status) {
      whereCondition.status = status;
    }

    const { count, rows: prescriptions } = await Prescription.findAndCountAll({
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
      prescriptions
    });

  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        },
        {
          model: Appointment,
          as: 'appointment',
          required: false
        }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Authorization check
    const isAuthorized = req.user.role === 'admin' || 
                        req.user.role === 'pharmacist' ||
                        (req.user.role === 'doctor' && prescription.doctor.userId === req.user.userId);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this prescription'
      });
    }

    res.json({
      success: true,
      prescription
    });

  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Download prescription PDF
// @route   GET /api/prescriptions/:id/download
// @access  Private
const downloadPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    if (!prescription.pdfPath || !fs.existsSync(prescription.pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }

    const fileName = `prescription_${prescription.prescriptionId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(prescription.pdfPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createPrescription,
  getAllPrescriptions,
  getPrescription,
  downloadPrescription
};
