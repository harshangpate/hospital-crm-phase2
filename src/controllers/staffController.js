const { validationResult } = require('express-validator');
const { StaffSchedule, Attendance, LeaveRequest, StaffPerformance, User, Ward } = require('../models');
const { Op } = require('sequelize');

// Generate unique schedule ID
const generateScheduleId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastSchedule = await StaffSchedule.findOne({
    where: { scheduleId: { [Op.like]: `SCH${today}%` } },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastSchedule ? 
    parseInt(lastSchedule.scheduleId.slice(-4)) : 0;
  return `SCH${today}${String(lastId + 1).padStart(4, '0')}`;
};

// @desc    Create staff schedule
// @route   POST /api/staff/schedules
// @access  Private (admin)
const createSchedule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId, shiftType, shiftDate, shiftStart, shiftEnd, department, wardId, hourlyRate, overtimeRate } = req.body;

    // Check for schedule conflicts
    const existingSchedule = await StaffSchedule.findOne({
      where: {
        userId,
        shiftDate,
        status: { [Op.in]: ['scheduled', 'confirmed'] },
        [Op.or]: [
          {
            shiftStart: { [Op.between]: [shiftStart, shiftEnd] }
          },
          {
            shiftEnd: { [Op.between]: [shiftStart, shiftEnd] }
          }
        ]
      }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Schedule conflict detected for this user at the specified time'
      });
    }

    // Calculate total hours
    const start = new Date(`1970-01-01T${shiftStart}`);
    const end = new Date(`1970-01-01T${shiftEnd}`);
    const totalHours = (end - start) / (1000 * 60 * 60);

    const scheduleId = await generateScheduleId();

    const schedule = await StaffSchedule.create({
      scheduleId,
      userId,
      shiftType,
      shiftDate,
      shiftStart,
      shiftEnd,
      department,
      wardId,
      totalHours,
      hourlyRate,
      overtimeRate,
      createdBy: req.user.userId
    });

    // Get complete schedule with relationships
    const completeSchedule = await StaffSchedule.findByPk(schedule.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'role', 'phone']
        },
        {
          model: Ward,
          as: 'ward',
          attributes: ['wardName', 'wardType'],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      schedule: completeSchedule
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get staff schedules
// @route   GET /api/staff/schedules
// @access  Private (admin, staff)
const getSchedules = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.userId;
    const department = req.query.department;
    const date = req.query.date;
    const offset = (page - 1) * limit;

    let whereCondition = {};

    if (userId) {
      whereCondition.userId = userId;
    }

    if (department) {
      whereCondition.department = department;
    }

    if (date) {
      whereCondition.shiftDate = date;
    }

    const { count, rows: schedules } = await StaffSchedule.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'role', 'phone']
        },
        {
          model: Ward,
          as: 'ward',
          attributes: ['wardName'],
          required: false
        }
      ],
      limit,
      offset,
      order: [['shiftDate', 'DESC'], ['shiftStart', 'ASC']]
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
      schedules
    });

  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Clock in/out attendance
// @route   POST /api/staff/attendance/clock
// @access  Private (staff)
const clockAttendance = async (req, res) => {
  try {
    const { action, scheduleId, location } = req.body; // action: 'in' or 'out'
    const userId = req.user.userId;
    const today = new Date().toISOString().slice(0, 10);
    const currentTime = new Date().toTimeString().slice(0, 8);

    let attendance = await Attendance.findOne({
      where: {
        userId,
        attendanceDate: today,
        scheduleId: scheduleId || null
      }
    });

    if (action === 'in') {
      if (attendance && attendance.clockInTime) {
        return res.status(400).json({
          success: false,
          message: 'Already clocked in today'
        });
      }

      const attendanceId = `ATT${today.replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

      if (!attendance) {
        attendance = await Attendance.create({
          attendanceId,
          userId,
          scheduleId,
          attendanceDate: today,
          clockInTime: currentTime,
          status: 'present',
          location
        });
      } else {
        await attendance.update({
          clockInTime: currentTime,
          status: 'present',
          location
        });
      }

      res.json({
        success: true,
        message: 'Clocked in successfully',
        attendance: {
          attendanceId: attendance.attendanceId,
          clockInTime: attendance.clockInTime,
          status: attendance.status
        }
      });

    } else if (action === 'out') {
      if (!attendance || !attendance.clockInTime) {
        return res.status(400).json({
          success: false,
          message: 'Must clock in first'
        });
      }

      if (attendance.clockOutTime) {
        return res.status(400).json({
          success: false,
          message: 'Already clocked out today'
        });
      }

      // Calculate work hours
      const clockIn = new Date(`1970-01-01T${attendance.clockInTime}`);
      const clockOut = new Date(`1970-01-01T${currentTime}`);
      const workHours = (clockOut - clockIn) / (1000 * 60 * 60);

      await attendance.update({
        clockOutTime: currentTime,
        workHours: workHours.toFixed(2),
        status: 'present'
      });

      res.json({
        success: true,
        message: 'Clocked out successfully',
        attendance: {
          attendanceId: attendance.attendanceId,
          clockOutTime: attendance.clockOutTime,
          workHours: attendance.workHours,
          status: attendance.status
        }
      });
    }

  } catch (error) {
    console.error('Clock attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get staff statistics
// @route   GET /api/staff/stats
// @access  Private (admin)
const getStaffStats = async (req, res) => {
  try {
    // Active staff count
    const totalStaff = await User.count({
      where: { isActive: true, role: { [Op.ne]: 'patient' } }
    });

    // Today's scheduled staff
    const today = new Date().toISOString().slice(0, 10);
    const todayScheduled = await StaffSchedule.count({
      where: { shiftDate: today, status: { [Op.in]: ['scheduled', 'confirmed'] } }
    });

    // Today's present staff
    const todayPresent = await Attendance.count({
      where: { 
        attendanceDate: today, 
        status: 'present',
        clockInTime: { [Op.ne]: null }
      }
    });

    // Staff by role
    const staffByRole = await User.findAll({
      attributes: [
        'role',
        [require('sequelize').fn('COUNT', require('sequelize').col('role')), 'count']
      ],
      where: { isActive: true, role: { [Op.ne]: 'patient' } },
      group: ['role']
    });

    res.json({
      success: true,
      stats: {
        totalStaff,
        todayScheduled,
        todayPresent,
        attendanceRate: todayScheduled > 0 ? ((todayPresent / todayScheduled) * 100).toFixed(1) : 0,
        staffByRole: staffByRole.reduce((acc, item) => {
          acc[item.role] = parseInt(item.dataValues.count);
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  clockAttendance,
  getStaffStats
};
