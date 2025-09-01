const { sequelize } = require('../models');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models (creates tables)
    await sequelize.sync({ force: false }); // Set to true to recreate tables
    console.log('✅ All models were synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
