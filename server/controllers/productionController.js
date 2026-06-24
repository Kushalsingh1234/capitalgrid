import Startup from '../models/Startup.js';

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

    // Find existing inventory slot or create new one
    const inventory = startup.inventory || [];
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
