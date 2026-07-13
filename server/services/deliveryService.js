import Agreement from '../models/Agreement.js';
import Delivery from '../models/Delivery.js';
import Startup from '../models/Startup.js';
import Message from '../models/Message.js';
import { createNotification } from './notificationService.js';
import mongoose from 'mongoose';

// Ensure mock arrays exist
function setupMockStorage() {
  if (!global.mockAgreements) global.mockAgreements = [];
  if (!global.mockDeliveries) global.mockDeliveries = [];
  if (!global.mockMessages) global.mockMessages = [];
  if (!global.mockStartups) global.mockStartups = [];
}

const getProductIdFromCommodity = (commodityName) => {
  if (!commodityName) return '';
  const name = commodityName.trim().toLowerCase();
  const customMap = {
    'seeds': 'seeds',
    'wheat': 'wheat',
    'rice': 'rice',
    'cotton': 'cotton',
    'grains': 'grains',
    'vegetables': 'vegetables',
    'fodder': 'fodder',
    'milk': 'milk',
    'eggs': 'eggs',
    'coal': 'coal',
    'iron ore': 'iron_ore',
    'bauxite ore': 'bauxite_ore',
    'limestone': 'limestone',
    'gypsum': 'gypsum',
    'crude oil': 'crude_oil',
    'minerals': 'minerals',
    'sand': 'sand',
    'clay': 'clay',
    'shirts': 'shirts',
    'jeans': 'jeans',
    'jackets': 'jackets',
    'fabric': 'fabric',
    'bread': 'bread',
    'biscuits': 'biscuits',
    'cheese': 'cheese',
    'steel': 'steel',
    'aluminium': 'aluminium',
    'cement': 'cement',
    'bricks': 'bricks',
    'steel beams': 'steel_beams',
    'glass': 'glass',
    'silicon': 'silicon',
    'plastics': 'plastics',
    'chemicals': 'chemicals',
    'processors': 'processor',
    'processor': 'processor',
    'displays': 'display',
    'display': 'display',
    'electronic components': 'electronic_components',
    'batteries': 'battery',
    'battery': 'battery',
    'on-board computers': 'on_board_computer',
    'on_board_computer': 'on_board_computer',
    'phones': 'phones',
    'laptops': 'laptops',
    'tvs': 'tvs',
    'combustion engines': 'combustion_engine',
    'combustion_engine': 'combustion_engine',
    'cars': 'cars'
  };
  return customMap[name] || name.replace(/ /g, '_');
};

/**
 * Handles sending a delivery (Inventory Reservation)
 */
export async function sendDelivery(agreementId, sellerStartupId) {
  if (global.useMockDb) {
    setupMockStorage();
    const agreement = global.mockAgreements.find(a => String(a._id) === String(agreementId));
    if (!agreement) throw new Error('Agreement not found');
    if (agreement.status !== 'Active') throw new Error('Agreement is not active');

    // Check if there is already a pending delivery
    const hasPending = global.mockDeliveries.some(d => 
      String(d.agreementId) === String(agreementId) && d.status === 'Pending'
    );
    if (hasPending) throw new Error('A delivery cycle is already pending acceptance');

    // Check available inventory
    const seller = global.mockStartups.find(s => String(s._id) === String(sellerStartupId));
    if (!seller) throw new Error('Seller startup profile not found');

    const productId = getProductIdFromCommodity(agreement.commodity);
    const item = seller.inventory.find(i => i.productId === productId);
    const available = item ? (item.quantity || 0) : 0;

    if (available < agreement.quantity) {
      throw new Error(`Insufficient inventory: Required ${agreement.quantity}, Available ${available}`);
    }

    // Reserve stock
    item.quantity -= agreement.quantity;
    item.reserved = (item.reserved || 0) + agreement.quantity;

    // Create delivery record
    const delivery = {
      _id: 'mock-del-' + Date.now() + Math.random(),
      agreementId,
      deliveryNumber: agreement.progress + 1,
      quantity: agreement.quantity,
      status: 'Pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 real hours validity
    };
    global.mockDeliveries.push(delivery);

    // B2B chat log messages
    const partnerId = String(sellerStartupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
    global.mockMessages.push({
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: agreement.conversationId,
      senderCompany: sellerStartupId,
      receiverCompany: partnerId,
      content: `Delivery Sent (Cycle #${delivery.deliveryNumber})`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    });

    await createNotification(partnerId, `Supply delivery batch #${delivery.deliveryNumber} sent for ${agreement.commodity}.`, 'DeliverySent');
    return { delivery, agreement };
  }

  // Mongoose Flow
  const agreement = await Agreement.findById(agreementId);
  if (!agreement) throw new Error('Agreement not found');
  if (agreement.status !== 'Active') throw new Error('Agreement is not active');

  const hasPending = await Delivery.findOne({ agreementId, status: 'Pending' });
  if (hasPending) throw new Error('A delivery cycle is already pending acceptance');

  const seller = await Startup.findById(sellerStartupId);
  if (!seller) throw new Error('Seller startup profile not found');

  const productId = getProductIdFromCommodity(agreement.commodity);
  const item = seller.inventory.find(i => i.productId === productId);
  const available = item ? (item.quantity || 0) : 0;

  if (available < agreement.quantity) {
    throw new Error(`Insufficient inventory: Required ${agreement.quantity}, Available ${available}`);
  }

  // Reserve stock
  item.quantity -= agreement.quantity;
  item.reserved = (item.reserved || 0) + agreement.quantity;
  seller.markModified('inventory');
  await seller.save();

  const delivery = await Delivery.create({
    agreementId,
    deliveryNumber: agreement.progress + 1,
    quantity: agreement.quantity,
    status: 'Pending',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  const partnerId = String(sellerStartupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
  await Message.create({
    conversationId: agreement.conversationId,
    senderCompany: sellerStartupId,
    receiverCompany: partnerId,
    content: `Delivery Sent (Cycle #${delivery.deliveryNumber})`,
    type: 'Agreement Timeline',
    contractRef: agreement.contractRef,
    agreementRef: agreement._id
  });

  await createNotification(partnerId, `Supply delivery batch #${delivery.deliveryNumber} sent for ${agreement.commodity}.`, 'DeliverySent');
  return { delivery, agreement };
}

/**
 * Handles accepting a delivery (Inventory Transfer + Payment)
 */
export async function acceptDelivery(deliveryId, buyerStartupId, isAutoAccept = false) {
  if (global.useMockDb) {
    setupMockStorage();
    const delivery = global.mockDeliveries.find(d => String(d._id) === String(deliveryId));
    if (!delivery) throw new Error('Delivery not found');
    if (delivery.status !== 'Pending') throw new Error('Delivery is not pending decision');

    const agreement = global.mockAgreements.find(a => String(a._id) === String(delivery.agreementId));
    if (!agreement) throw new Error('Agreement not found');

    const buyer = global.mockStartups.find(s => String(s._id) === String(buyerStartupId));
    const seller = global.mockStartups.find(s => String(s._id) === String(agreement.seller));

    if (!buyer || !seller) throw new Error('Buyer or Seller startup profiles not found');

    // Enforce cash validation for manual accept only
    if (!isAutoAccept && buyer.currentBalance < agreement.offerValue) {
      throw new Error('Insufficient corporate funds to accept this delivery');
    }

    // Process cash transfers
    buyer.currentBalance -= agreement.offerValue;
    seller.currentBalance += agreement.offerValue;

    // Process inventory transfer: deduct reserved, add buyer stock
    const productId = getProductIdFromCommodity(agreement.commodity);
    const sellerItem = seller.inventory.find(i => i.productId === productId);
    if (sellerItem) {
      sellerItem.reserved = Math.max(0, (sellerItem.reserved || 0) - agreement.quantity);
      // Clean up item if completely empty
      if (sellerItem.quantity <= 0 && sellerItem.reserved <= 0) {
        seller.inventory = seller.inventory.filter(i => i.productId !== productId);
      }
    }

    let buyerItem = buyer.inventory.find(i => i.productId === productId);
    if (!buyerItem) {
      buyerItem = {
        productId,
        productName: agreement.commodity,
        quantity: 0,
        totalCost: 0
      };
      buyer.inventory.push(buyerItem);
    }
    buyerItem.quantity += agreement.quantity;
    buyerItem.totalCost += agreement.offerValue;

    // Update progress
    agreement.progress += 1;
    agreement.lastDeliveryAt = new Date();

    // Schedule next delivery
    const intervalMs = agreement.deliveryInterval * (
      agreement.deliveryIntervalUnit === 'Minutes' ? 60 * 1000 :
      agreement.deliveryIntervalUnit === 'Weeks' ? 7 * 24 * 60 * 60 * 1000 :
      agreement.deliveryIntervalUnit === 'Days' ? 24 * 60 * 60 * 1000 :
      60 * 60 * 1000
    );
    agreement.nextDeliveryAt = new Date(Date.now() + intervalMs);

    // Mark delivery resolved
    delivery.status = isAutoAccept ? 'AutoAccepted' : 'Accepted';
    delivery.decidedAt = new Date();

    // Check completion
    const isCompleted = agreement.progress >= agreement.duration;
    if (isCompleted) {
      agreement.status = 'Completed';
      agreement.completedAt = new Date();
    }

    // Message Logs
    global.mockMessages.push({
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: agreement.conversationId,
      senderCompany: buyerStartupId,
      receiverCompany: agreement.seller,
      content: isAutoAccept ? `Delivery Auto-Accepted (Cycle #${delivery.deliveryNumber})` : `Delivery Accepted (Cycle #${delivery.deliveryNumber})`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    });

    if (isCompleted) {
      global.mockMessages.push({
        _id: 'mock-msg-' + Date.now() + Math.random(),
        conversationId: agreement.conversationId,
        senderCompany: buyerStartupId,
        receiverCompany: agreement.seller,
        content: `Contract Completed Successfully`,
        type: 'Agreement Timeline',
        contractRef: agreement.contractRef,
        agreementRef: agreement._id,
        readStatus: 'Sent',
        createdAt: new Date()
      });
      await createNotification(agreement.buyer, `Supply agreement for ${agreement.commodity} is completed.`, 'AgreementCompleted');
      await createNotification(agreement.seller, `Supply agreement for ${agreement.commodity} is completed.`, 'AgreementCompleted');
    } else {
      await createNotification(agreement.seller, `Delivery #${delivery.deliveryNumber} accepted. Payment received.`, 'DeliveryAccepted');
    }

    return { delivery, agreement };
  }

  // Mongoose Flow
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new Error('Delivery not found');
  if (delivery.status !== 'Pending') throw new Error('Delivery is not pending decision');

  const agreement = await Agreement.findById(delivery.agreementId);
  if (!agreement) throw new Error('Agreement not found');

  const buyer = await Startup.findById(buyerStartupId);
  const seller = await Startup.findById(agreement.seller);

  if (!buyer || !seller) throw new Error('Buyer or Seller startup profiles not found');

  if (!isAutoAccept && buyer.currentBalance < agreement.offerValue) {
    throw new Error('Insufficient corporate funds to accept this delivery');
  }

  // Process cash transfers
  buyer.currentBalance -= agreement.offerValue;
  seller.currentBalance += agreement.offerValue;

  // Process inventory transfer
  const productId = getProductIdFromCommodity(agreement.commodity);
  const sellerItem = seller.inventory.find(i => i.productId === productId);
  if (sellerItem) {
    sellerItem.reserved = Math.max(0, (sellerItem.reserved || 0) - agreement.quantity);
    if (sellerItem.quantity <= 0 && sellerItem.reserved <= 0) {
      seller.inventory = seller.inventory.filter(i => i.productId !== productId);
    }
  }

  let buyerItem = buyer.inventory.find(i => i.productId === productId);
  if (!buyerItem) {
    buyerItem = {
      productId,
      productName: agreement.commodity,
      quantity: 0,
      totalCost: 0
    };
    buyer.inventory.push(buyerItem);
  }
  buyerItem.quantity += agreement.quantity;
  buyerItem.totalCost += agreement.offerValue;

  seller.markModified('inventory');
  buyer.markModified('inventory');
  await seller.save();
  await buyer.save();

  // Update progress
  agreement.progress += 1;
  agreement.lastDeliveryAt = new Date();

  // Schedule next delivery
  const intervalMs = agreement.deliveryInterval * (
    agreement.deliveryIntervalUnit === 'Minutes' ? 60 * 1000 :
    agreement.deliveryIntervalUnit === 'Weeks' ? 7 * 24 * 60 * 60 * 1000 :
    agreement.deliveryIntervalUnit === 'Days' ? 24 * 60 * 60 * 1000 :
    60 * 60 * 1000
  );
  agreement.nextDeliveryAt = new Date(Date.now() + intervalMs);

  delivery.status = isAutoAccept ? 'AutoAccepted' : 'Accepted';
  delivery.decidedAt = new Date();
  await delivery.save();

  const isCompleted = agreement.progress >= agreement.duration;
  if (isCompleted) {
    agreement.status = 'Completed';
    agreement.completedAt = new Date();
  }
  await agreement.save();

  await Message.create({
    conversationId: agreement.conversationId,
    senderCompany: buyerStartupId,
    receiverCompany: agreement.seller,
    content: isAutoAccept ? `Delivery Auto-Accepted (Cycle #${delivery.deliveryNumber})` : `Delivery Accepted (Cycle #${delivery.deliveryNumber})`,
    type: 'Agreement Timeline',
    contractRef: agreement.contractRef,
    agreementRef: agreement._id
  });

  if (isCompleted) {
    await Message.create({
      conversationId: agreement.conversationId,
      senderCompany: buyerStartupId,
      receiverCompany: agreement.seller,
      content: `Contract Completed Successfully`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id
    });
    await createNotification(agreement.buyer, `Supply agreement for ${agreement.commodity} is completed.`, 'AgreementCompleted');
    await createNotification(agreement.seller, `Supply agreement for ${agreement.commodity} is completed.`, 'AgreementCompleted');
  } else {
    await createNotification(agreement.seller, `Delivery #${delivery.deliveryNumber} accepted. Payment received.`, 'DeliveryAccepted');
  }

  return { delivery, agreement };
}

/**
 * Handles rejecting a delivery (Release reserved inventory)
 */
export async function rejectDelivery(deliveryId, buyerStartupId, reason) {
  if (global.useMockDb) {
    setupMockStorage();
    const delivery = global.mockDeliveries.find(d => String(d._id) === String(deliveryId));
    if (!delivery) throw new Error('Delivery not found');
    if (delivery.status !== 'Pending') throw new Error('Delivery is not pending decision');

    const agreement = global.mockAgreements.find(a => String(a._id) === String(delivery.agreementId));
    if (!agreement) throw new Error('Agreement not found');

    const seller = global.mockStartups.find(s => String(s._id) === String(agreement.seller));
    if (!seller) throw new Error('Seller startup profile not found');

    // Release stock back to available seller quantity
    const productId = getProductIdFromCommodity(agreement.commodity);
    const item = seller.inventory.find(i => i.productId === productId);
    if (item) {
      item.reserved = Math.max(0, (item.reserved || 0) - agreement.quantity);
      item.quantity += agreement.quantity;
    }

    delivery.status = 'Rejected';
    delivery.rejectionReason = reason;
    delivery.decidedAt = new Date();

    // B2B chat inline timeline message
    global.mockMessages.push({
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: agreement.conversationId,
      senderCompany: buyerStartupId,
      receiverCompany: agreement.seller,
      content: `Delivery Rejected: "${reason}" (Cycle #${delivery.deliveryNumber})`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    });

    await createNotification(agreement.seller, `Delivery batch #${delivery.deliveryNumber} rejected. Reason: ${reason}.`, 'DeliveryRejected');
    return { delivery, agreement };
  }

  // Mongoose Flow
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new Error('Delivery not found');
  if (delivery.status !== 'Pending') throw new Error('Delivery is not pending decision');

  const agreement = await Agreement.findById(delivery.agreementId);
  if (!agreement) throw new Error('Agreement not found');

  const seller = await Startup.findById(agreement.seller);
  if (!seller) throw new Error('Seller startup profile not found');

  const productId = getProductIdFromCommodity(agreement.commodity);
  const item = seller.inventory.find(i => i.productId === productId);
  if (item) {
    item.reserved = Math.max(0, (item.reserved || 0) - agreement.quantity);
    item.quantity += agreement.quantity;
    seller.markModified('inventory');
    await seller.save();
  }

  delivery.status = 'Rejected';
  delivery.rejectionReason = reason;
  delivery.decidedAt = new Date();
  await delivery.save();

  await Message.create({
    conversationId: agreement.conversationId,
    senderCompany: buyerStartupId,
    receiverCompany: agreement.seller,
    content: `Delivery Rejected: "${reason}" (Cycle #${delivery.deliveryNumber})`,
    type: 'Agreement Timeline',
    contractRef: agreement.contractRef,
    agreementRef: agreement._id
  });

  await createNotification(agreement.seller, `Delivery batch #${delivery.deliveryNumber} rejected. Reason: ${reason}.`, 'DeliveryRejected');
  return { delivery, agreement };
}

/**
 * Handles early retraction proposal request
 */
export async function retractAgreement(agreementId, startupId) {
  if (global.useMockDb) {
    setupMockStorage();
    const agreement = global.mockAgreements.find(a => String(a._id) === String(agreementId));
    if (!agreement) throw new Error('Agreement not found');
    if (agreement.status !== 'Active') throw new Error('Agreement is not active');

    // Calculate remaining contract value
    const remainingDeliveries = agreement.duration - agreement.progress;
    const remainingValue = remainingDeliveries * agreement.offerValue;

    agreement.status = 'Terminated';
    agreement.terminatedAt = new Date();
    agreement.terminatedBy = startupId;
    agreement.remainingContractValue = remainingValue;
    agreement.compensationStatus = 'Pending';

    // Release any pending delivery reserved stock
    const pendingDel = global.mockDeliveries.find(d => 
      String(d.agreementId) === String(agreementId) && d.status === 'Pending'
    );
    if (pendingDel) {
      pendingDel.status = 'Rejected';
      pendingDel.rejectionReason = 'Contract Retracted';
      pendingDel.decidedAt = new Date();

      const seller = global.mockStartups.find(s => String(s._id) === String(agreement.seller));
      if (seller) {
        const productId = getProductIdFromCommodity(agreement.commodity);
        const item = seller.inventory.find(i => i.productId === productId);
        if (item) {
          item.reserved = Math.max(0, (item.reserved || 0) - agreement.quantity);
          item.quantity += agreement.quantity;
        }
      }
    }

    const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
    global.mockMessages.push({
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: agreement.conversationId,
      senderCompany: startupId,
      receiverCompany: partnerId,
      content: `Contract Retracted early by partner`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    });

    await createNotification(partnerId, `Contract retracted early. Payout options pending decision.`, 'ContractRetracted');
    return agreement;
  }

  // Mongoose Flow
  const agreement = await Agreement.findById(agreementId);
  if (!agreement) throw new Error('Agreement not found');
  if (agreement.status !== 'Active') throw new Error('Agreement is not active');

  const remainingDeliveries = agreement.duration - agreement.progress;
  const remainingValue = remainingDeliveries * agreement.offerValue;

  agreement.status = 'Terminated';
  agreement.terminatedAt = new Date();
  agreement.terminatedBy = startupId;
  agreement.remainingContractValue = remainingValue;
  agreement.compensationStatus = 'Pending';

  const pendingDel = await Delivery.findOne({ agreementId, status: 'Pending' });
  if (pendingDel) {
    pendingDel.status = 'Rejected';
    pendingDel.rejectionReason = 'Contract Retracted';
    pendingDel.decidedAt = new Date();
    await pendingDel.save();

    const seller = await Startup.findById(agreement.seller);
    if (seller) {
      const productId = getProductIdFromCommodity(agreement.commodity);
      const item = seller.inventory.find(i => i.productId === productId);
      if (item) {
        item.reserved = Math.max(0, (item.reserved || 0) - agreement.quantity);
        item.quantity += agreement.quantity;
        seller.markModified('inventory');
        await seller.save();
      }
    }
  }

  await agreement.save();

  const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
  await Message.create({
    conversationId: agreement.conversationId,
    senderCompany: startupId,
    receiverCompany: partnerId,
    content: `Contract Retracted early by partner`,
    type: 'Agreement Timeline',
    contractRef: agreement.contractRef,
    agreementRef: agreement._id
  });

  await createNotification(partnerId, `Contract retracted early. Payout options pending decision.`, 'ContractRetracted');
  return agreement;
}

/**
 * Handles early termination resolution (Option 1: Close peaceful, Option 2: Charge compensation)
 */
export async function resolveTermination(agreementId, startupId, chargeCompensation = false) {
  if (global.useMockDb) {
    setupMockStorage();
    const agreement = global.mockAgreements.find(a => String(a._id) === String(agreementId));
    if (!agreement) throw new Error('Agreement not found');
    if (agreement.status !== 'Terminated') throw new Error('Agreement is not terminated');
    if (agreement.compensationStatus !== 'Pending') throw new Error('Termination already resolved');

    // Confirm resolver is NOT the initiator
    if (String(agreement.terminatedBy) === String(startupId)) {
      throw new Error('Retract initiator cannot decide termination terms');
    }

    if (chargeCompensation && agreement.remainingContractValue > 0) {
      // Calculate 50% defaults compensation
      const penalty = Math.round(agreement.remainingContractValue * 0.50);
      const payerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;

      const payer = global.mockStartups.find(s => String(s._id) === String(payerId));
      const receiver = global.mockStartups.find(s => String(s._id) === String(startupId));

      if (payer && receiver) {
        payer.currentBalance -= penalty;
        receiver.currentBalance += penalty;
      }

      agreement.compensationPaid = penalty;
      agreement.compensationStatus = 'Charged';

      const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
      global.mockMessages.push({
        _id: 'mock-msg-' + Date.now() + Math.random(),
        conversationId: agreement.conversationId,
        senderCompany: startupId,
        receiverCompany: partnerId,
        content: `Compensation Charged: ${penalty} transferred.`,
        type: 'Agreement Timeline',
        contractRef: agreement.contractRef,
        agreementRef: agreement._id,
        readStatus: 'Sent',
        createdAt: new Date()
      });

      await createNotification(partnerId, `Retraction penalty of ${penalty} charged by partner.`, 'CompensationCharged');
    } else {
      agreement.compensationStatus = 'Waived';

      const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
      global.mockMessages.push({
        _id: 'mock-msg-' + Date.now() + Math.random(),
        conversationId: agreement.conversationId,
        senderCompany: startupId,
        receiverCompany: partnerId,
        content: `Contract Closed Peacefully (No Compensation)`,
        type: 'Agreement Timeline',
        contractRef: agreement.contractRef,
        agreementRef: agreement._id,
        readStatus: 'Sent',
        createdAt: new Date()
      });
      await createNotification(partnerId, `Retraction completed peacefully without compensation fees.`, 'ContractRetracted');
    }

    agreement.updatedAt = new Date();
    return agreement;
  }

  // Mongoose Flow
  const agreement = await Agreement.findById(agreementId);
  if (!agreement) throw new Error('Agreement not found');
  if (agreement.status !== 'Terminated') throw new Error('Agreement is not terminated');
  if (agreement.compensationStatus !== 'Pending') throw new Error('Termination already resolved');

  if (String(agreement.terminatedBy) === String(startupId)) {
    throw new Error('Retract initiator cannot decide termination terms');
  }

  if (chargeCompensation && agreement.remainingContractValue > 0) {
    const penalty = Math.round(agreement.remainingContractValue * 0.50);
    const payerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;

    const payer = await Startup.findById(payerId);
    const receiver = await Startup.findById(startupId);

    if (payer && receiver) {
      payer.currentBalance -= penalty;
      receiver.currentBalance += penalty;
      await payer.save();
      await receiver.save();
    }

    agreement.compensationPaid = penalty;
    agreement.compensationStatus = 'Charged';
    await agreement.save();

    const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
    await Message.create({
      conversationId: agreement.conversationId,
      senderCompany: startupId,
      receiverCompany: partnerId,
      content: `Compensation Charged: ${penalty} transferred.`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id
    });

    await createNotification(partnerId, `Retraction penalty of ${penalty} charged by partner.`, 'CompensationCharged');
  } else {
    agreement.compensationStatus = 'Waived';
    await agreement.save();

    const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
    await Message.create({
      conversationId: agreement.conversationId,
      senderCompany: startupId,
      receiverCompany: partnerId,
      content: `Contract Closed Peacefully (No Compensation)`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id
    });
    await createNotification(partnerId, `Retraction completed peacefully without compensation fees.`, 'ContractRetracted');
  }

  return agreement;
}

/**
 * Returns deliveries history timeline
 */
export async function getTimeline(agreementId) {
  if (global.useMockDb) {
    setupMockStorage();
    return global.mockDeliveries.filter(d => String(d.agreementId) === String(agreementId));
  }
  return await Delivery.find({ agreementId }).sort({ sentAt: 1 });
}
