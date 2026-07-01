import Marketplace from '../models/Marketplace.js';
import Startup from '../models/Startup.js';
import Transaction from '../models/Transaction.js';
import ncrCatalog from '../config/ncrCatalog.js';

/**
 * @desc    Create a new marketplace listing from seller inventory
 * @route   POST /api/marketplace/list
 * @access  Private
 */
export const createListing = async (req, res) => {
  const { productId, quantity, pricePerUnit } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    // 1. Basic validation
    if (!productId || !quantity || !pricePerUnit) {
      return res.status(400).json({ success: false, message: 'All listing fields (product, quantity, price per unit) are required' });
    }

    const qty = parseInt(quantity, 10);
    const unitPrice = parseFloat(pricePerUnit);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer greater than 0' });
    }

    if (isNaN(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Price per unit must be a positive number greater than 0' });
    }

    // 2. Fetch seller startup
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'No startup found for this player. Please register a startup first.' });
    }

    // 3. Verify product is in inventory and has sufficient quantity
    const inventory = startup.inventory || [];
    const inventoryItemIndex = inventory.findIndex(item => item.productId === productId);

    if (inventoryItemIndex === -1) {
      return res.status(400).json({ success: false, message: 'Product not found in your inventory' });
    }

    const inventoryItem = inventory[inventoryItemIndex];
    if (inventoryItem.quantity < qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient inventory. You only have ${inventoryItem.quantity} unit(s) of ${inventoryItem.productName} available.` 
      });
    }

    // 4. Deduct quantity from inventory immediately (reserve goods)
    inventoryItem.quantity -= qty;
    
    // Remove product slot if quantity reaches 0
    let updatedInventory = [...inventory];
    if (inventoryItem.quantity === 0) {
      updatedInventory.splice(inventoryItemIndex, 1);
    }
    startup.inventory = updatedInventory;

    // Persist startup inventory change
    if (global.useMockDb) {
      // In-memory update is already mutated
    } else {
      startup.markModified('inventory');
      await startup.save();
    }

    // 5. Create listing
    const totalPrice = qty * unitPrice;
    let newListing;

    if (global.useMockDb) {
      newListing = {
        _id: 'mock-listing-' + Date.now(),
        seller: startup._id,
        sellerStartupName: startup.startupName,
        sellerCountry: startup.country,
        productId,
        productName: inventoryItem.productName,
        quantity: qty,
        pricePerUnit: unitPrice,
        totalPrice,
        status: 'Active',
        buyer: null,
        buyerStartupName: null,
        createdAt: new Date()
      };
      global.mockMarketplace.push(newListing);
    } else {
      newListing = await Marketplace.create({
        seller: startup._id,
        sellerStartupName: startup.startupName,
        sellerCountry: startup.country,
        productId,
        productName: inventoryItem.productName,
        quantity: qty,
        pricePerUnit: unitPrice,
        totalPrice,
        status: 'Active'
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully listed ${qty}x ${inventoryItem.productName} for sale.`,
      listing: newListing,
      inventory: startup.inventory
    });

  } catch (error) {
    console.error(`[Create Listing Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error creating marketplace listing' });
  }
};

/**
 * @desc    Get all active marketplace listings
 * @route   GET /api/marketplace
 * @access  Private
 */
export const getAllListings = async (req, res) => {
  try {
    let listings;
    if (global.useMockDb) {
      listings = global.mockMarketplace.filter(l => l.status === 'Active');
    } else {
      listings = await Marketplace.find({ status: 'Active' }).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      listings
    });
  } catch (error) {
    console.error(`[Fetch Listings Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving marketplace listings' });
  }
};

/**
 * @desc    Purchase a marketplace listing
 * @route   POST /api/marketplace/buy/:id
 * @access  Private
 */
export const buyListing = async (req, res) => {
  const listingId = req.params.id;
  const userId = req.user.id || req.user._id;

  try {
    // 1. Find listing
    let listing;
    if (global.useMockDb) {
      listing = global.mockMarketplace.find(l => String(l._id) === String(listingId));
    } else {
      listing = await Marketplace.findById(listingId);
    }

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Marketplace listing not found' });
    }

    if (listing.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This listing is no longer active' });
    }

    // 2. Fetch buyer startup
    let buyerStartup;
    if (global.useMockDb) {
      buyerStartup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      buyerStartup = await Startup.findOne({ owner: userId });
    }

    if (!buyerStartup) {
      return res.status(404).json({ success: false, message: 'No startup found for buyer player. Please register a startup first.' });
    }

    // 3. Prevent players from buying their own listings
    if (String(buyerStartup._id) === String(listing.seller)) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own marketplace listing' });
    }

    // 4. Verify buyer balance
    if (buyerStartup.currentBalance < listing.totalPrice) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient funds. Cost is ${listing.totalPrice} but you only have ${buyerStartup.currentBalance}.` 
      });
    }

    // 5. Fetch seller startup
    let sellerStartup;
    if (global.useMockDb) {
      sellerStartup = global.mockStartups.find(s => String(s._id) === String(listing.seller));
    } else {
      sellerStartup = await Startup.findById(listing.seller);
    }

    if (!sellerStartup) {
      return res.status(404).json({ success: false, message: 'Seller startup record not found' });
    }

    // 6. Execute transfers
    // Decrease buyer balance
    buyerStartup.currentBalance -= listing.totalPrice;
    
    // Increase seller balance
    sellerStartup.currentBalance += listing.totalPrice;

    // Increase buyer inventory
    const buyerInventory = buyerStartup.inventory || [];
    const buyerItemIndex = buyerInventory.findIndex(item => item.productId === listing.productId);

    if (buyerItemIndex !== -1) {
      buyerInventory[buyerItemIndex].quantity += listing.quantity;
    } else {
      buyerInventory.push({
        productId: listing.productId,
        productName: listing.productName,
        quantity: listing.quantity
      });
    }
    buyerStartup.inventory = buyerInventory;

    // Update listing status and buyer info
    listing.status = 'Sold';
    listing.buyer = buyerStartup._id;
    listing.buyerStartupName = buyerStartup.startupName;

    // 7. Persist changes
    if (global.useMockDb) {
      // In-memory changes already updated in place
    } else {
      // Save buyer startup
      buyerStartup.markModified('inventory');
      await buyerStartup.save();

      // Save seller startup
      await sellerStartup.save();

      // Save listing
      await listing.save();
    }

    // 8. Create transaction history records (one for buyer, one for seller)
    if (global.useMockDb) {
      const sellerTx = {
        _id: 'mock-tx-s-' + Date.now(),
        startup: listing.seller,
        transactionType: 'Sale',
        buyerStartupName: buyerStartup.startupName,
        sellerStartupName: sellerStartup.startupName,
        productName: listing.productName,
        quantity: listing.quantity,
        pricePerUnit: listing.pricePerUnit,
        totalAmount: listing.totalPrice,
        createdAt: new Date()
      };
      
      const buyerTx = {
        _id: 'mock-tx-b-' + (Date.now() + 1),
        startup: buyerStartup._id,
        transactionType: 'Purchase',
        buyerStartupName: buyerStartup.startupName,
        sellerStartupName: sellerStartup.startupName,
        productName: listing.productName,
        quantity: listing.quantity,
        pricePerUnit: listing.pricePerUnit,
        totalAmount: listing.totalPrice,
        createdAt: new Date()
      };
      
      global.mockTransactions.push(sellerTx, buyerTx);
    } else {
      await Transaction.create([
        {
          startup: listing.seller,
          transactionType: 'Sale',
          buyerStartupName: buyerStartup.startupName,
          sellerStartupName: sellerStartup.startupName,
          productName: listing.productName,
          quantity: listing.quantity,
          pricePerUnit: listing.pricePerUnit,
          totalAmount: listing.totalPrice
        },
        {
          startup: buyerStartup._id,
          transactionType: 'Purchase',
          buyerStartupName: buyerStartup.startupName,
          sellerStartupName: sellerStartup.startupName,
          productName: listing.productName,
          quantity: listing.quantity,
          pricePerUnit: listing.pricePerUnit,
          totalAmount: listing.totalPrice
        }
      ]);
    }

    res.status(200).json({
      success: true,
      message: `Successfully purchased ${listing.quantity}x ${listing.productName} for ${listing.totalPrice}.`,
      currentBalance: buyerStartup.currentBalance,
      inventory: buyerStartup.inventory
    });

  } catch (error) {
    console.error(`[Buy Listing Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error processing purchase transaction' });
  }
};

/**
 * @desc    Get National Commodity Reserve (NCR) catalog
 * @route   GET /api/marketplace/ncr/catalog
 * @access  Private
 */
export const getNcrCatalog = async (req, res) => {
  try {
    res.status(200).json({ success: true, catalog: ncrCatalog });
  } catch (error) {
    console.error(`[NCR Catalog Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving NCR catalog' });
  }
};

/**
 * @desc    Purchase a product from NCR
 * @route   POST /api/marketplace/ncr/buy
 * @access  Private
 */
export const buyFromNcr = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product and a valid quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    const ncrItem = ncrCatalog.find(i => i.productId === productId);
    if (!ncrItem) {
      return res.status(404).json({ success: false, message: 'Product not found in NCR catalog' });
    }

    const totalCost = ncrItem.ncrSellPrice * qty;

    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found for player' });
    }

    if (startup.currentBalance < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient corporate liquidity reserves' });
    }

    // Perform transaction
    startup.currentBalance -= totalCost;

    const inventory = startup.inventory || [];
    const itemIndex = inventory.findIndex(i => i.productId === productId);
    if (itemIndex !== -1) {
      inventory[itemIndex].quantity += qty;
    } else {
      inventory.push({
        productId,
        productName: ncrItem.productName,
        quantity: qty
      });
    }
    startup.inventory = inventory;

    // Save
    if (global.useMockDb) {
      // updated in place
    } else {
      startup.markModified('inventory');
      await startup.save();
    }

    // Create Transaction
    let newTx;
    if (global.useMockDb) {
      newTx = {
        _id: 'mock-tx-ncr-' + Date.now(),
        startup: startup._id,
        transactionType: 'Purchase',
        buyerStartupName: startup.startupName,
        sellerStartupName: 'National Commodity Reserve',
        productName: ncrItem.productName,
        quantity: qty,
        pricePerUnit: ncrItem.ncrSellPrice,
        totalAmount: totalCost,
        createdAt: new Date()
      };
      global.mockTransactions.push(newTx);
    } else {
      newTx = await Transaction.create({
        startup: startup._id,
        transactionType: 'Purchase',
        buyerStartupName: startup.startupName,
        sellerStartupName: 'National Commodity Reserve',
        productName: ncrItem.productName,
        quantity: qty,
        pricePerUnit: ncrItem.ncrSellPrice,
        totalAmount: totalCost
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully purchased ${qty}x ${ncrItem.productName} from NCR`,
      currentBalance: startup.currentBalance,
      inventory: startup.inventory
    });

  } catch (error) {
    console.error(`[NCR Buy Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error buying from NCR' });
  }
};

/**
 * @desc    Sell a product to NCR
 * @route   POST /api/marketplace/ncr/sell
 * @access  Private
 */
export const sellToNcr = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product and a valid quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    const ncrItem = ncrCatalog.find(i => i.productId === productId);
    if (!ncrItem) {
      return res.status(404).json({ success: false, message: 'Product not found in NCR catalog' });
    }

    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found for player' });
    }

    const inventory = startup.inventory || [];
    const itemIndex = inventory.findIndex(i => i.productId === productId);

    if (itemIndex === -1 || inventory[itemIndex].quantity < qty) {
      return res.status(400).json({ success: false, message: 'Insufficient stock in warehouse' });
    }

    const totalRevenue = ncrItem.ncrBuyPrice * qty;

    // Perform transaction
    inventory[itemIndex].quantity -= qty;
    if (inventory[itemIndex].quantity === 0) {
      inventory.splice(itemIndex, 1);
    }
    startup.inventory = inventory;
    startup.currentBalance += totalRevenue;

    // Save
    if (global.useMockDb) {
      // updated in place
    } else {
      startup.markModified('inventory');
      await startup.save();
    }

    // Create Transaction
    let newTx;
    if (global.useMockDb) {
      newTx = {
        _id: 'mock-tx-ncr-' + Date.now(),
        startup: startup._id,
        transactionType: 'Sale',
        buyerStartupName: 'National Commodity Reserve',
        sellerStartupName: startup.startupName,
        productName: ncrItem.productName,
        quantity: qty,
        pricePerUnit: ncrItem.ncrBuyPrice,
        totalAmount: totalRevenue,
        createdAt: new Date()
      };
      global.mockTransactions.push(newTx);
    } else {
      newTx = await Transaction.create({
        startup: startup._id,
        transactionType: 'Sale',
        buyerStartupName: 'National Commodity Reserve',
        sellerStartupName: startup.startupName,
        productName: ncrItem.productName,
        quantity: qty,
        pricePerUnit: ncrItem.ncrBuyPrice,
        totalAmount: totalRevenue
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully sold ${qty}x ${ncrItem.productName} to NCR`,
      currentBalance: startup.currentBalance,
      inventory: startup.inventory
    });

  } catch (error) {
    console.error(`[NCR Sell Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error selling to NCR' });
  }
};
