import Startup from '../models/Startup.js';
import Transaction from '../models/Transaction.js';
import Employee from '../models/Employee.js';
import { BUSINESS_REQUIRED_EMPLOYEES } from './employeeController.js';
import { PRODUCT_DEPENDENCIES } from '../config/dependencies.js';

/**
 * @desc    Add produced items to startup inventory
 * @route   POST /api/production/complete
 * @access  Private
 */
export const completeProduction = async (req, res) => {
  const { productId, productName, quantity } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    // Validation
    if (!productId || !productName || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, name, and a valid quantity are required.'
      });
    }

    if (quantity > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum production batch size is 100 units per cycle.'
      });
    }

    let startup;

    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'No startup found for this player.'
      });
    }

    // Verify required employees and raw materials are available before production
    const dependency = PRODUCT_DEPENDENCIES[productId];
    const inventory = startup.inventory || [];

    if (dependency) {
      // 1. Fetch hired employee records
      let hiredEmployees = [];
      if (global.useMockDb) {
        hiredEmployees = (global.mockEmployees || []).filter(e => String(e.startupId) === String(startup._id));
      } else {
        hiredEmployees = await Employee.find({ startupId: startup._id });
      }

      // Verify employees
      const requiredEmployees = dependency.employees || {};
      for (const [role, reqQty] of Object.entries(requiredEmployees)) {
        const record = hiredEmployees.find(e => e.employeeType === role);
        const currentQty = record ? record.quantity : 0;
        if (currentQty < reqQty) {
          return res.status(400).json({
            success: false,
            message: `Required workforce not met: Hire at least ${reqQty} ${role}${reqQty > 1 ? 's' : ''} to produce ${productName}.`
          });
        }
      }

      // Verify raw materials
      const requiredMaterials = dependency.materials || {};
      const missingMatList = [];
      for (const [matId, qtyPerUnit] of Object.entries(requiredMaterials)) {
        const needed = qtyPerUnit * quantity;
        const invItem = inventory.find(item => item.productId === matId);
        const available = invItem ? invItem.quantity : 0;
        if (available < needed) {
          const matName = matId.charAt(0).toUpperCase() + matId.slice(1).replace('_', ' ');
          missingMatList.push(`${matName} (${needed} needed, ${available} available)`);
        }
      }

      if (missingMatList.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient raw materials: ${missingMatList.join(', ')}.`
        });
      }

      // Deduct materials if everything is verified
      for (const [matId, qtyPerUnit] of Object.entries(requiredMaterials)) {
        const needed = qtyPerUnit * quantity;
        const itemIndex = inventory.findIndex(item => item.productId === matId);
        if (itemIndex > -1) {
          inventory[itemIndex].quantity -= needed;
          if (inventory[itemIndex].quantity <= 0) {
            inventory.splice(itemIndex, 1);
          }
        }
      }
      startup.inventory = inventory;
    }


    // Find existing inventory slot or create new one
    const existingItem = inventory.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      inventory.push({
        productId,
        productName,
        quantity
      });
    }

    // Persist changes
    if (global.useMockDb) {
      startup.inventory = inventory;
    } else {
      startup.inventory = inventory;
      startup.markModified('inventory');
      await startup.save();
    }

    // Create production transaction record
    if (global.useMockDb) {
      const newTransaction = {
        _id: 'mock-tx-' + Date.now(),
        startup: startup._id,
        transactionType: 'Production',
        buyerStartupName: null,
        sellerStartupName: null,
        productName: productName,
        quantity: quantity,
        pricePerUnit: 0,
        totalAmount: 0,
        createdAt: new Date()
      };
      global.mockTransactions.push(newTransaction);
    } else {
      await Transaction.create({
        startup: startup._id,
        transactionType: 'Production',
        buyerStartupName: null,
        sellerStartupName: null,
        productName: productName,
        quantity: quantity,
        pricePerUnit: 0,
        totalAmount: 0
      });
    }

    res.status(200).json({
      success: true,
      message: `${quantity}x ${productName} added to inventory.`,
      inventory: startup.inventory
    });

  } catch (error) {
    console.error(`[Production Complete Error] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error finalizing production run.'
    });
  }
};

/**
 * @desc    Get current startup inventory
 * @route   GET /api/production/inventory
 * @access  Private
 */
export const getInventory = async (req, res) => {
  const userId = req.user.id || req.user._id;

  try {
    let startup;

    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'No startup found for this player.'
      });
    }

    res.status(200).json({
      success: true,
      inventory: startup.inventory || []
    });

  } catch (error) {
    console.error(`[Inventory Fetch Error] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving inventory data.'
    });
  }
};
