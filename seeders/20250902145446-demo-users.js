'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        email: 'dr.sarah.johnson@hospital.com',
        password: hashedPassword,
        role: 'doctor',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+1-555-1001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'dr.michael.chen@hospital.com',
        password: hashedPassword,
        role: 'doctor',
        firstName: 'Michael',
        lastName: 'Chen',
        phone: '+1-555-1002',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'nurse.mary.davis@hospital.com',
        password: hashedPassword,
        role: 'nurse',
        firstName: 'Mary',
        lastName: 'Davis',
        phone: '+1-555-2001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'receptionist@hospital.com',
        password: hashedPassword,
        role: 'receptionist',
        firstName: 'Jennifer',
        lastName: 'Smith',
        phone: '+1-555-3001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
