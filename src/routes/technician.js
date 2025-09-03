const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { LabReport, Patient, Doctor, User } = require('../models');
const { Op } = require('sequelize');

// All routes are protected and only for technicians
router.use(protect);
router.use(authorize('lab_technician'));

// @desc Get technician dashboard data
// @route GET /api/technician/dashboard
// @access Private (lab_technician)
router.get('/dashboard', async (req, res) => {
  try {
    const technicianEmail = req.user.email;
    
    // Get assigned tests count
    const assignedCount = await LabReport.count({
      where: {
        assignedTechnician: technicianEmail
      }
    });

    // Get pending tests (not completed)
    const pendingCount = await LabReport.count({
      where: {
        assignedTechnician: technicianEmail,
        status: { [Op.in]: ['sample_collected', 'in_progress'] }
      }
    });

    // Get completed tests today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = await LabReport.count({
      where: {
        assignedTechnician: technicianEmail,
        status: 'completed',
        updatedAt: {
          [Op.gte]: today
        }
      }
    });

    // Get critical/urgent tests
    const urgentCount = await LabReport.count({
      where: {
        assignedTechnician: technicianEmail,
        priority: { [Op.in]: ['urgent', 'critical'] },
        status: { [Op.in]: ['sample_collected', 'in_progress'] }
      }
    });

    // Get recent assigned tests
    const recentTests = await LabReport.findAll({
      where: {
        assignedTechnician: technicianEmail
      },
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
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      dashboard: {
        assignedCount,
        pendingCount,
        completedToday,
        urgentCount,
        recentTests
      }
    });

  } catch (error) {
    console.error('Technician dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc Get all assigned tests
// @route GET /api/technician/tests
// @access Private (lab_technician)
router.get('/tests', async (req, res) => {
  try {
    const technicianEmail = req.user.email;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const priority = req.query.priority;
    const offset = (page - 1) * limit;

    let whereCondition = {
      assignedTechnician: technicianEmail
    };

    if (status) {
      whereCondition.status = status;
    }

    if (priority) {
      whereCondition.priority = priority;
    }

    const { count, rows: tests } = await LabReport.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'phone']
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
      order: [
        ['priority', 'DESC'], // critical > urgent > normal
        ['createdAt', 'ASC']   // oldest first
      ]
    });

    res.json({
      success: true,
      tests: {
        data: tests,
        pagination: {
          page,
          pages: Math.ceil(count / limit),
          limit,
          total: count
        }
      }
    });

  } catch (error) {
    console.error('Get technician tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc Get single test details
// @route GET /api/technician/tests/:id
// @access Private (lab_technician)
router.get('/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const technicianEmail = req.user.email;

    const test = await LabReport.findOne({
      where: {
        id,
        assignedTechnician: technicianEmail
      },
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
            attributes: ['firstName', 'lastName']
          }]
        }
      ]
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or not assigned to you'
      });
    }

    res.json({
      success: true,
      test
    });

  } catch (error) {
    console.error('Get test details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc Update test status
// @route PUT /api/technician/tests/:id/status
// @access Private (lab_technician)
router.put('/tests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const technicianEmail = req.user.email;

    const test = await LabReport.findOne({
      where: {
        id,
        assignedTechnician: technicianEmail
      }
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or not assigned to you'
      });
    }

    const updateData = {
      status,
      technicianNotes: notes
    };

    // Set timestamps based on status
    if (status === 'completed') {
      updateData.reportDate = new Date();
    }

    await test.update(updateData);

    res.json({
      success: true,
      message: 'Test status updated successfully',
      test
    });

  } catch (error) {
    console.error('Update test status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc Enter/update test results
// @route PUT /api/technician/tests/:id/results
// @access Private (lab_technician)
router.put('/tests/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const { results, notes } = req.body;
    const technicianEmail = req.user.email;

    const test = await LabReport.findOne({
      where: {
        id,
        assignedTechnician: technicianEmail
      }
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or not assigned to you'
      });
    }

    await test.update({
      results,
      technicianNotes: notes,
      status: 'completed',
      reportDate: new Date()
    });

    res.json({
      success: true,
      message: 'Test results updated successfully',
      test
    });

  } catch (error) {
    console.error('Update test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
