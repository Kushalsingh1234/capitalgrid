import Startup from '../models/Startup.js';
import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(200).json({ success: true, notifications: [] });
    }

    let notifs = [];
    if (global.useMockDb) {
      notifs = (global.mockNotifications || [])
        .filter(n => String(n.startupId) === String(startup._id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      notifs = await Notification.find({ startupId: startup._id })
        .sort({ createdAt: -1 });
    }

    res.status(200).json({ success: true, notifications: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(200).json({ success: true });
    }

    if (global.useMockDb) {
      if (global.mockNotifications) {
        global.mockNotifications.forEach(n => {
          if (String(n.startupId) === String(startup._id)) {
            n.isRead = true;
          }
        });
      }
    } else {
      await Notification.updateMany({ startupId: startup._id }, { isRead: true });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
