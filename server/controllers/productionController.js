import Startup from '../models/Startup.js';
import Transaction from '../models/Transaction.js';
import Employee from '../models/Employee.js';
import ProductionTask from '../models/ProductionTask.js';
import { BUSINESS_REQUIRED_EMPLOYEES } from './employeeController.js';
import { PRODUCT_DEPENDENCIES } from '../config/dependencies.js';

/**
 * processCompletedTasks
 * Evaluates active tasks and awards inventory/creates transactions if endsAt has passed.
 * Supports both persistent MongoDB and in-memory mock fallback mode.
 */
export const processCompletedTasks = async (startupId) => {
  try {
    const now = new Date();
    let activeTasks = [];

    if (global.useMockDb) {
      if (!global.mockProductionTasks) {
        global.mockProductionTasks = [];
      }
      activeTasks = global.mockProductionTasks.filter(
        t => String(t.startupId) === String(startupId) && t.status === 'Producing'
      );
    } else {
      activeTasks = await ProductionTask.find({
        startupId,
        status: 'Producing'
      });
    }

    if (activeTasks.length === 0) {
      return false;
    }

    let modified = false;
    const completedTasks = [];
    const CLOCK_DRIFT_BUFFER_MS = 3000; // 3-second clock drift tolerance

    for (const task of activeTasks) {
      const endsTime = new Date(task.endsAt).getTime();
      if (now.getTime() + CLOCK_DRIFT_BUFFER_MS >= endsTime) {
        completedTasks.push(task);
        task.status = 'Completed';
        modified = true;
      }
    }

    if (!modified) {
      return false;
    }

    // Load startup to award inventory
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s._id) === String(startupId));
    } else {
      startup = await Startup.findById(startupId);
    }

    if (!startup) {
      return false;
    }

    const inventory = startup.inventory || [];

    for (const task of completedTasks) {
      // Find or add item
      const existingItem = inventory.find(i => i.productId === task.productId);
      if (existingItem) {
        existingItem.quantity += task.quantity;
      } else {
        inventory.push({
          productId: task.productId,
          productName: task.productName,
          quantity: task.quantity
        });
      }

      // Log transaction
      if (global.useMockDb) {
        global.mockTransactions.push({
          _id: 'mock-tx-' + Date.now() + Math.random().toString(36).substr(2, 4),
          startup: startup._id,
          transactionType: 'Production',
          buyerStartupName: null,
          sellerStartupName: null,
          productName: task.productName,
          quantity: task.quantity,
          pricePerUnit: 0,
          totalAmount: 0,
          createdAt: new Date()
        });
      } else {
        await Transaction.create({
          startup: startup._id,
          transactionType: 'Production',
          buyerStartupName: null,
          sellerStartupName: null,
          productName: task.productName,
          quantity: task.quantity,
          pricePerUnit: 0,
          totalAmount: 0
        });
      }
    }

    startup.inventory = inventory;

    // Persist changes
    if (global.useMockDb) {
      // Completed statuses are updated in place in global.mockProductionTasks
    } else {
      // Save all updated tasks
      for (const task of completedTasks) {
        await task.save();
      }
      startup.markModified('inventory');
      await startup.save();
    }

    return true;
  } catch (error) {
    console.error(`[processCompletedTasks Error] ${error.message}`);
    return false;
  }
};

/**
 * @desc    Evaluate and complete active production runs on the server
 * @route   POST /api/production/complete
 * @access  Private
 */
export const completeProduction = async (req, res) => {
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

    // Process tasks
    await processCompletedTasks(startup._id);

    // Reload startup to retrieve fresh inventory state
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    res.status(200).json({
      success: true,
      message: 'Active tasks evaluated successfully.',
      inventory: startup.inventory || [],
      serverTime: new Date()
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

    // Run task checks
    await processCompletedTasks(startup._id);

    // Reload startup to retrieve fresh inventory state
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    res.status(200).json({
      success: true,
      inventory: startup.inventory || [],
      serverTime: new Date()
    });

  } catch (error) {
    console.error(`[Inventory Fetch Error] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving inventory data.'
    });
  }
};

const PRODUCT_DURATIONS = {
  wheat: 15,
  rice: 20,
  cotton: 25,
  milk: 20,
  coal: 30,
  shirts: 30,
  jeans: 30,
  jackets: 30,
  bread: 30,
  biscuits: 30,
  cheese: 30,
  cement: 30,
  bricks: 30,
  steel_beams: 30,
  phones: 30,
  laptops: 30,
  tvs: 30,
  cars: 30
};

const PRODUCT_NAMES = {
  wheat: 'Wheat',
  rice: 'Rice',
  cotton: 'Cotton',
  milk: 'Milk',
  coal: 'Coal',
  shirts: 'Shirts',
  jeans: 'Jeans',
  jackets: 'Jackets',
  bread: 'Bread',
  biscuits: 'Biscuits',
  cheese: 'Cheese',
  cement: 'Cement',
  bricks: 'Bricks',
  steel_beams: 'Steel Beams',
  phones: 'Phones',
  laptops: 'Laptops',
  tvs: 'TVs',
  cars: 'Cars'
};

/**
 * @desc    Initialize a new persistent production task
 * @route   POST /api/production/start
 * @access  Private
 */
export const startProduction = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and a valid quantity are required.'
      });
    }

    if (quantity > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum production batch size is 100 units.'
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

    // Process any previously completed tasks first
    await processCompletedTasks(startup._id);

    // Reject only if the same product is already producing in this facility
    let alreadyProducing = false;
    if (global.useMockDb) {
      if (!global.mockProductionTasks) {
        global.mockProductionTasks = [];
      }
      alreadyProducing = global.mockProductionTasks.some(
        t => String(t.startupId) === String(startup._id) && t.productId === productId && t.status === 'Producing'
      );
    } else {
      const activeTask = await ProductionTask.findOne({
        startupId: startup._id,
        productId: productId,
        status: 'Producing'
      });
      alreadyProducing = !!activeTask;
    }

    if (alreadyProducing) {
      return res.status(400).json({
        success: false,
        message: 'Active production already running for this product. You must wait for it to complete.'
      });
    }

    // Verify raw materials and workforce
    const dependency = PRODUCT_DEPENDENCIES[productId];
    if (!dependency) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product selected.'
      });
    }

    // Fetch hired employee records
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
          message: `Required workforce not met: Hire at least ${reqQty} ${role}${reqQty > 1 ? 's' : ''} to produce.`
        });
      }
    }

    // Verify and deduct raw materials
    const inventory = startup.inventory || [];
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

    // Deduct materials immediately
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

    // Calculate duration and end timestamps
    const duration = PRODUCT_DURATIONS[productId] || 30;
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + duration * 1000);
    const productName = PRODUCT_NAMES[productId] || productId;

    let newTask;
    if (global.useMockDb) {
      if (!global.mockProductionTasks) {
        global.mockProductionTasks = [];
      }
      newTask = {
        _id: 'mock-task-' + Date.now(),
        startupId: startup._id,
        productId,
        productName,
        quantity,
        startedAt,
        endsAt,
        status: 'Producing',
        duration,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      global.mockProductionTasks.push(newTask);
    } else {
      newTask = await ProductionTask.create({
        startupId: startup._id,
        productId,
        productName,
        quantity,
        startedAt,
        endsAt,
        status: 'Producing',
        duration
      });
      startup.markModified('inventory');
      await startup.save();
    }

    res.status(200).json({
      success: true,
      message: `Production of ${quantity}x ${productName} initialized.`,
      inventory: startup.inventory,
      task: newTask,
      serverTime: new Date()
    });

  } catch (error) {
    console.error(`[Production Start Error] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error starting production.'
    });
  }
};
