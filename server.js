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

// ✅ SINGLE CORS CONFIGURATION (Fixed)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',  // Your Vite frontend
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add this health check endpoint in your server.js
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is healthy'
  });
});


// Security middleware
app.use(helmet());

// ❌ REMOVE THIS DUPLICATE CORS - This was causing the conflict!
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));

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

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/patients', require('./src/routes/patients'));
app.use('/api/doctors', require('./src/routes/doctors'));
app.use('/api/appointments', require('./src/routes/appointments'));
app.use('/api/medical-records', require('./src/routes/medicalRecords'));
app.use('/api/prescriptions', require('./src/routes/prescriptions'));
app.use('/api/lab-reports', require('./src/routes/labReports'));
app.use('/api/billing', require('./src/routes/billing'));
app.use('/api/inventory', require('./src/routes/inventory'));
app.use('/api/wards', require('./src/routes/wards'));
app.use('/api/staff', require('./src/routes/staff'));
app.use('/api/emergency', require('./src/routes/emergency'));
app.use('/api/ambulances', require('./src/routes/ambulances'));
app.use('/api/pharmacy', require('./src/routes/pharmacy'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/integrations', require('./src/routes/integrations'));
app.use('/api/technician', require('./src/routes/technician'));
app.use('/api/pharmacy', require('./src/routes/pharmacy'));

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
