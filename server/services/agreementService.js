import Agreement from '../models/Agreement.js';
import Contract from '../models/Contract.js';
import Delivery from '../models/Delivery.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Startup from '../models/Startup.js';
import { createNotification } from './notificationService.js';
import mongoose from 'mongoose';

// Ensure mock arrays exist if using mock database
function setupMockStorage() {
  if (!global.mockAgreements) global.mockAgreements = [];
  if (!global.mockMessages) global.mockMessages = [];
  if (!global.mockConversations) global.mockConversations = [];
  if (!global.mockNotifications) global.mockNotifications = [];
}

/**
 * Checks for expired supply proposals and updates their status
 */
export async function checkAndExpireProposals() {
  if (global.useMockDb) {
    setupMockStorage();
    const now = new Date();
    const expiredList = global.mockAgreements.filter(a =>
      ['Pending', 'Countered'].includes(a.status) &&
      new Date(a.expiresAt) <= now
    );
    for (const agreement of expiredList) {
      agreement.status = 'Expired';
      // Notify buyer & seller
      await createNotification(agreement.buyer, `Agreement proposal for ${agreement.commodity} has expired.`, 'AgreementExpired');
      await createNotification(agreement.seller, `Agreement proposal for ${agreement.commodity} has expired.`, 'AgreementExpired');

      // Inline timeline message
      if (agreement.conversationId) {
        const sysMsg = {
          _id: 'mock-msg-' + Date.now() + Math.random(),
          conversationId: agreement.conversationId,
          senderCompany: agreement.createdBy,
          receiverCompany: String(agreement.createdBy) === String(agreement.buyer) ? agreement.seller : agreement.buyer,
          content: `Agreement proposal for ${agreement.commodity} has expired.`,
          type: 'Agreement Timeline',
          contractRef: agreement.contractRef,
          agreementRef: agreement._id,
          readStatus: 'Sent',
          createdAt: new Date()
        };
        global.mockMessages.push(sysMsg);
      }
    }
    return;
  }

  const expiredList = await Agreement.find({
    status: { $in: ['Pending', 'Countered'] },
    expiresAt: { $lte: new Date() }
  });

  for (const agreement of expiredList) {
    agreement.status = 'Expired';
    await agreement.save();

    // Create notifications
    await createNotification(agreement.buyer, `Agreement proposal for ${agreement.commodity} has expired.`, 'AgreementExpired');
    await createNotification(agreement.seller, `Agreement proposal for ${agreement.commodity} has expired.`, 'AgreementExpired');

    // Inline timeline message
    if (agreement.conversationId) {
      const partnerId = String(agreement.createdBy) === String(agreement.buyer) ? agreement.seller : agreement.buyer;
      await Message.create({
        conversationId: agreement.conversationId,
        senderCompany: agreement.createdBy,
        receiverCompany: partnerId,
        content: `Agreement proposal for ${agreement.commodity} has expired.`,
        type: 'Agreement Timeline',
        contractRef: agreement.contractRef,
        agreementRef: agreement._id
      });
    }
  }
}

/**
 * Creates/Submits a supply agreement proposal
 */
export async function submitProposal(data, createdByStartupId) {
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 real hours validity
  const groupId = data.agreementGroupId || new mongoose.Types.ObjectId();

  let deliveryIntervalUnit = data.deliveryIntervalUnit || 'Days';
  let deliveryInterval = Number(data.deliveryInterval || data.intervalValue || 1);

  if (!data.deliveryInterval) {
    if (data.intervalType === 'Weekly') {
      deliveryInterval = Number(data.intervalValue || 1) * 7;
      deliveryIntervalUnit = 'Days';
    } else if (data.intervalType === 'Hours') {
      deliveryInterval = Number(data.intervalValue || 1);
      deliveryIntervalUnit = 'Hours';
    } else if (data.intervalType === 'Minutes') {
      deliveryInterval = Number(data.intervalValue || 1);
      deliveryIntervalUnit = 'Minutes';
    } else if (data.intervalType === 'Daily' || data.intervalType === 'Daily') {
      deliveryInterval = Number(data.intervalValue || 1);
      deliveryIntervalUnit = 'Days';
    }
  }

  // Find or create conversation if not exists
  let conversationId = data.conversationId;
  const partnerId = String(createdByStartupId) === String(data.buyer) ? data.seller : data.buyer;

  if (global.useMockDb) {
    setupMockStorage();
    let conv = global.mockConversations.find(c =>
      (String(c.companyA) === String(createdByStartupId) && String(c.companyB) === String(partnerId)) ||
      (String(c.companyA) === String(partnerId) && String(c.companyB) === String(createdByStartupId))
    );
    if (!conv) {
      conv = {
        _id: 'mock-conv-' + Date.now() + Math.random(),
        companyA: createdByStartupId,
        companyB: partnerId,
        category: data.contractRef ? 'Contract Inquiry' : 'Business Inquiry',
        unreadBy: [partnerId],
        updatedAt: new Date(),
        createdAt: new Date()
      };
      global.mockConversations.push(conv);
    }
    conversationId = conv._id;

    const newAgreement = {
      _id: 'mock-agree-' + Date.now() + Math.random(),
      buyer: data.buyer,
      seller: data.seller,
      contractRef: data.contractRef,
      commodity: data.commodity,
      quantity: Number(data.quantity),
      offerValue: Number(data.offerValue),
      intervalType: data.intervalType || 'Daily',
      intervalValue: Number(data.intervalValue || 1),
      duration: Number(data.duration),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      lateDeliveryPenalty: Number(data.lateDeliveryPenalty || 0),
      earlyTerminationCompensation: Number(data.earlyTerminationCompensation || 0),
      specialNotes: data.specialNotes || '',
      version: Number(data.version || 1),
      status: 'Pending',
      createdBy: createdByStartupId,
      agreementGroupId: groupId,
      progress: 0,
      conversationId: conv._id,
      expiresAt,
      timeZone: data.timeZone || 'UTC',
      deliveryInterval: Number(deliveryInterval),
      deliveryIntervalUnit: deliveryIntervalUnit,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    global.mockAgreements.push(newAgreement);

    // Create inline proposal messages
    const proposalMsg = {
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: conv._id,
      senderCompany: createdByStartupId,
      receiverCompany: partnerId,
      content: `Agreement proposal for ${data.commodity} (${data.quantity} units) sent.`,
      type: 'Agreement Proposal',
      contractRef: data.contractRef,
      agreementRef: newAgreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    };
    global.mockMessages.push(proposalMsg);

    // Timeline update notification message
    const timelineMsg = {
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: conv._id,
      senderCompany: createdByStartupId,
      receiverCompany: partnerId,
      content: `Proposal Sent (v${newAgreement.version})`,
      type: 'Agreement Timeline',
      contractRef: data.contractRef,
      agreementRef: newAgreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    };
    global.mockMessages.push(timelineMsg);

    // Set conversation update timestamp
    conv.updatedAt = new Date();
    if (!conv.unreadBy.includes(partnerId)) {
      conv.unreadBy.push(partnerId);
    }

    // Trigger notification
    await createNotification(partnerId, `New supply agreement proposal received for ${data.commodity}.`, 'AgreementProposal');

    return newAgreement;
  }

  // Database Flow
  let conv = await Conversation.findOne({
    $or: [
      { companyA: createdByStartupId, companyB: partnerId },
      { companyA: partnerId, companyB: createdByStartupId }
    ]
  });

  if (!conv) {
    conv = await Conversation.create({
      companyA: createdByStartupId,
      companyB: partnerId,
      category: data.contractRef ? 'Contract Inquiry' : 'Business Inquiry',
      unreadBy: [partnerId]
    });
  } else {
    if (!conv.unreadBy.includes(partnerId)) {
      conv.unreadBy.push(partnerId);
    }
    conv.updatedAt = new Date();
    await conv.save();
  }
  conversationId = conv._id;

  const agreement = await Agreement.create({
    buyer: data.buyer,
    seller: data.seller,
    contractRef: data.contractRef || null,
    commodity: data.commodity,
    quantity: Number(data.quantity),
    offerValue: Number(data.offerValue),
    intervalType: data.intervalType || 'Daily',
    intervalValue: Number(data.intervalValue || 1),
    duration: Number(data.duration),
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    lateDeliveryPenalty: Number(data.lateDeliveryPenalty || 0),
    earlyTerminationCompensation: Number(data.earlyTerminationCompensation || 0),
    specialNotes: data.specialNotes || '',
    version: Number(data.version || 1),
    status: 'Pending',
    createdBy: createdByStartupId,
    agreementGroupId: groupId,
    conversationId,
    expiresAt,
    timeZone: data.timeZone || 'UTC',
    deliveryInterval: Number(deliveryInterval),
    deliveryIntervalUnit: deliveryIntervalUnit
  });

  // Post inline chat message links
  await Message.create({
    conversationId,
    senderCompany: createdByStartupId,
    receiverCompany: partnerId,
    content: `Agreement proposal for ${data.commodity} (${data.quantity} units) sent.`,
    type: 'Agreement Proposal',
    contractRef: data.contractRef || null,
    agreementRef: agreement._id
  });

  await Message.create({
    conversationId,
    senderCompany: createdByStartupId,
    receiverCompany: partnerId,
    content: `Proposal Sent (v${agreement.version})`,
    type: 'Agreement Timeline',
    contractRef: data.contractRef || null,
    agreementRef: agreement._id
  });

  // Trigger notification
  await createNotification(partnerId, `New supply agreement proposal received for ${data.commodity}.`, 'AgreementProposal');

  return agreement;
}

/**
 * Creates a counter proposal
 */
export async function counterProposal(agreementId, counterData, createdByStartupId) {
  if (global.useMockDb) {
    setupMockStorage();
    const prev = global.mockAgreements.find(a => String(a._id) === String(agreementId));
    if (!prev) throw new Error('Previous proposal version not found.');

    // Mark previous Countered
    prev.status = 'Countered';
    prev.updatedAt = new Date();

    const partnerId = String(createdByStartupId) === String(prev.buyer) ? prev.seller : prev.buyer;

    const counterProposalData = {
      buyer: prev.buyer,
      seller: prev.seller,
      contractRef: prev.contractRef,
      commodity: counterData.commodity || prev.commodity,
      quantity: Number(counterData.quantity || prev.quantity),
      offerValue: Number(counterData.offerValue || prev.offerValue),
      intervalType: counterData.intervalType || prev.intervalType,
      intervalValue: Number(counterData.intervalValue || prev.intervalValue),
      duration: Number(counterData.duration || prev.duration),
      startDate: new Date(counterData.startDate || prev.startDate),
      endDate: new Date(counterData.endDate || prev.endDate),
      lateDeliveryPenalty: Number(counterData.lateDeliveryPenalty !== undefined ? counterData.lateDeliveryPenalty : prev.lateDeliveryPenalty),
      earlyTerminationCompensation: Number(counterData.earlyTerminationCompensation !== undefined ? counterData.earlyTerminationCompensation : prev.earlyTerminationCompensation),
      specialNotes: counterData.specialNotes || prev.specialNotes,
      version: prev.version + 1,
      agreementGroupId: prev.agreementGroupId,
      conversationId: prev.conversationId
    };

    const newProposal = await submitProposal(counterProposalData, createdByStartupId);

    // Post timeline update message
    const counterMsg = {
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: prev.conversationId,
      senderCompany: createdByStartupId,
      receiverCompany: partnerId,
      content: `Counter Proposal (v${newProposal.version})`,
      type: 'Agreement Timeline',
      contractRef: prev.contractRef,
      agreementRef: newProposal._id,
      readStatus: 'Sent',
      createdAt: new Date()
    };
    global.mockMessages.push(counterMsg);

    await createNotification(partnerId, `Counter proposal received for ${newProposal.commodity}.`, 'AgreementCounter');
    return newProposal;
  }

  // Database Flow
  const prev = await Agreement.findById(agreementId);
  if (!prev) throw new Error('Previous proposal version not found.');

  prev.status = 'Countered';
  await prev.save();

  const partnerId = String(createdByStartupId) === String(prev.buyer) ? prev.seller : prev.buyer;

  const counterProposalData = {
    buyer: prev.buyer,
    seller: prev.seller,
    contractRef: prev.contractRef,
    commodity: counterData.commodity || prev.commodity,
    quantity: Number(counterData.quantity || prev.quantity),
    offerValue: Number(counterData.offerValue || prev.offerValue),
    intervalType: counterData.intervalType || prev.intervalType,
    intervalValue: Number(counterData.intervalValue || prev.intervalValue),
    duration: Number(counterData.duration || prev.duration),
    startDate: new Date(counterData.startDate || prev.startDate),
    endDate: new Date(counterData.endDate || prev.endDate),
    lateDeliveryPenalty: Number(counterData.lateDeliveryPenalty !== undefined ? counterData.lateDeliveryPenalty : prev.lateDeliveryPenalty),
    earlyTerminationCompensation: Number(counterData.earlyTerminationCompensation !== undefined ? counterData.earlyTerminationCompensation : prev.earlyTerminationCompensation),
    specialNotes: counterData.specialNotes || prev.specialNotes,
    version: prev.version + 1,
    agreementGroupId: prev.agreementGroupId,
    conversationId: prev.conversationId
  };

  const newProposal = await submitProposal(counterProposalData, createdByStartupId);

  await Message.create({
    conversationId: prev.conversationId,
    senderCompany: createdByStartupId,
    receiverCompany: partnerId,
    content: `Counter Proposal (v${newProposal.version})`,
    type: 'Agreement Timeline',
    contractRef: prev.contractRef || null,
    agreementRef: newProposal._id
  });

  await createNotification(partnerId, `Counter proposal received for ${newProposal.commodity}.`, 'AgreementCounter');
  return newProposal;
}

/**
 * Accepts a supply proposal
 */
export async function acceptAgreement(agreementId, startupId) {
  if (global.useMockDb) {
    setupMockStorage();
    const agreement = global.mockAgreements.find(a => String(a._id) === String(agreementId));
    if (!agreement) throw new Error('Agreement proposal not found.');
    if (agreement.status !== 'Pending') throw new Error('Agreement proposal is not active for acceptance.');

    agreement.status = 'Active';
    agreement.acceptedAt = new Date();
    agreement.updatedAt = new Date();

    const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;

    // Fulfill marketplace contract if linked
    if (agreement.contractRef) {
      if (!global.mockContracts) global.mockContracts = [];
      const contract = global.mockContracts.find(c => String(c._id) === String(agreement.contractRef));
      if (contract) {
        contract.status = 'Accepted';
        contract.acceptedCompany = partnerId;
        contract.agreementId = agreement._id;
        contract.updatedAt = new Date();

        // Automatically cancel all competing pending/countered proposals referencing this contract
        const competing = global.mockAgreements.filter(a =>
          String(a.contractRef) === String(agreement.contractRef) &&
          String(a._id) !== String(agreement._id) &&
          ['Pending', 'Countered'].includes(a.status)
        );

        for (const comp of competing) {
          comp.status = 'Cancelled';
          comp.updatedAt = new Date();
          // Notify competing proposer
          await createNotification(comp.createdBy, `Proposal for ${comp.commodity} cancelled because contract was accepted by another company.`, 'AgreementCancel');

          if (comp.conversationId) {
            global.mockMessages.push({
              _id: 'mock-msg-' + Date.now() + Math.random(),
              conversationId: comp.conversationId,
              senderCompany: startupId,
              receiverCompany: comp.createdBy,
              content: `Proposal Cancelled: Contract awarded to another partner.`,
              type: 'Agreement Timeline',
              contractRef: comp.contractRef,
              agreementRef: comp._id,
              readStatus: 'Sent',
              createdAt: new Date()
            });
          }
        }
      }
    }

    // Timeline messages
    global.mockMessages.push({
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: agreement.conversationId,
      senderCompany: startupId,
      receiverCompany: partnerId,
      content: `Agreement Accepted`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    });

    global.mockMessages.push({
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: agreement.conversationId,
      senderCompany: startupId,
      receiverCompany: partnerId,
      content: `Agreement Active (0 / ${agreement.duration} Deliveries)`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    });

    await createNotification(partnerId, `Agreement for supply of ${agreement.commodity} accepted. Your supply chain is now Active.`, 'AgreementAccept');
    return agreement;
  }

  // Database Flow
  const agreement = await Agreement.findById(agreementId);
  if (!agreement) throw new Error('Agreement proposal not found.');
  if (agreement.status !== 'Pending') throw new Error('Agreement proposal is not active for acceptance.');

  agreement.status = 'Active';
  agreement.acceptedAt = new Date();
  await agreement.save();

  const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;

  // Fulfill contract and cancel competing offers
  if (agreement.contractRef) {
    const contract = await Contract.findById(agreement.contractRef);
    if (contract) {
      contract.status = 'Accepted';
      contract.acceptedCompany = partnerId;
      contract.agreementId = agreement._id;
      await contract.save();

      // Find other competing proposals
      const competing = await Agreement.find({
        contractRef: agreement.contractRef,
        _id: { $ne: agreement._id },
        status: { $in: ['Pending', 'Countered'] }
      });

      for (const comp of competing) {
        comp.status = 'Cancelled';
        await comp.save();

        await createNotification(comp.createdBy, `Proposal for ${comp.commodity} cancelled because contract was accepted by another company.`, 'AgreementCancel');

        if (comp.conversationId) {
          await Message.create({
            conversationId: comp.conversationId,
            senderCompany: startupId,
            receiverCompany: comp.createdBy,
            content: `Proposal Cancelled: Contract awarded to another partner.`,
            type: 'Agreement Timeline',
            contractRef: comp.contractRef,
            agreementRef: comp._id
          });
        }
      }
    }
  }

  await Message.create({
    conversationId: agreement.conversationId,
    senderCompany: startupId,
    receiverCompany: partnerId,
    content: `Agreement Accepted`,
    type: 'Agreement Timeline',
    contractRef: agreement.contractRef || null,
    agreementRef: agreement._id
  });

  await Message.create({
    conversationId: agreement.conversationId,
    senderCompany: startupId,
    receiverCompany: partnerId,
    content: `Agreement Active (0 / ${agreement.duration} Deliveries)`,
    type: 'Agreement Timeline',
    contractRef: agreement.contractRef || null,
    agreementRef: agreement._id
  });

  await createNotification(partnerId, `Agreement for supply of ${agreement.commodity} accepted. Your supply chain is now Active.`, 'AgreementAccept');
  return agreement;
}

/**
 * Rejects a supply proposal
 */
export async function rejectAgreement(agreementId, startupId) {
  if (global.useMockDb) {
    setupMockStorage();
    const agreement = global.mockAgreements.find(a => String(a._id) === String(agreementId));
    if (!agreement) throw new Error('Agreement proposal not found.');

    agreement.status = 'Rejected';
    agreement.updatedAt = new Date();

    const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;

    global.mockMessages.push({
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: agreement.conversationId,
      senderCompany: startupId,
      receiverCompany: partnerId,
      content: `Agreement Rejected`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    });

    await createNotification(partnerId, `Agreement proposal for ${agreement.commodity} has been rejected.`, 'AgreementReject');
    return agreement;
  }

  const agreement = await Agreement.findById(agreementId);
  if (!agreement) throw new Error('Agreement proposal not found.');

  agreement.status = 'Rejected';
  await agreement.save();

  const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;

  await Message.create({
    conversationId: agreement.conversationId,
    senderCompany: startupId,
    receiverCompany: partnerId,
    content: `Agreement Rejected`,
    type: 'Agreement Timeline',
    contractRef: agreement.contractRef || null,
    agreementRef: agreement._id
  });

  await createNotification(partnerId, `Agreement proposal for ${agreement.commodity} has been rejected.`, 'AgreementReject');
  return agreement;
}

/**
 * Cancels a supply proposal
 */
export async function cancelAgreement(agreementId, startupId) {
  if (global.useMockDb) {
    setupMockStorage();
    const agreement = global.mockAgreements.find(a => String(a._id) === String(agreementId));
    if (!agreement) throw new Error('Agreement proposal not found.');

    agreement.status = 'Cancelled';
    agreement.updatedAt = new Date();

    const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;

    global.mockMessages.push({
      _id: 'mock-msg-' + Date.now() + Math.random(),
      conversationId: agreement.conversationId,
      senderCompany: startupId,
      receiverCompany: partnerId,
      content: `Agreement Cancelled`,
      type: 'Agreement Timeline',
      contractRef: agreement.contractRef,
      agreementRef: agreement._id,
      readStatus: 'Sent',
      createdAt: new Date()
    });

    await createNotification(partnerId, `Agreement proposal for ${agreement.commodity} has been cancelled.`, 'AgreementCancel');
    return agreement;
  }

  const agreement = await Agreement.findById(agreementId);
  if (!agreement) throw new Error('Agreement proposal not found.');

  agreement.status = 'Cancelled';
  await agreement.save();

  const partnerId = String(startupId) === String(agreement.buyer) ? agreement.seller : agreement.buyer;

  await Message.create({
    conversationId: agreement.conversationId,
    senderCompany: startupId,
    receiverCompany: partnerId,
    content: `Agreement Cancelled`,
    type: 'Agreement Timeline',
    contractRef: agreement.contractRef || null,
    agreementRef: agreement._id
  });

  await createNotification(partnerId, `Agreement proposal for ${agreement.commodity} has been cancelled.`, 'AgreementCancel');
  return agreement;
}

/**
 * Gets details of a specific agreement
 */
export async function getAgreementDetails(agreementId, startupId) {
  if (global.useMockDb) {
    setupMockStorage();
    const agreement = global.mockAgreements.find(a => String(a._id) === String(agreementId));
    if (!agreement) throw new Error('Agreement not found.');

    // Security Check: Only allow participants
    if (String(agreement.buyer) !== String(startupId) && String(agreement.seller) !== String(startupId)) {
      throw new Error('Access denied. You are not a participant in this agreement.');
    }

    return agreement;
  }

  const agreement = await Agreement.findById(agreementId)
    .populate('buyer', 'startupName logo country businessType')
    .populate('seller', 'startupName logo country businessType')
    .populate('contractRef');

  if (!agreement) throw new Error('Agreement not found.');

  // Security Check: Only allow participants
  const buyerId = agreement.buyer._id || agreement.buyer;
  const sellerId = agreement.seller._id || agreement.seller;

  if (String(buyerId) !== String(startupId) && String(sellerId) !== String(startupId)) {
    throw new Error('Access denied. You are not a participant in this agreement.');
  }

  return agreement;
}

/**
 * Lists agreements filtered by type/tab
 */
export async function getAgreementsList(startupId, { tab = 'Offers', search = '', page = 1, limit = 10 }) {
  // Always trigger cleanup of expired proposals first
  await checkAndExpireProposals();

  const skip = (page - 1) * limit;

  if (global.useMockDb) {
    setupMockStorage();
    let list = global.mockAgreements.filter(a =>
      String(a.buyer) === String(startupId) || String(a.seller) === String(startupId)
    );

    // Apply Tab filtering
    if (tab === 'Offers') {
      // Pending, Countered, Rejected (Incoming/Outgoing)
      list = list.filter(a => ['Pending', 'Countered', 'Rejected'].includes(a.status));
    } else if (tab === 'Active') {
      // Accepted, Active, or Terminated (if pending compensation resolution and user is the other partner)
      list = list.filter(a => 
        ['Accepted', 'Active'].includes(a.status) || 
        (a.status === 'Terminated' && a.compensationStatus === 'Pending' && String(a.terminatedBy) !== String(startupId))
      );
    } else if (tab === 'History') {
      // Completed, Cancelled, Rejected, Expired, Terminated (except if pending compensation resolution for the other partner)
      list = list.filter(a => 
        ['Completed', 'Cancelled', 'Rejected', 'Expired'].includes(a.status) ||
        (a.status === 'Terminated' && (a.compensationStatus !== 'Pending' || String(a.terminatedBy) === String(startupId)))
      );
    }

    // Apply Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.commodity.toLowerCase().includes(q));
    }

    // Pagination
    const total = list.length;
    const paginated = list.slice(skip, skip + limit);
    const agreeIds = paginated.map(a => String(a._id));
    const pendingDeliveries = (global.mockDeliveries || []).filter(d =>
      d.status === 'Pending' && agreeIds.includes(String(d.agreementId))
    );

    return {
      agreements: paginated,
      pendingDeliveries,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  // Database query
  let query = {};
  
  if (tab === 'Offers') {
    query = {
      $and: [
        { $or: [{ buyer: startupId }, { seller: startupId }] },
        { status: { $in: ['Pending', 'Countered', 'Rejected'] } }
      ]
    };
  } else if (tab === 'Active') {
    query = {
      $and: [
        { $or: [{ buyer: startupId }, { seller: startupId }] },
        {
          $or: [
            { status: { $in: ['Accepted', 'Active'] } },
            { status: 'Terminated', compensationStatus: 'Pending', terminatedBy: { $ne: new mongoose.Types.ObjectId(startupId) } }
          ]
        }
      ]
    };
  } else if (tab === 'History') {
    query = {
      $and: [
        { $or: [{ buyer: startupId }, { seller: startupId }] },
        {
          $or: [
            { status: { $in: ['Completed', 'Cancelled', 'Rejected', 'Expired'] } },
            { status: 'Terminated', compensationStatus: { $ne: 'Pending' } },
            { status: 'Terminated', terminatedBy: new mongoose.Types.ObjectId(startupId) }
          ]
        }
      ]
    };
  }

  if (search) {
    query.commodity = { $regex: search, $options: 'i' };
  }

  const total = await Agreement.countDocuments(query);
  const agreements = await Agreement.find(query)
    .populate('buyer', 'startupName logo country businessType')
    .populate('seller', 'startupName logo country businessType')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  const agreeIds = agreements.map(a => a._id);
  const pendingDeliveries = await Delivery.find({
    agreementId: { $in: agreeIds },
    status: 'Pending'
  });

  return {
    agreements,
    pendingDeliveries,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}
