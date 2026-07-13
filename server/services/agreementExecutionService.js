import Agreement from '../models/Agreement.js';
import Delivery from '../models/Delivery.js';
import Message from '../models/Message.js';
import { acceptDelivery } from './deliveryService.js';
import { createNotification } from './notificationService.js';

// Setup mock helper
function setupMockStorage() {
  if (!global.mockAgreements) global.mockAgreements = [];
  if (!global.mockDeliveries) global.mockDeliveries = [];
  if (!global.mockMessages) global.mockMessages = [];
}

/**
 * Main evaluation routine called periodically by the execution scheduler
 */
export async function evaluateAll() {
  try {
    await processAutomaticAcceptances();
    await evaluateActiveCycles();
  } catch (error) {
    console.error('Error in supply agreements execution cycle:', error);
  }
}

/**
 * Automatically accepts deliveries that exceed the 24-hour limit
 */
async function processAutomaticAcceptances() {
  const now = new Date();

  if (global.useMockDb) {
    setupMockStorage();
    const expiredDeliveries = global.mockDeliveries.filter(d => 
      d.status === 'Pending' && 
      new Date(d.expiresAt) <= now
    );

    for (const delivery of expiredDeliveries) {
      const agreement = global.mockAgreements.find(a => String(a._id) === String(delivery.agreementId));
      if (agreement) {
        try {
          await acceptDelivery(delivery._id, agreement.buyer, true);
        } catch (err) {
          console.error(`Mock automatic acceptance failed for delivery ${delivery._id}:`, err);
        }
      }
    }
    return;
  }

  // Mongoose Flow
  const expiredDeliveries = await Delivery.find({
    status: 'Pending',
    expiresAt: { $lte: now }
  });

  for (const delivery of expiredDeliveries) {
    const agreement = await Agreement.findById(delivery.agreementId);
    if (agreement) {
      try {
        await acceptDelivery(delivery._id, agreement.buyer, true);
      } catch (err) {
        console.error(`Automatic acceptance failed for delivery ${delivery._id}:`, err);
      }
    }
  }
}

/**
 * Evaluates active contracts, opens delivery cycle windows
 */
async function evaluateActiveCycles() {
  const now = new Date();

  if (global.useMockDb) {
    setupMockStorage();
    const activeAgreements = global.mockAgreements.filter(a => a.status === 'Active');

    for (const agreement of activeAgreements) {
      // Initialize nextDeliveryAt if not present
      if (!agreement.nextDeliveryAt) {
        agreement.nextDeliveryAt = new Date();
      }

      if (new Date(agreement.nextDeliveryAt) <= now) {
        // Check if there is an active pending delivery
        const hasPending = global.mockDeliveries.some(d => 
          String(d.agreementId) === String(agreement._id) && d.status === 'Pending'
        );

        if (!hasPending) {
          const currentCycle = agreement.progress + 1;
          const label = `Delivery Window Opened (Cycle #${currentCycle})`;

          // Prevent spamming duplicate timeline logs
          const lastMsg = [...global.mockMessages].reverse().find(m => 
            String(m.agreementRef) === String(agreement._id) && 
            m.type === 'Agreement Timeline'
          );

          if (!lastMsg || !lastMsg.content.includes(label)) {
            global.mockMessages.push({
              _id: 'mock-msg-' + Date.now() + Math.random(),
              conversationId: agreement.conversationId,
              senderCompany: agreement.seller,
              receiverCompany: agreement.buyer,
              content: label,
              type: 'Agreement Timeline',
              contractRef: agreement.contractRef,
              agreementRef: agreement._id,
              readStatus: 'Sent',
              createdAt: new Date()
            });

            await createNotification(agreement.seller, `Delivery window opened for cycle #${currentCycle} under ${agreement.commodity} agreement.`, 'DeliveryWindowOpened');
            agreement.updatedAt = new Date();
          }
        }
      }
    }
    return;
  }

  // Mongoose Flow
  const activeAgreements = await Agreement.find({ status: 'Active' });

  for (const agreement of activeAgreements) {
    if (!agreement.nextDeliveryAt) {
      agreement.nextDeliveryAt = new Date();
      await agreement.save();
    }

    if (agreement.nextDeliveryAt <= now) {
      const hasPending = await Delivery.findOne({ agreementId: agreement._id, status: 'Pending' });

      if (!hasPending) {
        const currentCycle = agreement.progress + 1;
        const label = `Delivery Window Opened (Cycle #${currentCycle})`;

        const lastMsg = await Message.findOne({
          agreementRef: agreement._id,
          type: 'Agreement Timeline'
        }).sort({ createdAt: -1 });

        if (!lastMsg || !lastMsg.content.includes(label)) {
          await Message.create({
            conversationId: agreement.conversationId,
            senderCompany: agreement.seller,
            receiverCompany: agreement.buyer,
            content: label,
            type: 'Agreement Timeline',
            contractRef: agreement.contractRef || null,
            agreementRef: agreement._id
          });

          await createNotification(agreement.seller, `Delivery window opened for cycle #${currentCycle} under ${agreement.commodity} agreement.`, 'DeliveryWindowOpened');
        }
      }
    }
  }
}
