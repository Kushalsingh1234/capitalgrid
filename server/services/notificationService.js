import Notification from '../models/Notification.js';

export const formatCurrency = (amount, country = 'India') => {
  const symbols = {
    'India': '₹',
    'United States': '$',
    'United Kingdom': '£',
    'Germany': '€',
    'Japan': '¥',
    'Brazil': 'R$',
    'Australia': 'A$'
  };
  const sym = symbols[country] || '$';
  return `${sym}${Math.round(Math.abs(amount)).toLocaleString()}`;
};

export const createNotification = async (startupId, text, type, amount = 0) => {
  try {
    if (global.useMockDb) {
      if (!global.mockNotifications) {
        global.mockNotifications = [];
      }
      const notif = {
        _id: 'mock-notif-' + Date.now() + Math.random(),
        startupId,
        text,
        type,
        amount,
        isRead: false,
        createdAt: new Date()
      };
      global.mockNotifications.push(notif);
      return notif;
    } else {
      const notif = await Notification.create({
        startupId,
        text,
        type,
        amount
      });
      return notif;
    }
  } catch (err) {
    console.error(`[Notification Service] Failed to create notification: ${err.message}`);
  }
};
