const { validationResult } = require('express-validator');
const { 
  Patient, PatientAdmission, Appointment, Billing, LabReport, 
  Prescription, StaffSchedule, DrugInventory, Ward, Bed, 
  EmergencyCase, User, sequelize 
} = require('../models');
const { Op } = require('sequelize');

// @desc    Get patient flow analytics
// @route   GET /api/analytics/patient-flow
// @access  Private (admin, manager)
const getPatientFlowAnalytics = async (req, res) => {
  try {
    const { dateRange = '30', startDate, endDate } = req.query;
    
    // Calculate date range
    const endDateCalc = endDate ? new Date(endDate) : new Date();
    const startDateCalc = startDate ? new Date(startDate) : new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);

    // Total patients registered
    const totalPatients = await Patient.count({
      where: {
        createdAt: { [Op.between]: [startDateCalc, endDateCalc] }
      }
    });

    // Total admissions
    const totalAdmissions = await PatientAdmission.count({
      where: {
        admissionDate: { [Op.between]: [startDateCalc, endDateCalc] }
      }
    });

    // Total discharges
    const totalDischarges = await PatientAdmission.count({
      where: {
        actualDischargeDate: { [Op.between]: [startDateCalc, endDateCalc] },
        status: 'discharged'
      }
    });

    // Average Length of Stay
    const losData = await PatientAdmission.findAll({
      attributes: [
        [sequelize.fn('AVG', 
          sequelize.literal(`EXTRACT(DAY FROM ("actualDischargeDate" - "admissionDate"))`)
        ), 'avgLOS']
      ],
      where: {
        actualDischargeDate: { [Op.between]: [startDateCalc, endDateCalc] },
        status: 'discharged'
      }
    });

    const avgLengthOfStay = losData[0]?.dataValues?.avgLOS || 0;

    // Readmission Rate (within 30 days)
    const readmissions = await sequelize.query(`
      SELECT COUNT(*) as readmissions
      FROM "PatientAdmissions" pa1
      WHERE EXISTS (
        SELECT 1 FROM "PatientAdmissions" pa2 
        WHERE pa1."patientId" = pa2."patientId" 
        AND pa2."admissionDate" BETWEEN pa1."actualDischargeDate" 
        AND pa1."actualDischargeDate" + INTERVAL '30 days'
        AND pa1.id != pa2.id
      )
      AND pa1."actualDischargeDate" BETWEEN :startDate AND :endDate
    `, {
      replacements: { startDate: startDateCalc, endDate: endDateCalc },
      type: sequelize.QueryTypes.SELECT
    });

    const readmissionRate = totalDischarges > 0 
      ? ((readmissions[0]?.readmissions || 0) / totalDischarges * 100).toFixed(2)
      : 0;

    // Daily patient flow trends
    const dailyTrends = await sequelize.query(`
      SELECT 
        DATE("admissionDate") as date,
        COUNT(*) as admissions
      FROM "PatientAdmissions"
      WHERE "admissionDate" BETWEEN :startDate AND :endDate
      GROUP BY DATE("admissionDate")
      ORDER BY date
    `, {
      replacements: { startDate: startDateCalc, endDate: endDateCalc },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalPatients,
          totalAdmissions,
          totalDischarges,
          avgLengthOfStay: parseFloat(avgLengthOfStay).toFixed(1),
          readmissionRate,
          occupancyRate: totalAdmissions > 0 ? ((totalAdmissions - totalDischarges) / totalAdmissions * 100).toFixed(1) : 0
        },
        trends: {
          dailyAdmissions: dailyTrends
        },
        dateRange: { startDate: startDateCalc, endDate: endDateCalc }
      }
    });

  } catch (error) {
    console.error('Get patient flow analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get financial analytics
// @route   GET /api/analytics/financials
// @access  Private (admin, manager)
const getFinancialAnalytics = async (req, res) => {
  try {
    const { dateRange = '30', startDate, endDate } = req.query;
    
    const endDateCalc = endDate ? new Date(endDate) : new Date();
    const startDateCalc = startDate ? new Date(startDate) : new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);

    // Total Revenue
    const totalRevenue = await Billing.sum('totalAmount', {
      where: {
        billDate: { [Op.between]: [startDateCalc, endDateCalc] },
        paymentStatus: { [Op.in]: ['paid', 'partial'] }
      }
    });

    // Outstanding Amount
    const outstandingAmount = await Billing.sum('outstandingAmount', {
      where: {
        billDate: { [Op.between]: [startDateCalc, endDateCalc] },
        paymentStatus: { [Op.in]: ['unpaid', 'partial'] }
      }
    });

    // Revenue by Service Type
    const revenueByService = await sequelize.query(`
      SELECT 
        "billType",
        SUM("totalAmount") as revenue,
        COUNT(*) as count
      FROM "Billings"
      WHERE "billDate" BETWEEN :startDate AND :endDate
        AND "paymentStatus" IN ('paid', 'partial')
      GROUP BY "billType"
      ORDER BY revenue DESC
    `, {
      replacements: { startDate: startDateCalc, endDate: endDateCalc },
      type: sequelize.QueryTypes.SELECT
    });

    // Monthly Revenue Trend
    const monthlyRevenue = await sequelize.query(`
      SELECT 
        DATE_TRUNC('month', "billDate") as month,
        SUM("totalAmount") as revenue
      FROM "Billings"
      WHERE "billDate" BETWEEN :startDate AND :endDate
        AND "paymentStatus" IN ('paid', 'partial')
      GROUP BY DATE_TRUNC('month', "billDate")
      ORDER BY month
    `, {
      replacements: { startDate: startDateCalc, endDate: endDateCalc },
      type: sequelize.QueryTypes.SELECT
    });

    // Average Revenue per Patient
    const avgRevenuePerPatient = await sequelize.query(`
      SELECT AVG("totalAmount") as avgRevenue
      FROM "Billings"
      WHERE "billDate" BETWEEN :startDate AND :endDate
        AND "paymentStatus" IN ('paid', 'partial')
    `, {
      replacements: { startDate: startDateCalc, endDate: endDateCalc },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRevenue || 0,
          outstandingAmount: outstandingAmount || 0,
          collectionRate: totalRevenue > 0 ? ((totalRevenue / (totalRevenue + outstandingAmount)) * 100).toFixed(1) : 0,
          avgRevenuePerPatient: parseFloat(avgRevenuePerPatient[0]?.avgRevenue || 0).toFixed(2)
        },
        breakdown: {
          revenueByService: revenueByService.map(item => ({
            service: item.billType,
            revenue: parseFloat(item.revenue),
            count: parseInt(item.count)
          }))
        },
        trends: {
          monthlyRevenue: monthlyRevenue.map(item => ({
            month: item.month,
            revenue: parseFloat(item.revenue)
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get operational analytics
// @route   GET /api/analytics/operations
// @access  Private (admin, manager)
const getOperationalAnalytics = async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Bed Occupancy Rate
    const totalBeds = await Bed.count({ where: { isActive: true } });
    const occupiedBeds = await Bed.count({ 
      where: { isActive: true, status: 'occupied' } 
    });
    const bedOccupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

    // Staff Utilization
    const totalStaff = await User.count({ 
      where: { isActive: true, role: { [Op.ne]: 'patient' } } 
    });
    
    const activeSchedules = await StaffSchedule.count({
      where: {
        shiftDate: { [Op.between]: [startDate, endDate] },
        status: { [Op.in]: ['scheduled', 'confirmed'] }
      }
    });

    // Average Wait Time for Appointments
    const avgWaitTime = await sequelize.query(`
  SELECT AVG(EXTRACT(EPOCH FROM ("appointmentTime"::timestamp - "createdAt"::timestamp))/60) as avgWaitMinutes
  FROM "Appointments"
  WHERE "appointmentDate" BETWEEN :startDate AND :endDate
    AND status = 'completed'
`, {
  replacements: { startDate, endDate },
  type: sequelize.QueryTypes.SELECT
});
    // Equipment/Resource Utilization
    const totalRooms = await Ward.sum('totalBeds', { where: { isActive: true } });
    const utilizationRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

    // Emergency Response Metrics
    const emergencyCases = await EmergencyCase.count({
      where: {
        arrivalTime: { [Op.between]: [startDate, endDate] }
      }
    });

    const avgEmergencyWaitTime = await EmergencyCase.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('actualWaitTime')), 'avgWait']
      ],
      where: {
        arrivalTime: { [Op.between]: [startDate, endDate] },
        actualWaitTime: { [Op.ne]: null }
      }
    });

    res.json({
      success: true,
      data: {
        facilityUtilization: {
          bedOccupancyRate,
          totalBeds,
          occupiedBeds,
          availableBeds: totalBeds - occupiedBeds
        },
        staffMetrics: {
          totalStaff,
          activeSchedules,
          utilizationRate: totalStaff > 0 ? ((activeSchedules / totalStaff) * 100).toFixed(1) : 0
        },
        serviceMetrics: {
          avgAppointmentWait: parseFloat(avgWaitTime[0]?.avgWaitMinutes || 0).toFixed(1),
          emergencyCases,
          avgEmergencyWait: parseFloat(avgEmergencyWaitTime[0]?.dataValues?.avgWait || 0).toFixed(1)
        }
      }
    });

  } catch (error) {
    console.error('Get operational analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get clinical analytics
// @route   GET /api/analytics/clinical
// @access  Private (admin, doctor)
const getClinicalAnalytics = async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Lab Test Completion Rate
    const totalLabTests = await LabReport.count({
  where: {
    createdAt: { [Op.gte]: startDate }
  }
})

    const completedLabTests = await LabReport.count({
  where: {
    createdAt: { [Op.between]: [startDate, endDate] }, // Changed from requestedDate
    status: 'completed'
  }
});

    const labCompletionRate = totalLabTests > 0 ? ((completedLabTests / totalLabTests) * 100).toFixed(1) : 0;

    // Critical Lab Results
    const criticalResults = await LabReport.count({
  where: {
    completedDate: { [Op.between]: [startDate, endDate] },
    priority: 'urgent'
  }
});

    // Prescription Fulfillment Rate
    const totalPrescriptions = await Prescription.count({
      where: {
        prescriptionDate: { [Op.between]: [startDate, endDate] }
      }
    });

    // Most Common Diagnoses
    const commonDiagnoses = await sequelize.query(`
      SELECT 
        "admissionDiagnosis" as diagnosis,
        COUNT(*) as frequency
      FROM "PatientAdmissions"
      WHERE "admissionDate" BETWEEN :startDate AND :endDate
        AND "admissionDiagnosis" IS NOT NULL
      GROUP BY "admissionDiagnosis"
      ORDER BY frequency DESC
      LIMIT 10
    `, {
      replacements: { startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        labMetrics: {
          totalTests: totalLabTests,
          completedTests: completedLabTests,
          completionRate: labCompletionRate,
          criticalResults
        },
        prescriptionMetrics: {
          totalPrescriptions,
          // Add fulfillment rate when pharmacy data is available
        },
        diagnostics: {
          commonDiagnoses: commonDiagnoses.map(item => ({
            diagnosis: item.diagnosis,
            frequency: parseInt(item.frequency)
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get clinical analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get executive dashboard summary
// @route   GET /api/analytics/executive-summary
// @access  Private (admin)
const getExecutiveSummary = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Key Performance Indicators
    const totalPatients = await Patient.count();
    const totalRevenue = await Billing.sum('totalAmount', {
      where: { paymentStatus: { [Op.in]: ['paid', 'partial'] } }
    });
    const totalStaff = await User.count({ 
      where: { isActive: true, role: { [Op.ne]: 'patient' } } 
    });
    
    // Monthly Growth
    const currentMonthRevenue = await Billing.sum('totalAmount', {
      where: {
        billDate: { [Op.gte]: new Date(today.getFullYear(), today.getMonth(), 1) },
        paymentStatus: { [Op.in]: ['paid', 'partial'] }
      }
    });

    const lastMonthRevenue = await Billing.sum('totalAmount', {
      where: {
        billDate: { 
          [Op.between]: [
            new Date(today.getFullYear(), today.getMonth() - 1, 1),
            new Date(today.getFullYear(), today.getMonth(), 0)
          ]
        },
        paymentStatus: { [Op.in]: ['paid', 'partial'] }
      }
    });

    const revenueGrowth = lastMonthRevenue > 0 
      ? (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : 0;

    // Current Status
    const currentOccupancy = await Bed.count({ 
      where: { isActive: true, status: 'occupied' } 
    });
    const totalBeds = await Bed.count({ where: { isActive: true } });
    const occupancyRate = totalBeds > 0 ? ((currentOccupancy / totalBeds) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        kpis: {
          totalPatients,
          totalRevenue: totalRevenue || 0,
          totalStaff,
          occupancyRate,
          revenueGrowth
        },
        alerts: {
          lowStock: 0, // Can be calculated from inventory
          criticalPatients: 0, // Can be calculated from emergency cases
          pendingDischarges: 0 // Can be calculated from admissions
        },
        quickStats: {
          todayAppointments: 0, // Today's appointments
          pendingLabResults: 0, // Pending lab tests
          emergencyCases: 0 // Active emergency cases
        }
      }
    });

  } catch (error) {
    console.error('Get executive summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getPatientFlowAnalytics,
  getFinancialAnalytics,
  getOperationalAnalytics,
  getClinicalAnalytics,
  getExecutiveSummary
};
