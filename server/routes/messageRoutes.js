import express from 'express';
import {
  startConversation,
  getConversations,
  getMessages,
  postMessage,
  markAsRead,
  getUnreadCount,
  getUnreadWithCompany
} from '../controllers/messageController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Conversation endpoints
router.post('/conversations', protect, startConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, postMessage);
router.post('/conversations/:id/read', protect, markAsRead);

// Notifications status endpoints
router.get('/unread-count', protect, getUnreadCount);
router.get('/unread-with/:companyId', protect, getUnreadWithCompany);

export default router;
