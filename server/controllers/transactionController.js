import Transaction from '../models/Transaction.js';
import Startup from '../models/Startup.js';

/**
 * @desc    Get the active player's startup transaction history
 * @route   GET /api/transaction/my-history
 * @access  Private
 */
export const getMyTransactions = async (req, res) => {
  const userId = req.user.id || req.user._id;

  try {
    // 1. Fetch player's startup
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'No startup registered for this player' });
    }

    // 2. Fetch transactions for this startup
    let transactions;
    if (global.useMockDb) {
      // Filter mock transactions and sort by date descending
      transactions = (global.mockTransactions || [])
        .filter(t => String(t.startup) === String(startup._id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      transactions = await Transaction.find({ startup: startup._id })
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error(`[Fetch Transactions Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving transaction history' });
  }
};
