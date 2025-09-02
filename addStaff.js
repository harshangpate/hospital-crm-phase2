const axios = require('axios');

const staffMembers = [
  { email: 'nurse1@hospital.com', password: 'nurse123', role: 'nurse', firstName: 'Sarah', lastName: 'Johnson', phone: '9876543210' },
  { email: 'reception@hospital.com', password: 'reception123', role: 'receptionist', firstName: 'Emily', lastName: 'Davis', phone: '8765432109' },
  { email: 'pharmacist@hospital.com', password: 'pharma123', role: 'pharmacist', firstName: 'Michael', lastName: 'Brown', phone: '7654321098' },
  { email: 'labtech@hospital.com', password: 'lab123', role: 'lab_technician', firstName: 'Lisa', lastName: 'Wilson', phone: '6543210987' },
  { email: 'doctor2@hospital.com', password: 'doctor123', role: 'doctor', firstName: 'David', lastName: 'Martinez', phone: '5432109876' }
];

const ADMIN_TOKEN = 'YOUR_ADMIN_JWT_TOKEN_HERE';

async function addStaff() {
  for (const staff of staffMembers) {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', staff);
      console.log(`✅ Added: ${staff.firstName} ${staff.lastName} (${staff.role})`);
    } catch (error) {
      console.error(`❌ Error adding ${staff.email}:`, error.response?.data?.message);
    }
  }
}

addStaff();
