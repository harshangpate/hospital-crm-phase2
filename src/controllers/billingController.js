const { validationResult } = require('express-validator');
const { Billing, Payment, Patient, Appointment, ServiceCatalog, User } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate unique bill ID
const generateBillId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastBill = await Billing.findOne({
    where: {
      billId: { [Op.like]: `BILL${today}%` }
    },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastBill ? 
    parseInt(lastBill.billId.slice(-4)) : 0;
  return `BILL${today}${String(lastId + 1).padStart(4, '0')}`;
};

// Generate payment ID
const generatePaymentId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastPayment = await Payment.findOne({
    where: {
      paymentId: { [Op.like]: `PAY${today}%` }
    },
    order: [['createdAt', 'DESC']]
  });
  
  const lastId = lastPayment ? 
    parseInt(lastPayment.paymentId.slice(-4)) : 0;
  return `PAY${today}${String(lastId + 1).padStart(4, '0')}`;
};

// Create professional bill PDF
const createBillPDF = async (bill, patient) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `bill_${bill.billId}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(24).fillColor('#2c3e50').text('HOSPITAL CRM BILLING', { align: 'center' });
    doc.fontSize(12).fillColor('#7f8c8d').text('Professional Healthcare Billing', { align: 'center' });
    
    // Line separator
    doc.moveTo(50, 120).lineTo(550, 120).stroke();

    // Bill details
    doc.fontSize(14).fillColor('#2c3e50').text(`Bill ID: ${bill.billId}`, 50, 140);
    doc.text(`Bill Date: ${new Date(bill.billDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 350, 140);

    // Patient Information
    doc.fontSize(16).fillColor('#34495e').text('BILL TO:', 50, 180);
    doc.fontSize(12).fillColor('#2c3e50')
      .text(`${patient.firstName} ${patient.lastName}`, 50, 205)
      .text(`Patient ID: ${patient.patientId}`, 50, 225)
      .text(`Phone: ${patient.phone}`, 50, 245);

    if (patient.address) {
      doc.text(`Address: ${patient.address}`, 50, 265);
    }

    // Services Table Header
    doc.fontSize(16).fillColor('#27ae60').text('SERVICES & CHARGES', 50, 320);
    doc.fontSize(12).fillColor('#34495e')
      .text('Service', 50, 345)
      .text('Qty', 300, 345)
      .text('Rate', 350, 345)
      .text('Amount', 450, 345);
    
    let yPosition = 365;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Services List
    let totalServices = 0;
    bill.services.forEach((service) => {
      const amount = parseFloat(service.price) * parseFloat(service.quantity || 1);
      totalServices += amount;
      
      doc.fontSize(11).fillColor('#2c3e50')
        .text(service.name, 50, yPosition)
        .text(service.quantity || '1', 300, yPosition)
        .text(`₹${parseFloat(service.price).toFixed(2)}`, 350, yPosition)
        .text(`₹${amount.toFixed(2)}`, 450, yPosition);
      
      yPosition += 20;
    });

    // Totals Section
    yPosition += 20;
    doc.moveTo(300, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 15;

    doc.fontSize(12).fillColor('#2c3e50')
      .text('Subtotal:', 350, yPosition)
      .text(`₹${parseFloat(bill.subtotal).toFixed(2)}`, 450, yPosition);
    yPosition += 20;

    if (bill.discountAmount > 0) {
      doc.text(`Discount (${bill.discountPercentage}%):`, 350, yPosition)
         .text(`-₹${parseFloat(bill.discountAmount).toFixed(2)}`, 450, yPosition);
      yPosition += 20;
    }

    doc.text(`Tax (${bill.taxPercentage}%):`, 350, yPosition)
       .text(`₹${parseFloat(bill.taxAmount).toFixed(2)}`, 450, yPosition);
    yPosition += 20;

    // Total Amount
    doc.fontSize(14).fillColor('#e74c3c')
       .text('Total Amount:', 350, yPosition)
       .text(`₹${parseFloat(bill.totalAmount).toFixed(2)}`, 450, yPosition);
    yPosition += 30;

    // Payment Status
    const statusColor = bill.paymentStatus === 'paid' ? '#27ae60' : '#e74c3c';
    doc.fontSize(12).fillColor(statusColor)
       .text(`Payment Status: ${bill.paymentStatus.toUpperCase()}`, 350, yPosition);
    
    if (bill.outstandingAmount > 0) {
      yPosition += 15;
      doc.fillColor('#e74c3c')
         .text(`Outstanding: ₹${parseFloat(bill.outstandingAmount).toFixed(2)}`, 350, yPosition);
    }

    // Footer
    const footerY = doc.page.height - 100;
    doc.moveTo(50, footerY - 20).lineTo(550, footerY - 20).stroke();
    doc.fontSize(10).fillColor('#95a5a6')
      .text('Thank you for choosing Hospital CRM Healthcare Services', 50, footerY)
      .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 15)
      .text('For billing queries, please contact our finance department', 50, footerY + 30);

    doc.end();

    doc.on('finish', () => {
      resolve(filePath);
    });

    doc.on('error', (err) => {
      reject(err);
    });
  });
};

// @desc    Create new bill
// @route   POST /api/billing/bills
// @access  Private (admin, receptionist, doctor)
const createBill = async (req, res) => {
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

    // Generate bill ID
    const billId = await generateBillId();

    // Create bill
    const bill = await Billing.create({
      ...req.body,
      billId,
      createdBy: req.user.userId,
      dueDate: req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    // Generate PDF
    const pdfPath = await createBillPDF(bill, patient);
    await bill.update({ pdfPath });

    // Get complete bill with relationships
    const completeBill = await Billing.findByPk(bill.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName', 'patientId', 'email', 'phone']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      bill: completeBill
    });

  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Process payment
// @route   POST /api/billing/payments
// @access  Private (admin, receptionist)
const processPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { billId, amount, paymentMethod, transactionId, notes } = req.body;

    // Find bill
    const bill = await Billing.findByPk(billId);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if payment amount is valid
    if (amount > bill.outstandingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds outstanding balance'
      });
    }

    // Generate payment ID
    const paymentId = await generatePaymentId();

    // Create payment record
    const payment = await Payment.create({
      paymentId,
      billId: bill.id,
      patientId: bill.patientId,
      amount,
      paymentMethod,
      transactionId,
      paymentStatus: 'success',
      receivedBy: req.user.userId,
      notes
    });

    // Update bill payment status
    const newPaidAmount = parseFloat(bill.paidAmount) + parseFloat(amount);
    const newOutstanding = parseFloat(bill.totalAmount) - newPaidAmount;
    
    let paymentStatus = 'partial';
    if (newOutstanding <= 0.01) {
      paymentStatus = 'paid';
    } else if (newPaidAmount <= 0.01) {
      paymentStatus = 'unpaid';
    }

    await bill.update({
      paidAmount: newPaidAmount,
      outstandingAmount: Math.max(0, newOutstanding),
      paymentStatus
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      payment,
      bill: {
        id: bill.id,
        totalAmount: bill.totalAmount,
        paidAmount: newPaidAmount,
        outstandingAmount: Math.max(0, newOutstanding),
        paymentStatus
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get billing statistics
// @route   GET /api/billing/stats
// @access  Private (admin, finance)
const getBillingStats = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Today's revenue
    const todayRevenue = await Payment.sum('amount', {
      where: {
        paymentDate: { [Op.gte]: today },
        paymentStatus: 'success'
      }
    });

    // This month's revenue
    const monthRevenue = await Payment.sum('amount', {
      where: {
        paymentDate: { [Op.like]: `${thisMonth}%` },
        paymentStatus: 'success'
      }
    });

    // Outstanding amounts
    const totalOutstanding = await Billing.sum('outstandingAmount', {
      where: {
        paymentStatus: { [Op.in]: ['unpaid', 'partial'] }
      }
    });

    // Bills by status
    const billsStatus = await Billing.findAll({
      attributes: [
        'paymentStatus',
        [require('sequelize').fn('COUNT', require('sequelize').col('paymentStatus')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'amount']
      ],
      group: ['paymentStatus']
    });

    res.json({
      success: true,
      stats: {
        todayRevenue: todayRevenue || 0,
        monthRevenue: monthRevenue || 0,
        totalOutstanding: totalOutstanding || 0,
        billsStatus: billsStatus.reduce((acc, item) => {
          acc[item.paymentStatus] = {
            count: parseInt(item.dataValues.count),
            amount: parseFloat(item.dataValues.amount) || 0
          };
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createBill,
  processPayment,
  getBillingStats
};
