import Startup from '../models/Startup.js';
import Transaction from '../models/Transaction.js';
import Employee from '../models/Employee.js';
import ProductionTask from '../models/ProductionTask.js';
import { createNotification } from '../services/notificationService.js';
import { BUSINESS_REQUIRED_EMPLOYEES } from './employeeController.js';
import { PRODUCT_DEPENDENCIES } from '../config/dependencies.js';
import { PRODUCTION_TIME_CONFIG } from '../config/productionTimeConfig.js';
import { WORKFORCE_CAPACITY_CONFIG } from '../config/workforceCapacityConfig.js';
import countryEconomy from '../config/countryEconomy.js';

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
      const country = startup.country || 'India';
      const countryData = countryEconomy.countries[country] || countryEconomy.countries['India'];
      const basePrice = countryData.commodities[task.productId]?.price || 100;
      const producedCost = task.quantity * Math.round(basePrice * 0.50);

      // Find or add item
      const existingItem = inventory.find(i => i.productId === task.productId);
      if (existingItem) {
        const currentQty = existingItem.quantity || 0;
        const currentTotalCost = existingItem.totalCost || (currentQty * basePrice * 0.50);
        existingItem.quantity = currentQty + task.quantity;
        existingItem.totalCost = currentTotalCost + producedCost;
      } else {
        inventory.push({
          productId: task.productId,
          productName: task.productName,
          quantity: task.quantity,
          totalCost: producedCost
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

    // Create notifications for completed tasks
    for (const task of completedTasks) {
      await createNotification(
        startup._id,
        `Completed production of ${task.quantity}x ${task.productName}.`,
        'Production',
        0
      );
    }

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

const PRODUCT_NAMES = {
  seeds: 'Seeds',
  wheat: 'Wheat',
  rice: 'Rice',
  cotton: 'Cotton',
  grains: 'Grains',
  vegetables: 'Vegetables',
  milk: 'Milk',
  fodder: 'Fodder',
  eggs: 'Eggs',
  coal: 'Coal',
  iron_ore: 'Iron Ore',
  bauxite_ore: 'Bauxite Ore',
  limestone: 'Limestone',
  gypsum: 'Gypsum',
  crude_oil: 'Crude Oil',
  minerals: 'Minerals',
  sand: 'Sand',
  clay: 'Clay',
  energy: 'Energy',
  cows: 'Cows',
  hens: 'Hens',
  shirts: 'Shirts',
  jeans: 'Jeans',
  jackets: 'Jackets',
  fabric: 'Fabric',
  bread: 'Bread',
  biscuits: 'Biscuits',
  cheese: 'Cheese',
  steel: 'Steel',
  aluminium: 'Aluminium',
  cement: 'Cement',
  bricks: 'Bricks',
  steel_beams: 'Steel Beams',
  glass: 'Glass',
  silicon: 'Silicon',
  plastics: 'Plastics',
  chemicals: 'Chemicals',
  processor: 'Processor',
  display: 'Display',
  electronic_components: 'Electronic Components',
  battery: 'Battery',
  on_board_computer: 'On-board Computer',
  phones: 'Phones',
  laptops: 'Laptops',
  tvs: 'TVs',
  combustion_engine: 'Combustion Engine',
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

    if (quantity > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum production batch size is 10000 units.'
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

    // Fetch active production tasks to calculate currently busy employees
    let activeTasks = [];
    if (global.useMockDb) {
      if (!global.mockProductionTasks) {
        global.mockProductionTasks = [];
      }
      activeTasks = global.mockProductionTasks.filter(
        t => String(t.startupId) === String(startup._id) && t.status === 'Producing'
      );
    } else {
      activeTasks = await ProductionTask.find({
        startupId: startup._id,
        status: 'Producing'
      });
    }

    const busyEmployees = {};
    for (const task of activeTasks) {
      const capInfo = WORKFORCE_CAPACITY_CONFIG[task.productId];
      const dep = PRODUCT_DEPENDENCIES[task.productId];
      const countedRoles = new Set();
      
      if (capInfo) {
        const constraints = Array.isArray(capInfo) ? capInfo : [capInfo];
        for (const { role, capacity } of constraints) {
          const reqCount = Math.ceil(task.quantity / capacity);
          busyEmployees[role] = (busyEmployees[role] || 0) + reqCount;
          countedRoles.add(role);
        }
      }
      
      if (dep && dep.employees) {
        for (const [role, needed] of Object.entries(dep.employees)) {
          if (countedRoles.has(role)) continue;
          busyEmployees[role] = (busyEmployees[role] || 0) + needed;
        }
      }
    }

    // Verify employees using dynamic capacity
    const capacityInfo = WORKFORCE_CAPACITY_CONFIG[productId];
    if (capacityInfo) {
      const constraints = Array.isArray(capacityInfo) ? capacityInfo : [capacityInfo];
      for (const { role, capacity } of constraints) {
        const requiredCount = Math.ceil(quantity / capacity);
        const record = hiredEmployees.find(e => e.employeeType === role);
        const totalQty = record ? record.quantity : 0;
        const busyQty = busyEmployees[role] || 0;
        const availableQty = Math.max(0, totalQty - busyQty);
        if (availableQty < requiredCount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient Workforce\nRequired ${role}s: ${requiredCount}\nAvailable ${role}s: ${availableQty} (Total: ${totalQty}, Busy: ${busyQty})\nHire ${requiredCount - availableQty} additional ${role}s.`
          });
        }
      }
    }

    // Verify flat employee requirements
    const requiredEmployees = dependency.employees || {};
    for (const [role, needed] of Object.entries(requiredEmployees)) {
      if (capacityInfo) {
        const constraints = Array.isArray(capacityInfo) ? capacityInfo : [capacityInfo];
        if (constraints.some(c => c.role === role)) continue;
      }
      const record = hiredEmployees.find(e => e.employeeType === role);
      const totalQty = record ? record.quantity : 0;
      const busyQty = busyEmployees[role] || 0;
      const availableQty = Math.max(0, totalQty - busyQty);
      if (availableQty < needed) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Workforce\nRequired ${role}s: ${needed}\nAvailable ${role}s: ${availableQty} (Total: ${totalQty}, Busy: ${busyQty})\nHire ${needed - availableQty} additional ${role}s.`
        });
      }
    }

    // Verify and deduct raw materials
    const inventory = startup.inventory || [];
    const requiredMaterials = dependency.materials || {};
    const missingMatList = [];
    const NON_CONSUMABLE_ASSETS = { cows: 10, hens: 10 };

    for (const [matId, qtyPerUnit] of Object.entries(requiredMaterials)) {
      const isAsset = NON_CONSUMABLE_ASSETS[matId] !== undefined;
      const needed = isAsset
        ? Math.ceil(quantity / NON_CONSUMABLE_ASSETS[matId])
        : qtyPerUnit * quantity;

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

    // Deduct consumable materials immediately (bypass non-consumable cows/hens)
    for (const [matId, qtyPerUnit] of Object.entries(requiredMaterials)) {
      if (NON_CONSUMABLE_ASSETS[matId] !== undefined) continue;

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

    // Calculate duration and end timestamps using quantity-based formula
    const baseTime = PRODUCTION_TIME_CONFIG[productId] || 30;
    const speedMultiplier = startup.productionSpeedMultiplier || 1.0;
    const duration = Math.round((baseTime * quantity) / speedMultiplier);
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
