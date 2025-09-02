const { validationResult } = require('express-validator');
const { InventoryItem, StockTransaction, Supplier, PurchaseOrder, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Generate unique item code
const generateItemCode = async (category) => {
    const categoryPrefix = {
        'medicine': 'MED',
        'surgical_equipment': 'SUR',
        'consumables': 'CON',
        'lab_supplies': 'LAB',
        'office_supplies': 'OFF',
        'medical_devices': 'DEV'
    };

    const prefix = categoryPrefix[category] || 'ITM';
    const lastItem = await InventoryItem.findOne({
        where: { itemCode: { [Op.like]: `${prefix}%` } },
        order: [['createdAt', 'DESC']]
    });

    const lastId = lastItem ? parseInt(lastItem.itemCode.slice(3)) : 0;
    return `${prefix}${String(lastId + 1).padStart(4, '0')}`;
};

// Generate transaction ID
const generateTransactionId = async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastTransaction = await StockTransaction.findOne({
        where: { transactionId: { [Op.like]: `TXN${today}%` } },
        order: [['createdAt', 'DESC']]
    });

    const lastId = lastTransaction ?
        parseInt(lastTransaction.transactionId.slice(-4)) : 0;
    return `TXN${today}${String(lastId + 1).padStart(4, '0')}`;
};

// @desc    Get all inventory items
// @route   GET /api/inventory/items
// @access  Private (admin, pharmacist, nurse)
const getAllItems = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const lowStock = req.query.lowStock === 'true';
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let whereCondition = { isActive: true };

        if (category) {
            whereCondition.category = category;
        }

        if (lowStock) {
            whereCondition[Op.or] = [
                { currentStock: { [Op.lte]: sequelize.col('reorderLevel') } },
                { currentStock: 0 }
            ];
        }

        if (search) {
            whereCondition[Op.or] = [
                { itemName: { [Op.iLike]: `%${search}%` } },
                { itemCode: { [Op.iLike]: `%${search}%` } },
                { manufacturer: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: items } = await InventoryItem.findAndCountAll({
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
            order: [['itemName', 'ASC']]
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
            items
        });

    } catch (error) {
        console.error('Get inventory items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new inventory item
// @route   POST /api/inventory/items
// @access  Private (admin, pharmacist)
const createItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        // Generate item code
        const itemCode = await generateItemCode(req.body.category);

        const item = await InventoryItem.create({
            ...req.body,
            itemCode,
            lastUpdatedBy: req.user.userId
        });

        // Get item with relationships
        const createdItem = await InventoryItem.findByPk(item.id, {
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
            message: 'Inventory item created successfully',
            item: createdItem
        });

    } catch (error) {
        console.error('Create inventory item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update stock (add/remove)
// @route   POST /api/inventory/stock/update
// @access  Private (admin, pharmacist, nurse)
const updateStock = async (req, res) => {
    try {
        const { itemId, quantity, transactionType, reason, referenceNumber } = req.body;

        // Validate transaction type
        if (!['purchase', 'sale', 'adjustment', 'return', 'damage', 'expired'].includes(transactionType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type'
            });
        }

        // Get inventory item
        const item = await InventoryItem.findByPk(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Calculate new stock level
        let newStock = item.currentStock;
        if (['purchase', 'return', 'adjustment'].includes(transactionType) && quantity > 0) {
            newStock += quantity; // Add to stock
        } else if (['sale', 'damage', 'expired'].includes(transactionType) && quantity > 0) {
            if (item.currentStock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock available'
                });
            }
            newStock -= quantity; // Subtract from stock
        } else if (transactionType === 'adjustment' && quantity < 0) {
            newStock += quantity; // Adjustment can be negative
        }

        // Generate transaction ID
        const transactionId = await generateTransactionId();

        // Create stock transaction record
        const transaction = await StockTransaction.create({
            transactionId,
            itemId,
            transactionType,
            quantity: Math.abs(quantity),
            unitCost: item.unitCost,
            totalCost: item.unitCost * Math.abs(quantity),
            reason,
            referenceNumber,
            performedBy: req.user.userId,
            notes: req.body.notes
        });

        // Update inventory item stock
        await item.update({
            currentStock: Math.max(0, newStock),
            lastUpdatedBy: req.user.userId
        });

        // Get updated item with relationships
        const updatedItem = await InventoryItem.findByPk(itemId, {
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['companyName']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Stock updated successfully',
            item: updatedItem,
            transaction: transaction,
            stockAlert: newStock <= item.reorderLevel ? 'LOW_STOCK' : null
        });

    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get low stock items
// @route   GET /api/inventory/alerts/low-stock
// @access  Private (admin, pharmacist)
const getLowStockItems = async (req, res) => {
    try {
        const lowStockItems = await InventoryItem.findAll({
            where: {
                isActive: true,
                [Op.where]: sequelize.where(
                    sequelize.col('currentStock'),
                    Op.lte,
                    sequelize.col('reorderLevel')
                )
            },
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['companyName', 'contactPerson', 'phone']
                }
            ],
            order: [['currentStock', 'ASC']]
        });

        // Categorize alerts
        const outOfStock = lowStockItems.filter(item => item.currentStock === 0);
        const lowStock = lowStockItems.filter(item => item.currentStock > 0);

        res.json({
            success: true,
            alerts: {
                outOfStock: {
                    count: outOfStock.length,
                    items: outOfStock
                },
                lowStock: {
                    count: lowStock.length,
                    items: lowStock
                }
            },
            totalAlerts: lowStockItems.length
        });

    } catch (error) {
        console.error('Get low stock items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get expiring items
// @route   GET /api/inventory/alerts/expiring
// @access  Private (admin, pharmacist)
const getExpiringItems = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30; // Default 30 days
        const expiringDate = new Date();
        expiringDate.setDate(expiringDate.getDate() + days);

        const expiringItems = await InventoryItem.findAll({
            where: {
                isActive: true,
                expiryDate: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.lte]: expiringDate }
                    ]
                },
                currentStock: { [Op.gt]: 0 }
            },
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['companyName']
                }
            ],
            order: [['expiryDate', 'ASC']]
        });

        // Categorize by urgency
        const today = new Date();
        const expired = expiringItems.filter(item => new Date(item.expiryDate) < today);
        const expiring7Days = expiringItems.filter(item => {
            const expiry = new Date(item.expiryDate);
            const days7 = new Date();
            days7.setDate(days7.getDate() + 7);
            return expiry >= today && expiry <= days7;
        });
        const expiring30Days = expiringItems.filter(item => {
            const expiry = new Date(item.expiryDate);
            const days7 = new Date();
            days7.setDate(days7.getDate() + 7);
            return expiry > days7;
        });

        res.json({
            success: true,
            expiryAlerts: {
                expired: {
                    count: expired.length,
                    items: expired
                },
                expiring7Days: {
                    count: expiring7Days.length,
                    items: expiring7Days
                },
                expiring30Days: {
                    count: expiring30Days.length,
                    items: expiring30Days
                }
            },
            totalItems: expiringItems.length
        });

    } catch (error) {
        console.error('Get expiring items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private (admin, pharmacist)
const getInventoryStats = async (req, res) => {
    try {
        // Total items
        const totalItems = await InventoryItem.count({ where: { isActive: true } });

        // Low stock items
        const lowStockCount = await InventoryItem.count({
            where: {
                isActive: true,
                [Op.and]: [
                    sequelize.where(
                        sequelize.col('currentStock'),
                        Op.lte,
                        sequelize.col('reorderLevel')
                    )
                ]
            }
        });

        // Out of stock
        const outOfStockCount = await InventoryItem.count({
            where: { isActive: true, currentStock: 0 }
        });

        // Items by category
        const categoryStats = await InventoryItem.findAll({
            attributes: [
                'category',
                [require('sequelize').fn('COUNT', require('sequelize').col('category')), 'count']
            ],
            where: { isActive: true },
            group: ['category']
        });

        // Total inventory value
        const items = await InventoryItem.findAll({
            where: { isActive: true },
            attributes: ['currentStock', 'unitCost']
        });

        const inventoryValue = items.reduce((total, item) => {
            return total + (item.currentStock * parseFloat(item.unitCost));
        }, 0);

        res.json({
            success: true,
            stats: {
                totalItems,
                lowStockCount,
                outOfStockCount,
                totalValue: inventoryValue || 0,
                categoryBreakdown: categoryStats.reduce((acc, item) => {
                    acc[item.category] = parseInt(item.dataValues.count);
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Get inventory stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getAllItems,
    createItem,
    updateStock,
    getLowStockItems,
    getExpiringItems,
    getInventoryStats
};
