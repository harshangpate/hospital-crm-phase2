const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/utils/database');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hospital CRM Backend API',
    version: '1.0.0',
    status: 'Active',
    database: 'Connected'
  });
});

// Test route to verify database models
app.get('/api/test', async (req, res) => {
  try {
    const { User, Patient, Doctor } = require('./src/models');
    
    // Count records in each table
    const userCount = await User.count();
    const patientCount = await Patient.count();
    const doctorCount = await Doctor.count();
    
    res.json({
      message: 'Database models working!',
      tables: {
        users: userCount,
        patients: patientCount,
        doctors: doctorCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database test failed',
      details: error.message 
    });
  }
});

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/patients', require('./src/routes/patients'));
app.use('/api/doctors', require('./src/routes/doctors'));
app.use('/api/appointments', require('./src/routes/appointments'));
app.use('/api/medical-records', require('./src/routes/medicalRecords'));
app.use('/api/prescriptions', require('./src/routes/prescriptions'));
app.use('/api/lab-reports', require('./src/routes/labReports'));
app.use('/api/billing', require('./src/routes/billing'));
app.use('/api/inventory', require('./src/routes/inventory'));

// Routes placeholder for future
// app.use('/api/auth', require('./src/routes/auth'));
// app.use('/api/patients', require('./src/routes/patients'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🏥 Hospital CRM Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
});
