const { validationResult } = require('express-validator');
const { 
  DrugInventory, 
  PrescriptionFulfillment, 
  DrugStockTransaction, 
  Prescription, 
  Patient, 
  User, 
  Doctor, 
  Supplier,
  sequelize  // ← This was missing
} = require('../models');
const { Op } = require('sequelize');

// Generate unique drug code
const generateDrugCode = async (category) => {
  const categoryPrefix = {
    'tablet': 'TAB',
    'capsule': 'CAP',
    'syrup': 'SYR',
    'injection': 'INJ',
    'ointment': 'OIN',
    'drops': 'DRP',
    'inhaler': 'INH',
    'other': 'OTH'
  };

  const prefix = categoryPrefix[category] || 'DRG';
  const lastDrug = await DrugInventory.findOne({
    where: { drugCode: { [Op.like]: `${prefix}%` } },
    order: [['createdAt', 'DESC']]
  });

  const lastId = lastDrug ? parseInt(lastDrug.drugCode.slice(3)) : 0;
  return `${prefix}${String(lastId + 1).padStart(4, '0')}`;
};

// Generate fulfillment ID
const generateFulfillmentId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastFulfillment = await PrescriptionFulfillment.findOne({
    where: { fulfillmentId: { [Op.like]: `FUL${today}%` } },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastFulfillment ? 
    parseInt(lastFulfillment.fulfillmentId.slice(-4)) : 0;
  return `FUL${today}${String(lastId + 1).padStart(4, '0')}`;
};

// @desc    Add new drug to inventory
// @route   POST /api/pharmacy/drugs
// @access  Private (admin, pharmacist)
const addDrug = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Generate drug code
    const drugCode = await generateDrugCode(req.body.category);

    const drug = await DrugInventory.create({
      ...req.body,
      drugCode,
      lastUpdatedBy: req.user.userId
    });

    const completeDrug = await DrugInventory.findByPk(drug.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['companyName', 'contactPerson']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Drug added to inventory successfully',
      drug: completeDrug
    });

  } catch (error) {
    console.error('Add drug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all drugs in inventory
// @route   GET /api/pharmacy/drugs
// @access  Private (admin, pharmacist, doctor)
const getAllDrugs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category;
    const lowStock = req.query.lowStock === 'true';
    const expiring = req.query.expiring === 'true';
    const offset = (page - 1) * limit;

    let whereCondition = { isActive: true };

    if (search) {
      whereCondition[Op.or] = [
        { drugName: { [Op.iLike]: `%${search}%` } },
        { genericName: { [Op.iLike]: `%${search}%` } },
        { drugCode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) {
      whereCondition.category = category;
    }

    if (lowStock) {
      whereCondition[Op.and] = [
        sequelize.where(
          sequelize.col('quantityInStock'),
          Op.lte,
          sequelize.col('reorderLevel')
        )
      ];
    }

    if (expiring) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      whereCondition.expiryDate = { [Op.lte]: thirtyDaysFromNow };
    }

    const { count, rows: drugs } = await DrugInventory.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['companyName', 'contactPerson', 'phone']
        }
      ],
      limit,
      offset,
      order: [['drugName', 'ASC']]
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
      drugs
    });

  } catch (error) {
    console.error('Get drugs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Fulfill prescription
// @route   POST /api/pharmacy/fulfill-prescription
// @access  Private (admin, pharmacist)
const fulfillPrescription = async (req, res) => {
  try {
    const { prescriptionId, dispensedMedications, paymentMethod, insuranceCovered } = req.body;

    // Verify prescription exists
    const prescription = await Prescription.findByPk(prescriptionId, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor' }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const stockUpdatePromises = [];
    
    for (const med of dispensedMedications) {
      const drug = await DrugInventory.findByPk(med.drugId);
      
      if (!drug) {
        return res.status(404).json({
          success: false,
          message: `Drug not found: ${med.drugId}`
        });
      }

      if (drug.quantityInStock < med.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${drug.drugName}. Available: ${drug.quantityInStock}, Required: ${med.quantity}`
        });
      }

      totalAmount += parseFloat(drug.sellingPrice) * med.quantity;

      // Update drug stock
      stockUpdatePromises.push(
        drug.update({
          quantityInStock: drug.quantityInStock - med.quantity,
          lastUpdatedBy: req.user.userId
        })
      );
    }

    // Execute all stock updates
    await Promise.all(stockUpdatePromises);

    const patientPayable = totalAmount - (insuranceCovered || 0);
    const fulfillmentId = await generateFulfillmentId();

    // Create fulfillment record
    const fulfillment = await PrescriptionFulfillment.create({
      fulfillmentId,
      prescriptionId,
      patientId: prescription.patientId,
      pharmacistId: req.user.userId,
      dispensedMedications,
      totalAmount,
      insuranceCovered: insuranceCovered || 0,
      patientPayable,
      paymentMethod,
      status: 'completed'
    });

    res.status(201).json({
      success: true,
      message: 'Prescription fulfilled successfully',
      fulfillment: {
        fulfillmentId: fulfillment.fulfillmentId,
        totalAmount: fulfillment.totalAmount,
        patientPayable: fulfillment.patientPayable,
        status: fulfillment.status
      }
    });

  } catch (error) {
    console.error('Fulfill prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pharmacy alerts
// @route   GET /api/pharmacy/alerts
// @access  Private (admin, pharmacist)
const getPharmacyAlerts = async (req, res) => {
  try {
    // Low stock drugs
    const lowStockDrugs = await DrugInventory.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          sequelize.where(
            sequelize.col('quantityInStock'),
            Op.lte,
            sequelize.col('reorderLevel')
          )
        ]
      },
      order: [['quantityInStock', 'ASC']]
    });

    // Expiring drugs (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringDrugs = await DrugInventory.findAll({
      where: {
        isActive: true,
        expiryDate: { [Op.lte]: thirtyDaysFromNow },
        quantityInStock: { [Op.gt]: 0 }
      },
      order: [['expiryDate', 'ASC']]
    });

    // Out of stock drugs
    const outOfStockDrugs = await DrugInventory.findAll({
      where: {
        isActive: true,
        quantityInStock: 0
      }
    });

    res.json({
      success: true,
      alerts: {
        lowStock: {
          count: lowStockDrugs.length,
          drugs: lowStockDrugs
        },
        expiring: {
          count: expiringDrugs.length,
          drugs: expiringDrugs
        },
        outOfStock: {
          count: outOfStockDrugs.length,
          drugs: outOfStockDrugs
        }
      }
    });

  } catch (error) {
    console.error('Get pharmacy alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pharmacy statistics
// @route   GET /api/pharmacy/stats
// @access  Private (admin, pharmacist)
const getPharmacyStats = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Total drugs in inventory
    const totalDrugs = await DrugInventory.count({ where: { isActive: true } });

    // Today's fulfillments
    const todayFulfillments = await PrescriptionFulfillment.count({
      where: {
        dispensedDate: { [Op.gte]: today },
        status: 'completed'
      }
    });

    // Today's revenue
    const todayRevenue = await PrescriptionFulfillment.sum('totalAmount', {
      where: {
        dispensedDate: { [Op.gte]: today },
        status: 'completed'
      }
    });

    // Low stock alerts count
    const lowStockCount = await DrugInventory.count({
      where: {
        isActive: true,
        [Op.and]: [
          sequelize.where(
            sequelize.col('quantityInStock'),
            Op.lte,
            sequelize.col('reorderLevel')
          )
        ]
      }
    });

    res.json({
      success: true,
      stats: {
        totalDrugs,
        todayFulfillments,
        todayRevenue: todayRevenue || 0,
        lowStockAlerts: lowStockCount
      }
    });

  } catch (error) {
    console.error('Get pharmacy stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  addDrug,
  getAllDrugs,
  fulfillPrescription,
  getPharmacyAlerts,
  getPharmacyStats
};
