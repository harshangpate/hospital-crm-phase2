'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Patients', 'chronicConditions', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: true
    });
    
    await queryInterface.addColumn('Patients', 'currentMedications', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: true
    });
    
    await queryInterface.addColumn('Patients', 'height', {
      type: Sequelize.DECIMAL(5,2),
      allowNull: true
    });
    
    await queryInterface.addColumn('Patients', 'weight', {
      type: Sequelize.DECIMAL(5,2),
      allowNull: true
    });
    
    await queryInterface.addColumn('Patients', 'occupation', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Patients', 'maritalStatus', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Patients', 'preferredLanguage', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Patients', 'country', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Patients', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Convert allergies to JSONB if it exists as STRING
    await queryInterface.changeColumn('Patients', 'allergies', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    // Convert medicalHistory to JSONB if needed
    await queryInterface.changeColumn('Patients', 'medicalHistory', {
      type: Sequelize.JSONB,
      defaultValue: []
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Patients', 'chronicConditions');
    await queryInterface.removeColumn('Patients', 'currentMedications');
    await queryInterface.removeColumn('Patients', 'height');
    await queryInterface.removeColumn('Patients', 'weight');
    await queryInterface.removeColumn('Patients', 'occupation');
    await queryInterface.removeColumn('Patients', 'maritalStatus');
    await queryInterface.removeColumn('Patients', 'preferredLanguage');
    await queryInterface.removeColumn('Patients', 'country');
    await queryInterface.removeColumn('Patients', 'notes');
  }
};
