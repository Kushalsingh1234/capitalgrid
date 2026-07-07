import * as worldClockService from '../services/worldClockService.js';

/**
 * @desc    Get the current virtual game world clock
 * @route   GET /api/world-clock
 * @access  Public
 */
export const getClock = async (req, res) => {
  try {
    const clockData = worldClockService.getFormattedClock();
    res.status(200).json({ success: true, data: clockData });
  } catch (error) {
    console.error(`[World Clock Controller Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving world clock.' });
  }
};

/**
 * @desc    Update world clock parameters
 * @route   PUT /api/world-clock/settings
 * @access  Private/Admin (Public/Private depending on auth)
 */
export const updateClock = async (req, res) => {
  try {
    const { speedMultiplier, gameStartDate } = req.body;
    const clockData = await worldClockService.updateClockSettings({ speedMultiplier, gameStartDate });
    res.status(200).json({ success: true, message: 'World clock settings updated successfully.', data: clockData });
  } catch (error) {
    console.error(`[World Clock Controller Settings Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error updating world clock settings.' });
  }
};
