const express = require('express');
const mongoose = require('mongoose');
const Email = require('../models/Email');
const Client = require('../models/Client');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// GET /api/emails - List emails with filters
router.get('/', async (req, res) => {
  try {
    const { clientId, classification, isUnread, isImportant, isArchived, status, search, sort, page = 1, limit = 20, category, clientView } = req.query;
    const filter = {};

    const isClientView = req.user?.role === 'client' || clientView === 'true';

    // If client user is querying or clientView requested, scope strictly to client records and pending items
    if (isClientView) {
      let clientRecord = null;
      if (clientId && clientId !== 'undefined' && clientId !== 'null' && clientId !== 'all' && mongoose.Types.ObjectId.isValid(clientId)) {
        clientRecord = await Client.findById(clientId);
      }
      if (!clientRecord && req.user?.email) {
        clientRecord = await Client.findOne({
          $or: [
            { email: req.user.email.toLowerCase() },
            { assistantId: req.user._id },
            { email: 'james.richardson@techvision.com' },
            { email: 'james@techvision.com' }
          ]
        });
      }
      if (clientRecord) {
        filter.clientId = clientRecord._id;
      }

      // In client view, retrieve items requiring client decision or explicitly delegated to client
      filter.status = { $nin: ['completed', 'archived'] };
      filter.$or = [
        { 'classification.type': 'CLIENT_TO_REPLY' },
        { status: 'delegated' }
      ];
    } else if (clientId && clientId !== 'undefined' && clientId !== 'null' && clientId !== 'all' && mongoose.Types.ObjectId.isValid(clientId)) {
      filter.clientId = clientId;
    }

    if (!isClientView) {
      if (classification) filter['classification.type'] = classification;
      if (status) filter.status = status;
    }

    if (isUnread !== undefined) filter.isUnread = isUnread === 'true';
    if (isImportant === 'true') filter.isImportant = true;
    if (isArchived !== undefined) filter.isArchived = isArchived === 'true';
    else filter.isArchived = false;
    if (category) filter.category = category;
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, (c) => '\\' + c);
      const searchCriteria = [
        { subject: { $regex: escapedSearch, $options: 'i' } },
        { 'sender.name': { $regex: escapedSearch, $options: 'i' } },
        { 'sender.email': { $regex: escapedSearch, $options: 'i' } },
        { preview: { $regex: escapedSearch, $options: 'i' } },
        { 'classification.summary': { $regex: escapedSearch, $options: 'i' } },
        { 'messages.content': { $regex: escapedSearch, $options: 'i' } }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCriteria }];
        delete filter.$or;
      } else {
        filter.$or = searchCriteria;
      }
    }
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'priority') sortOption = { 'classification.priority': -1, createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [emails, total] = await Promise.all([
      Email.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit)),
      Email.countDocuments(filter)
    ]);
    res.json({ success: true, emails, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('Error fetching emails:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/emails/stats/:clientId?
router.get('/stats/:clientId?', async (req, res) => {
  try {
    const { clientId } = req.params;
    const base = { isArchived: false };
    if (clientId && clientId !== 'undefined' && clientId !== 'null' && clientId !== 'all' && mongoose.Types.ObjectId.isValid(clientId)) {
      base.clientId = clientId;
    } else if (req.user?.role === 'client') {
      const clientRecord = await Client.findOne({
        $or: [
          { email: req.user.email.toLowerCase() },
          { email: 'james.richardson@techvision.com' },
          { email: 'james@techvision.com' }
        ]
      });
      if (clientRecord) base.clientId = clientRecord._id;
    }
    const [total, unread, important, assistantToReply, clientToReply, noReplyNeeded, needsReview, actionRequired] = await Promise.all([
      Email.countDocuments(base),
      Email.countDocuments({ ...base, isUnread: true }),
      Email.countDocuments({ ...base, isImportant: true }),
      Email.countDocuments({ ...base, 'classification.type': 'ASSISTANT_TO_REPLY', status: 'active' }),
      Email.countDocuments({ ...base, 'classification.type': 'CLIENT_TO_REPLY', status: 'active' }),
      Email.countDocuments({ ...base, 'classification.type': 'NO_REPLY_NEEDED' }),
      Email.countDocuments({ ...base, 'classification.type': 'NEEDS_REVIEW' }),
      Email.countDocuments({ ...base, 'classification.actionRequired': true, status: 'active' })
    ]);
    res.json({ success: true, total, unread, important, assistantToReply, clientToReply, noReplyNeeded, needsReview, actionRequired });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/emails/:id
router.get('/:id', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/emails/:id/classify
router.put('/:id/classify', async (req, res) => {
  try {
    const { classification, reason } = req.body;
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

    email.classificationHistory.push({
      type: classification,
      confidence: 1.0,
      reason: reason || 'Manually classified',
      changedBy: 'manual',
      changedAt: new Date()
    });
    email.classification.type = classification;
    email.classification.confidence = 1.0;
    email.classification.reason = reason || 'Manually classified by assistant';
    email.classification.classifiedBy = 'manual';
    email.classification.classifiedAt = new Date();
    email.manualOverride = true;
    await email.save();

    await ActivityLog.create({
      clientId: email.clientId,
      userId: req.user._id,
      action: 'manual_classification',
      description: `Manually classified "${email.subject}" as ${classification}`,
      entityType: 'classification',
      entityId: email._id,
      metadata: { classification, reason }
    });
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/emails/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const email = await Email.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/emails/:id/important
router.put('/:id/important', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    email.isImportant = !email.isImportant;
    await email.save();
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/emails/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const email = await Email.findByIdAndUpdate(req.params.id, { isUnread: req.body.isUnread !== undefined ? req.body.isUnread : false }, { new: true });
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/emails/:id/archive
router.put('/:id/archive', async (req, res) => {
  try {
    const email = await Email.findByIdAndUpdate(req.params.id, { isArchived: true, status: 'archived' }, { new: true });
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/emails/:id/delegate
router.put('/:id/delegate', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    
    const isClient = req.user?.role === 'client';
    if (isClient) {
      email.classification.type = 'ASSISTANT_TO_REPLY';
      email.classification.reason = 'Delegated by executive client to assistant';
      email.classification.classifiedBy = 'manual';
      email.classification.classifiedAt = new Date();
      email.status = 'active';
      email.classificationHistory.push({ type: 'ASSISTANT_TO_REPLY', confidence: 1.0, reason: 'Delegated by client', changedBy: 'client', changedAt: new Date() });
      await email.save();
      await ActivityLog.create({ clientId: email.clientId, action: 'client_delegated', description: `Client delegated "${email.subject}" to assistant`, entityType: 'email', entityId: email._id });
    } else {
      email.classification.type = 'CLIENT_TO_REPLY';
      email.classification.reason = 'Delegated by assistant to executive client';
      email.classification.classifiedBy = 'manual';
      email.classification.classifiedAt = new Date();
      email.status = 'delegated';
      email.classificationHistory.push({ type: 'CLIENT_TO_REPLY', confidence: 1.0, reason: 'Delegated by assistant', changedBy: 'manual', changedAt: new Date() });
      await email.save();
      await ActivityLog.create({ clientId: email.clientId, action: 'assistant_delegated', description: `Assistant delegated "${email.subject}" to client for executive decision`, entityType: 'email', entityId: email._id });
    }
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/emails/:id/complete
router.put('/:id/complete', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    email.status = 'completed';
    email.classification.type = 'NO_REPLY_NEEDED';
    email.classification.reason = 'Marked as completed';
    email.isUnread = false;
    await email.save();
    await ActivityLog.create({ clientId: email.clientId, action: 'email_completed', description: `Marked "${email.subject}" as completed`, entityType: 'email', entityId: email._id });
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
