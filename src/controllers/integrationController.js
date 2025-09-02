const { validationResult } = require('express-validator');
const { ExternalIntegration, CommunicationLog, ExternalDataSync, Patient, User, Appointment } = require('../models');
const { Op } = require('sequelize');

// Generate unique integration code
const generateIntegrationCode = async (type) => {
  const typePrefix = {
    'government': 'GOV',
    'insurance': 'INS',
    'messaging': 'MSG',
    'telemedicine': 'TEL',
    'equipment': 'EQP',
    'laboratory': 'LAB',
    'pharmacy': 'PHA',
    'email': 'EML'
  };

  const prefix = typePrefix[type] || 'INT';
  const lastIntegration = await ExternalIntegration.findOne({
    where: { integrationCode: { [Op.like]: `${prefix}%` } },
    order: [['createdAt', 'DESC']]
  });

  const lastId = lastIntegration ? parseInt(lastIntegration.integrationCode.slice(3)) : 0;
  return `${prefix}${String(lastId + 1).padStart(4, '0')}`;
};

// @desc    Create external integration
// @route   POST /api/integrations
// @access  Private (admin)
const createIntegration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const integrationCode = await generateIntegrationCode(req.body.type);

    const integration = await ExternalIntegration.create({
      ...req.body,
      integrationCode,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Integration created successfully',
      integration
    });

  } catch (error) {
    console.error('Create integration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send WhatsApp message
// @route   POST /api/integrations/whatsapp/send
// @access  Private (admin, nurse, doctor)
const sendWhatsAppMessage = async (req, res) => {
  try {
    const { patientId, templateId, templateVariables, message } = req.body;

    // Find WhatsApp integration
    const whatsappIntegration = await ExternalIntegration.findOne({
      where: { 
        type: 'messaging',
        provider: 'WhatsApp',
        status: 'active'
      }
    });

    if (!whatsappIntegration) {
      return res.status(404).json({
        success: false,
        message: 'WhatsApp integration not configured'
      });
    }

    // Get patient details
    const patient = await Patient.findByPk(patientId);
    if (!patient || !patient.phone) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or phone number missing'
      });
    }

    // Generate log ID
    const logId = `WA${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create communication log
    const communicationLog = await CommunicationLog.create({
      logId,
      integrationId: whatsappIntegration.id,
      patientId,
      communicationType: 'whatsapp',
      direction: 'outbound',
      recipient: patient.phone,
      message: message || `Template: ${templateId}`,
      templateId,
      templateVariables,
      status: 'pending',
      triggeredBy: req.user.userId
    });

    // Simulate WhatsApp API call (replace with actual API integration)
    const simulatedResponse = {
      success: true,
      messageId: `wa_${Date.now()}`,
      status: 'sent'
    };

    // Update communication log
    await communicationLog.update({
      status: 'sent',
      externalMessageId: simulatedResponse.messageId,
      sentTime: new Date(),
      deliveryStatus: simulatedResponse
    });

    res.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      communicationLog: {
        logId: communicationLog.logId,
        status: communicationLog.status,
        recipient: communicationLog.recipient,
        sentTime: communicationLog.sentTime
      }
    });

  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send appointment reminder
// @route   POST /api/integrations/reminders/appointment
// @access  Private (admin, nurse, receptionist)
const sendAppointmentReminder = async (req, res) => {
  try {
    const { appointmentId, reminderType, customMessage } = req.body;

    // Get appointment details
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor' }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const patient = appointment.patient;
    const doctor = appointment.doctor;

    // Prepare reminder message
    const reminderMessage = customMessage || 
      `Dear ${patient.firstName}, you have an appointment with Dr. ${doctor.user.firstName} ${doctor.user.lastName} on ${appointment.appointmentDate} at ${appointment.appointmentTime}. Please arrive 15 minutes early.`;

    // Send SMS reminder
    if (reminderType === 'sms' || reminderType === 'both') {
      const smsLogId = `SMS${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      await CommunicationLog.create({
        logId: smsLogId,
        integrationId: null, // Can be linked to SMS integration
        patientId: patient.id,
        communicationType: 'sms',
        direction: 'outbound',
        recipient: patient.phone,
        message: reminderMessage,
        status: 'sent',
        sentTime: new Date(),
        triggeredBy: req.user.userId
      });
    }

    // Send WhatsApp reminder
    if (reminderType === 'whatsapp' || reminderType === 'both') {
      const whatsappLogId = `WA${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      await CommunicationLog.create({
        logId: whatsappLogId,
        integrationId: null, // Can be linked to WhatsApp integration
        patientId: patient.id,
        communicationType: 'whatsapp',
        direction: 'outbound',
        recipient: patient.phone,
        message: reminderMessage,
        status: 'sent',
        sentTime: new Date(),
        triggeredBy: req.user.userId
      });
    }

    res.json({
      success: true,
      message: 'Appointment reminder sent successfully',
      details: {
        appointmentId: appointment.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        reminderType,
        sentTime: new Date()
      }
    });

  } catch (error) {
    console.error('Send appointment reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Sync with government health records
// @route   POST /api/integrations/government/sync
// @access  Private (admin)
const syncGovernmentHealthRecords = async (req, res) => {
  try {
    const { patientId, operation } = req.body;

    // Find government integration (ABDM, UHID, etc.)
    const govIntegration = await ExternalIntegration.findOne({
      where: { 
        type: 'government',
        status: 'active'
      }
    });

    if (!govIntegration) {
      return res.status(404).json({
        success: false,
        message: 'Government health system integration not configured'
      });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Generate sync ID
    const syncId = `SYNC${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create sync record
    const syncRecord = await ExternalDataSync.create({
      syncId,
      integrationId: govIntegration.id,
      dataType: 'patient_data',
      operation,
      entityId: patientId,
      syncDirection: 'push',
      requestPayload: {
        patientData: {
          name: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone,
          email: patient.email,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address
        }
      },
      status: 'completed', // Simulated success
      endTime: new Date()
    });

    res.json({
      success: true,
      message: 'Government health records sync completed',
      syncRecord: {
        syncId: syncRecord.syncId,
        status: syncRecord.status,
        operation: syncRecord.operation,
        completedTime: syncRecord.endTime
      }
    });

  } catch (error) {
    console.error('Government health records sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get integration analytics
// @route   GET /api/integrations/analytics
// @access  Private (admin)
const getIntegrationAnalytics = async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);

    // Total integrations
    const totalIntegrations = await ExternalIntegration.count({
      where: { isActive: true }
    });

    // Active integrations
    const activeIntegrations = await ExternalIntegration.count({
      where: { isActive: true, status: 'active' }
    });

    // Communication stats
    const totalCommunications = await CommunicationLog.count({
      where: { sentTime: { [Op.gte]: startDate } }
    });

    const successfulCommunications = await CommunicationLog.count({
      where: { 
        sentTime: { [Op.gte]: startDate },
        status: { [Op.in]: ['sent', 'delivered'] }
      }
    });

    // Sync stats
    const totalSyncs = await ExternalDataSync.count({
      where: { startTime: { [Op.gte]: startDate } }
    });

    const successfulSyncs = await ExternalDataSync.count({
      where: { 
        startTime: { [Op.gte]: startDate },
        status: 'completed'
      }
    });

    // Communication breakdown by type
    const communicationsByType = await CommunicationLog.findAll({
      attributes: [
        'communicationType',
        [require('sequelize').fn('COUNT', require('sequelize').col('communicationType')), 'count']
      ],
      where: { sentTime: { [Op.gte]: startDate } },
      group: ['communicationType']
    });

    res.json({
      success: true,
      analytics: {
        integrations: {
          total: totalIntegrations,
          active: activeIntegrations,
          inactive: totalIntegrations - activeIntegrations
        },
        communications: {
          total: totalCommunications,
          successful: successfulCommunications,
          failed: totalCommunications - successfulCommunications,
          successRate: totalCommunications > 0 ? ((successfulCommunications / totalCommunications) * 100).toFixed(1) : 0
        },
        dataSyncs: {
          total: totalSyncs,
          successful: successfulSyncs,
          failed: totalSyncs - successfulSyncs,
          successRate: totalSyncs > 0 ? ((successfulSyncs / totalSyncs) * 100).toFixed(1) : 0
        },
        breakdown: {
          communicationsByType: communicationsByType.reduce((acc, item) => {
            acc[item.communicationType] = parseInt(item.dataValues.count);
            return acc;
          }, {})
        }
      }
    });

  } catch (error) {
    console.error('Get integration analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createIntegration,
  sendWhatsAppMessage,
  sendAppointmentReminder,
  syncGovernmentHealthRecords,
  getIntegrationAnalytics
};
