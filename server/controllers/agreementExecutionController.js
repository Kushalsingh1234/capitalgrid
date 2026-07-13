import * as deliveryService from '../services/deliveryService.js';
import Startup from '../models/Startup.js';

async function getUserStartup(req) {
  let userStartup = null;
  if (global.useMockDb) {
    if (!global.mockStartups) global.mockStartups = [];
    userStartup = global.mockStartups.find(s => String(s.owner) === String(req.user._id));
  } else {
    userStartup = await Startup.findOne({ owner: req.user._id });
  }
  return userStartup;
}

export const sendAgreementDelivery = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const result = await deliveryService.sendDelivery(id, startup._id);
    res.json({
      success: true,
      message: 'Delivery dispatched successfully. Reserved inventory locked.',
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptAgreementDelivery = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params; // deliveryId
    const result = await deliveryService.acceptDelivery(id, startup._id);
    res.json({
      success: true,
      message: 'Delivery accepted. Funds transferred and inventory delivered.',
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectAgreementDelivery = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params; // deliveryId
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const result = await deliveryService.rejectDelivery(id, startup._id, reason);
    res.json({
      success: true,
      message: 'Delivery rejected. Inventory released back to supplier.',
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const retractAgreement = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const agreement = await deliveryService.retractAgreement(id, startup._id);
    res.json({
      success: true,
      message: 'Contract retracted. Partner notified to settle termination payouts.',
      agreement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const terminateAgreement = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const { chargeCompensation } = req.body;
    const agreement = await deliveryService.resolveTermination(id, startup._id, !!chargeCompensation);
    res.json({
      success: true,
      message: chargeCompensation ? 'Compensation charged and contract closed.' : 'Contract closed peacefully without fees.',
      agreement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAgreementDeliveries = async (req, res) => {
  try {
    const startup = await getUserStartup(req);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Your corporate startup profile was not found.' });
    }

    const { id } = req.params;
    const deliveries = await deliveryService.getTimeline(id);
    res.json({
      success: true,
      deliveries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
