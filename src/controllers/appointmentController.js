const { validationResult } = require('express-validator');
const { Appointment, Patient, Doctor, User } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Generate unique appointment ID
const generateAppointmentId = async () => {
  const today = moment().format('YYYYMMDD');
  const lastAppointment = await Appointment.findOne({
    where: {
      appointmentId: { [Op.like]: `APT${today}%` }
    },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastAppointment ? 
    parseInt(lastAppointment.appointmentId.slice(-4)) : 0;
  return `APT${today}${String(lastId + 1).padStart(4, '0')}`;
};

// Check doctor availability
const checkDoctorAvailability = async (doctorId, appointmentDate, appointmentTime, duration = 30, excludeId = null) => {
  const startTime = moment(`${appointmentDate} ${appointmentTime}`, 'YYYY-MM-DD HH:mm');
  const endTime = moment(startTime).add(duration, 'minutes');

  const whereCondition = {
    doctorId,
    appointmentDate,
    status: { [Op.notIn]: ['cancelled', 'no_show'] },
    [Op.or]: [
      {
        // Existing appointment starts before new appointment ends
        // AND existing appointment ends after new appointment starts
        [Op.and]: [
          { appointmentTime: { [Op.lt]: endTime.format('HH:mm') } },
          { appointmentTime: { [Op.gte]: startTime.format('HH:mm') } }
        ]
      }
    ]
  };

  if (excludeId) {
    whereCondition.id = { [Op.ne]: excludeId };
  }

  const conflictingAppointments = await Appointment.findAll({
    where: whereCondition,
    include: [
      {
        model: Patient,
        as: 'patient',
        attributes: ['firstName', 'lastName', 'patientId']
      }
    ]
  });

  return {
    available: conflictingAppointments.length === 0,
    conflicts: conflictingAppointments
  };
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private (admin, doctor, nurse, receptionist)
const getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const date = req.query.date;
    const doctorId = req.query.doctorId;
    const patientId = req.query.patientId;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let whereCondition = {};

    // Filter by date
    if (date) {
      whereCondition.appointmentDate = date;
    }

    // Filter by doctor (if user is doctor, only show their appointments)
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId: req.user.userId } });
      if (doctor) {
        whereCondition.doctorId = doctor.id;
      }
    } else if (doctorId) {
      whereCondition.doctorId = doctorId;
    }

    // Filter by patient
    if (patientId) {
      whereCondition.patientId = patientId;
    }

    // Filter by status
    if (status) {
      whereCondition.status = status;
    }

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'phone', 'email']
        },
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['doctorId', 'specialization', 'department'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }
          ]
        }
      ],
      limit,
      offset,
      order: [
        ['appointmentDate', 'ASC'],
        ['appointmentTime', 'ASC']
      ]
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
      appointments
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization - users can only view their own appointments
    const isAuthorized = req.user.role === 'admin' || 
                        req.user.role === 'receptionist' ||
                        (req.user.role === 'doctor' && appointment.doctor.userId === req.user.userId);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    res.json({
      success: true,
      appointment
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (admin, nurse, receptionist)
const createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { patientId, doctorId, appointmentDate, appointmentTime, duration, appointmentType, chiefComplaint, symptoms } = req.body;

    // Validate patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Validate doctor exists
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check doctor availability
    const availability = await checkDoctorAvailability(
      doctorId, 
      appointmentDate, 
      appointmentTime, 
      duration || 30
    );

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available at this time',
        conflicts: availability.conflicts.map(apt => ({
          appointmentTime: apt.appointmentTime,
          patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
          patientId: apt.patient.patientId
        }))
      });
    }

    // Validate appointment is not in the past
    const appointmentDateTime = moment(`${appointmentDate} ${appointmentTime}`, 'YYYY-MM-DD HH:mm');
    if (appointmentDateTime.isBefore(moment())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule appointment in the past'
      });
    }

    // Generate unique appointment ID
    const appointmentId = await generateAppointmentId();

    const appointment = await Appointment.create({
      appointmentId,
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      duration: duration || 30,
      appointmentType: appointmentType || 'consultation',
      chiefComplaint,
      symptoms,
      createdBy: req.user.userId
    });

    // Get appointment with full details
    const createdAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'phone', 'email']
        },
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['doctorId', 'specialization', 'department'],
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
      message: 'Appointment scheduled successfully',
      appointment: createdAppointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private (admin, nurse, receptionist)
const updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findByPk(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { doctorId, appointmentDate, appointmentTime, duration, status } = req.body;

    // If changing doctor, date, or time, check availability
    if (doctorId || appointmentDate || appointmentTime || duration) {
      const availability = await checkDoctorAvailability(
        doctorId || appointment.doctorId,
        appointmentDate || appointment.appointmentDate,
        appointmentTime || appointment.appointmentTime,
        duration || appointment.duration,
        appointment.id // Exclude current appointment
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: 'Doctor is not available at this time',
          conflicts: availability.conflicts
        });
      }
    }

    await appointment.update(req.body);

    // Get updated appointment with full details
    const updatedAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'phone', 'email']
        },
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['doctorId', 'specialization', 'department'],
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

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private (admin, receptionist, or appointment owner)
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update status to cancelled instead of deleting
    await appointment.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor availability for a specific date
// @route   GET /api/appointments/availability/:doctorId/:date
// @access  Private
const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    console.log('🔍 getDoctorAvailability called:', { doctorId, date });
    
    // Validate doctorId is a valid UUID
    if (!doctorId || doctorId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID provided'
      });
    }

    // Validate date format
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    console.log('✅ Parameters validated successfully');

    // Get all appointments for doctor on this date
    const appointments = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: date,
        status: { [Op.notIn]: ['cancelled', 'no_show'] }
      },
      attributes: ['appointmentTime', 'duration'],
      order: [['appointmentTime', 'ASC']]
    });

    console.log(`📅 Found ${appointments.length} appointments for doctor ${doctorId} on ${date}`);

    // Generate time slots (9 AM to 6 PM, 30-minute slots)
    const startTime = moment('09:00', 'HH:mm');
    const endTime = moment('18:00', 'HH:mm');
    const slotDuration = 30; // minutes
    const timeSlots = [];

    let currentTime = startTime.clone();
    while (currentTime.isBefore(endTime)) {
      const slotTime = currentTime.format('HH:mm');
      const isAvailable = !appointments.some(apt => {
        const aptStart = moment(apt.appointmentTime, 'HH:mm:ss');
        const aptEnd = moment(aptStart).add(apt.duration || 30, 'minutes');
        const slotStart = currentTime.clone();
        const slotEnd = moment(slotStart).add(slotDuration, 'minutes');

        return slotStart.isBefore(aptEnd) && slotEnd.isAfter(aptStart);
      });

      timeSlots.push({
        time: slotTime,
        available: isAvailable
      });

      currentTime.add(slotDuration, 'minutes');
    }

    console.log(`⏰ Generated ${timeSlots.length} time slots`);

    res.json({
      success: true,
      doctorId,
      date,
      timeSlots
    });

  } catch (error) {
    console.error('❌ Get doctor availability error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private (admin, doctor)
const getAppointmentStats = async (req, res) => {
  try {
    console.log('📊 getAppointmentStats called by user:', req.user.email, 'role:', req.user.role);
    
    const today = moment().format('YYYY-MM-DD');
    const thisMonth = moment().format('YYYY-MM');
    
    console.log('📅 Date calculations:', { today, thisMonth });

    // Today's appointments
    console.log('🔍 Querying today\'s appointments...');
    const todayAppointments = await Appointment.count({
      where: {
        appointmentDate: today,
        status: { [Op.notIn]: ['cancelled'] }
      }
    });
    console.log('✅ Today appointments count:', todayAppointments);

    // This month's appointments
    console.log('🔍 Querying this month\'s appointments...');
    const thisMonthAppointments = await Appointment.count({
      where: {
        appointmentDate: { [Op.like]: `${thisMonth}%` },
        status: { [Op.notIn]: ['cancelled'] }
      }
    });
    console.log('✅ This month appointments count:', thisMonthAppointments);

    // Pending appointments
    console.log('🔍 Querying pending appointments...');
    const pendingAppointments = await Appointment.count({
      where: {
        status: 'scheduled',
        appointmentDate: { [Op.gte]: today }
      }
    });
    console.log('✅ Pending appointments count:', pendingAppointments);

    // Completed appointments today
    console.log('🔍 Querying completed appointments today...');
    const completedToday = await Appointment.count({
      where: {
        appointmentDate: today,
        status: 'completed'
      }
    });
    console.log('✅ Completed today count:', completedToday);

    // Cancelled appointments today
    console.log('🔍 Querying cancelled appointments today...');
    const cancelledToday = await Appointment.count({
      where: {
        appointmentDate: today,
        status: 'cancelled'
      }
    });
    console.log('✅ Cancelled today count:', cancelledToday);

    const stats = {
      today: {
        total: todayAppointments,
        completed: completedToday,
        cancelled: cancelledToday,
        pending: todayAppointments - completedToday - cancelledToday
      },
      thisMonth: thisMonthAppointments,
      pendingAppointments
    };

    console.log('📊 Final stats:', stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Get appointment stats error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getDoctorAvailability,
  getAppointmentStats
};
