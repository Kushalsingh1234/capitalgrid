import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Startup from '../models/Startup.js';

/**
 * Start or reuse an existing conversation between two companies
 */
export async function startOrReuseConversation({ myCompanyId, targetCompanyId, category }) {
  if (String(myCompanyId) === String(targetCompanyId)) {
    throw new Error('Cannot start a B2B conversation with your own company.');
  }

  // Verify target startup exists
  const targetStartup = await Startup.findById(targetCompanyId);
  if (!targetStartup) {
    throw new Error('Target company not found.');
  }

  // Find if conversation already exists (either companyA = myCompanyId & companyB = targetCompanyId OR vice versa)
  let conversation = await Conversation.findOne({
    $or: [
      { companyA: myCompanyId, companyB: targetCompanyId },
      { companyA: targetCompanyId, companyB: myCompanyId }
    ]
  });

  if (conversation) {
    // Reuse it, but update category if a new origin is specified and update updatedAt timestamp
    if (category && conversation.category !== category) {
      conversation.category = category;
    }
    conversation.updatedAt = new Date();
    await conversation.save();
  } else {
    // Create new conversation
    conversation = new Conversation({
      companyA: myCompanyId,
      companyB: targetCompanyId,
      category: category || 'Business Inquiry',
      unreadBy: [],
      updatedAt: new Date()
    });
    await conversation.save();
  }

  return conversation;
}

/**
 * List conversations for a company
 */
export async function listConversations(myCompanyId, searchQuery = '') {
  // Find all conversations containing myCompanyId
  let query = Conversation.find({
    $or: [
      { companyA: myCompanyId },
      { companyB: myCompanyId }
    ]
  })
    .populate('companyA', 'startupName logo country businessType companyValuation')
    .populate('companyB', 'startupName logo country businessType companyValuation')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  let conversations = await query;

  // Filter in-memory if search query is provided
  if (searchQuery) {
    const cleanSearch = searchQuery.toLowerCase().trim();
    conversations = conversations.filter(c => {
      const target = String(c.companyA._id) === String(myCompanyId) ? c.companyB : c.companyA;
      return target && target.startupName && target.startupName.toLowerCase().includes(cleanSearch);
    });
  }

  return conversations;
}

/**
 * Post a new message inside a conversation
 */
export async function postMessage({ conversationId, senderCompanyId, content, type, contractRef }) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }

  // Determine receiver company
  const receiverCompanyId = String(conversation.companyA) === String(senderCompanyId) 
    ? conversation.companyB 
    : conversation.companyA;

  // Create message
  const message = new Message({
    conversationId,
    senderCompany: senderCompanyId,
    receiverCompany: receiverCompanyId,
    type: type || 'Text',
    content,
    contractRef: contractRef || null,
    readStatus: 'Sent'
  });
  await message.save();

  // Update conversation lastMessage reference, unreadBy lists, and update timestamp
  conversation.lastMessage = message._id;
  conversation.updatedAt = new Date();

  // Add receiver to unread list if not already there
  if (!conversation.unreadBy.includes(receiverCompanyId)) {
    conversation.unreadBy.push(receiverCompanyId);
  }

  await conversation.save();
  return message;
}

/**
 * Mark all messages in a conversation as read by the viewing company
 */
export async function markConversationAsRead(conversationId, myCompanyId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }

  // Remove my company from unreadBy list
  conversation.unreadBy = conversation.unreadBy.filter(id => String(id) !== String(myCompanyId));
  await conversation.save();

  // Update readStatus for messages sent to me in this conversation to 'Read'
  await Message.updateMany(
    { conversationId, receiverCompany: myCompanyId, readStatus: { $ne: 'Read' } },
    { $set: { readStatus: 'Read' } }
  );

  return { success: true };
}

/**
 * Get total unread conversations count for a company
 */
export async function getUnreadCount(myCompanyId) {
  const count = await Conversation.countDocuments({
    $or: [
      { companyA: myCompanyId },
      { companyB: myCompanyId }
    ],
    unreadBy: myCompanyId
  });
  return count;
}

/**
 * Get unread conversation status with a specific target company
 */
export async function getUnreadWithCompany(myCompanyId, targetCompanyId) {
  const conversation = await Conversation.findOne({
    $or: [
      { companyA: myCompanyId, companyB: targetCompanyId },
      { companyA: targetCompanyId, companyB: myCompanyId }
    ],
    unreadBy: myCompanyId
  });
  return !!conversation;
}
