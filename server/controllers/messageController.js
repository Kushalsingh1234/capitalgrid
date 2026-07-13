import * as messageService from '../services/messageService.js';
import Startup from '../models/Startup.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// Helper to get startup of currently logged in user
const getMyStartup = async (req) => {
  const userId = req.user._id || req.user.id;
  let startup;
  if (global.useMockDb) {
    startup = global.mockStartups.find(s => String(s.owner) === String(userId));
  } else {
    startup = await Startup.findOne({ owner: userId });
  }
  return startup;
};

/**
 * Start or retrieve a conversation
 */
export const startConversation = async (req, res) => {
  try {
    const myStartup = await getMyStartup(req);
    if (!myStartup) {
      return res.status(400).json({ success: false, message: 'Startup company profile not registered yet.' });
    }

    const { targetCompanyId, category } = req.body;
    if (!targetCompanyId) {
      return res.status(400).json({ success: false, message: 'Target company ID is required.' });
    }

    const conversation = await messageService.startOrReuseConversation({
      myCompanyId: myStartup._id,
      targetCompanyId,
      category
    });

    res.status(200).json({ success: true, conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * List all conversations with target details and unread counts
 */
export const getConversations = async (req, res) => {
  try {
    const myStartup = await getMyStartup(req);
    if (!myStartup) {
      return res.status(200).json({ success: true, conversations: [] });
    }

    const search = req.query.search || '';
    const conversations = await messageService.listConversations(myStartup._id, search);

    res.status(200).json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Fetch messages list for a conversation
 */
export const getMessages = async (req, res) => {
  try {
    const myStartup = await getMyStartup(req);
    if (!myStartup) {
      return res.status(400).json({ success: false, message: 'Startup company profile not registered yet.' });
    }

    const conversationId = req.params.id;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Verify user's company is part of the conversation
    const isMember = String(conversation.companyA) === String(myStartup._id) || 
                     String(conversation.companyB) === String(myStartup._id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation.' });
    }

    // Fetch messages populated with contract details if referenced
    const messages = await Message.find({ conversationId })
      .populate('contractRef')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Send a message inside a conversation
 */
export const postMessage = async (req, res) => {
  try {
    const myStartup = await getMyStartup(req);
    if (!myStartup) {
      return res.status(400).json({ success: false, message: 'Startup company profile not registered yet.' });
    }

    const conversationId = req.params.id;
    const { content, type, contractRef } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const message = await messageService.postMessage({
      conversationId,
      senderCompanyId: myStartup._id,
      content,
      type,
      contractRef
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Mark messages in a conversation as read
 */
export const markAsRead = async (req, res) => {
  try {
    const myStartup = await getMyStartup(req);
    if (!myStartup) {
      return res.status(400).json({ success: false, message: 'Startup company profile not registered.' });
    }

    const result = await messageService.markConversationAsRead(req.params.id, myStartup._id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get total unread conversations count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const myStartup = await getMyStartup(req);
    if (!myStartup) {
      return res.status(200).json({ success: true, count: 0 });
    }

    const count = await messageService.getUnreadCount(myStartup._id);
    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Check unread conversations count with specific company ID
 */
export const getUnreadWithCompany = async (req, res) => {
  try {
    const myStartup = await getMyStartup(req);
    if (!myStartup) {
      return res.status(200).json({ success: true, unread: false });
    }

    const unread = await messageService.getUnreadWithCompany(myStartup._id, req.params.companyId);
    res.status(200).json({ success: true, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
