'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Suppliers table
    await queryInterface.createTable('Suppliers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      supplierCode: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contactPerson: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false
      },
      zipCode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'India'
      },
      licenseNumber: {
        type: Sequelize.STRING,
        unique: true
      },
      gstNumber: {
        type: Sequelize.STRING
      },
      paymentTerms: {
        type: Sequelize.ENUM('cash', 'net_30', 'net_60', 'net_90'),
        defaultValue: 'net_30'
      },
      creditLimit: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      rating: {
        type: Sequelize.INTEGER
      },
      notes: {
        type: Sequelize.TEXT
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Drugs table
    await queryInterface.createTable('Drugs', {
      // ... (include all drug fields from the model)
    });

    // Create DrugBatches table
    await queryInterface.createTable('DrugBatches', {
      // ... (include all batch fields from the model)
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DrugBatches');
    await queryInterface.dropTable('Drugs');
    await queryInterface.dropTable('Suppliers');
  }
};
