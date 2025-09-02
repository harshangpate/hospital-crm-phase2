const { validationResult } = require('express-validator');
const { EmergencyCase, Ambulance, EmergencyDispatch, TriageProtocol, Patient, Doctor, User, Bed } = require('../models');
const { Op } = require('sequelize');

// Generate unique emergency ID
const generateEmergencyId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastEmergency = await EmergencyCase.findOne({
    where: { emergencyId: { [Op.like]: `EM${today}%` } },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastEmergency ? 
    parseInt(lastEmergency.emergencyId.slice(-4)) : 0;
  return `EM${today}${String(lastId + 1).padStart(4, '0')}`;
};

// @desc    Create emergency case (triage)
// @route   POST /api/emergency/triage
// @access  Private (admin, nurse, doctor)
const createEmergencyCase = async (req, res) => {
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
      patientId, triageLevel, chiefComplaint, symptoms, vitalSigns, 
      painLevel, arrivalMethod, ambulanceId 
    } = req.body;

    // Determine triage color based on level
    const triageColorMap = {
      'critical': 'red',
      'urgent': 'orange', 
      'semi_urgent': 'yellow',
      'non_urgent': 'green',
      'deceased': 'black'
    };

    // Determine priority (1 = highest)
    const priorityMap = {
      'critical': 1,
      'urgent': 2,
      'semi_urgent': 3,
      'non_urgent': 4,
      'deceased': 5
    };

    const emergencyId = await generateEmergencyId();

    const emergencyCase = await EmergencyCase.create({
      emergencyId,
      patientId,
      triageLevel,
      triageColor: triageColorMap[triageLevel],
      priority: priorityMap[triageLevel],
      chiefComplaint,
      symptoms,
      vitalSigns,
      painLevel,
      arrivalMethod,
      ambulanceId,
      triageTime: new Date(),
      triageBy: req.user.userId,
      createdBy: req.user.userId
    });

    // Get complete emergency case with relationships
    const completeCase = await EmergencyCase.findByPk(emergencyCase.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'phone', 'dateOfBirth']
        },
        {
          model: User,
          as: 'triageNurse',
          attributes: ['firstName', 'lastName', 'role']
        },
        {
          model: Ambulance,
          as: 'ambulance',
          attributes: ['vehicleNumber', 'vehicleType'],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Emergency case created successfully',
      emergencyCase: completeCase
    });

  } catch (error) {
    console.error('Create emergency case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get emergency dashboard
// @route   GET /api/emergency/dashboard
// @access  Private (admin, nurse, doctor)
const getEmergencyDashboard = async (req, res) => {
  try {
    // Current active emergency cases
    const activeCases = await EmergencyCase.findAll({
      where: {
        status: { [Op.in]: ['arrived', 'triaged', 'in_treatment'] }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'age']
        },
        {
          model: Bed,
          as: 'bed',
          attributes: ['bedNumber'],
          required: false
        }
      ],
      order: [['priority', 'ASC'], ['arrivalTime', 'ASC']]
    });

    // Emergency stats
    const today = new Date().toISOString().slice(0, 10);
    const todayCases = await EmergencyCase.count({
      where: {
        arrivalTime: { [Op.gte]: today }
      }
    });

    const criticalCases = await EmergencyCase.count({
      where: {
        triageLevel: 'critical',
        status: { [Op.in]: ['arrived', 'triaged', 'in_treatment'] }
      }
    });

    // Available ambulances
    const availableAmbulances = await Ambulance.count({
      where: { status: 'available', isActive: true }
    });

    // Cases by triage level
    const casesByTriage = await EmergencyCase.findAll({
      attributes: [
        'triageLevel',
        [require('sequelize').fn('COUNT', require('sequelize').col('triageLevel')), 'count']
      ],
      where: {
        arrivalTime: { [Op.gte]: today }
      },
      group: ['triageLevel']
    });

    // Average wait times
    const completedCases = await EmergencyCase.findAll({
      where: {
        status: { [Op.in]: ['discharged', 'admitted'] },
        arrivalTime: { [Op.gte]: today },
        actualWaitTime: { [Op.ne]: null }
      },
      attributes: ['actualWaitTime']
    });

    const avgWaitTime = completedCases.length > 0 
      ? completedCases.reduce((sum, case1) => sum + case1.actualWaitTime, 0) / completedCases.length
      : 0;

    res.json({
      success: true,
      dashboard: {
        activeCases: {
          total: activeCases.length,
          critical: criticalCases,
          cases: activeCases
        },
        todayStats: {
          totalCases: todayCases,
          averageWaitTime: Math.round(avgWaitTime),
          availableAmbulances
        },
        triageBreakdown: casesByTriage.reduce((acc, item) => {
          acc[item.triageLevel] = parseInt(item.dataValues.count);
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get emergency dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Dispatch ambulance
// @route   POST /api/emergency/dispatch
// @access  Private (admin, dispatcher)
const dispatchAmbulance = async (req, res) => {
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
      callerPhone, incidentLocation, incidentType, priority, 
      description, ambulanceId 
    } = req.body;

    // Generate dispatch ID
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dispatchId = `DISP${today}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Check ambulance availability
    const ambulance = await Ambulance.findByPk(ambulanceId);
    if (!ambulance || ambulance.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Ambulance not available'
      });
    }

    // Create dispatch record
    const dispatch = await EmergencyDispatch.create({
      dispatchId,
      callerPhone,
      incidentLocation,
      incidentType,
      priority,
      description,
      ambulanceId,
      dispatchTime: new Date(),
      status: 'dispatched',
      dispatchedBy: req.user.userId
    });

    // Update ambulance status
    await ambulance.update({ status: 'dispatched' });

    res.status(201).json({
      success: true,
      message: 'Ambulance dispatched successfully',
      dispatch: {
        dispatchId: dispatch.dispatchId,
        ambulanceNumber: ambulance.vehicleNumber,
        priority: dispatch.priority,
        estimatedArrival: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      }
    });

  } catch (error) {
    console.error('Dispatch ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update emergency case status
// @route   PUT /api/emergency/cases/:id/status
// @access  Private (admin, nurse, doctor)
const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, bedId, assignedDoctorId, notes } = req.body;

    const emergencyCase = await EmergencyCase.findByPk(id);
    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        message: 'Emergency case not found'
      });
    }

    const updateData = { status };

    // Set timestamps based on status
    if (status === 'in_treatment' && !emergencyCase.treatmentStartTime) {
      updateData.treatmentStartTime = new Date();
      
      // Calculate wait time
      const waitTime = (new Date() - new Date(emergencyCase.arrivalTime)) / (1000 * 60);
      updateData.actualWaitTime = Math.round(waitTime);
    }

    if (status === 'discharged' || status === 'admitted') {
      updateData.dischargeTime = new Date();
    }

    if (bedId) updateData.bedId = bedId;
    if (assignedDoctorId) updateData.assignedDoctorId = assignedDoctorId;
    if (notes) updateData.treatmentNotes = notes;

    await emergencyCase.update(updateData);

    res.json({
      success: true,
      message: 'Emergency case status updated successfully',
      case: {
        emergencyId: emergencyCase.emergencyId,
        status: emergencyCase.status,
        waitTime: emergencyCase.actualWaitTime
      }
    });

  } catch (error) {
    console.error('Update case status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get emergency statistics
// @route   GET /api/emergency/stats
// @access  Private (admin)
const getEmergencyStats = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Today's emergency cases
    const todayCases = await EmergencyCase.count({
      where: { arrivalTime: { [Op.gte]: today } }
    });

    // Active cases
    const activeCases = await EmergencyCase.count({
      where: { status: { [Op.in]: ['arrived', 'triaged', 'in_treatment'] } }
    });

    // Available ambulances
    const totalAmbulances = await Ambulance.count({ where: { isActive: true } });
    const availableAmbulances = await Ambulance.count({ 
      where: { status: 'available', isActive: true } 
    });

    // Average response time (completed dispatches today)
    const completedDispatches = await EmergencyDispatch.findAll({
      where: {
        status: 'completed',
        dispatchTime: { [Op.gte]: today },
        actualResponseTime: { [Op.ne]: null }
      },
      attributes: ['actualResponseTime']
    });

    const avgResponseTime = completedDispatches.length > 0 
      ? completedDispatches.reduce((sum, dispatch) => sum + dispatch.actualResponseTime, 0) / completedDispatches.length
      : 0;

    res.json({
      success: true,
      stats: {
        todayCases,
        activeCases,
        ambulanceStatus: {
          total: totalAmbulances,
          available: availableAmbulances,
          inUse: totalAmbulances - availableAmbulances
        },
        averageResponseTime: Math.round(avgResponseTime)
      }
    });

  } catch (error) {
    console.error('Get emergency stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createEmergencyCase,
  getEmergencyDashboard,
  dispatchAmbulance,
  updateCaseStatus,
  getEmergencyStats
};
