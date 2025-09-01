const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  doctorId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: false
  },
  experience: {
    type: DataTypes.INTEGER
  },
  licenseNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  consultationFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  availabilityStatus: {
    type: DataTypes.ENUM('available', 'busy', 'on_leave', 'emergency'),
    defaultValue: 'available'
  },
  roomNumber: {
    type: DataTypes.STRING
  },
  biography: {
    type: DataTypes.TEXT
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Doctor;
