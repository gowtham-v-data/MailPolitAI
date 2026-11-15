const express = require('express');
const Email = require('../models/Email');
const Meeting = require('../models/Meeting');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// GET /api/dashboard/stats/:clientId?
router.get('/stats/:clientId?', async (req, res) => {
  try {
    const { clientId } = req.params;
    const mongoose = require('mongoose');
    const base = { isArchived: false };
    if (clientId && clientId !== 'undefined' && mongoose.Types.ObjectId.isValid(clientId)) {
      base.clientId = clientId;
    }

    const [totalEmails, unreadEmails, importantEmails, assistantToReply, clientToReply, noReplyNeeded, needsReview, actionRequired, waitingForResponse, completedToday] = await Promise.all([
      Email.countDocuments(base),
      Email.countDocuments({ ...base, isUnread: true }),
      Email.countDocuments({ ...base, isImportant: true }),
      Email.countDocuments({ ...base, 'classification.type': 'ASSISTANT_TO_REPLY', status: 'active' }),
      Email.countDocuments({ ...base, 'classification.type': 'CLIENT_TO_REPLY', status: 'active' }),
      Email.countDocuments({ ...base, 'classification.type': 'NO_REPLY_NEEDED' }),
      Email.countDocuments({ ...base, 'classification.type': 'NEEDS_REVIEW' }),
      Email.countDocuments({ ...base, 'classification.actionRequired': true, status: 'active' }),
      Email.countDocuments({ ...base, status: 'active', 'classification.type': { $in: ['ASSISTANT_TO_REPLY', 'CLIENT_TO_REPLY'] } }),
      Email.countDocuments({ ...base, status: 'completed', updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
    ]);

    const classificationBreakdown = {
      ASSISTANT_TO_REPLY: assistantToReply,
      CLIENT_TO_REPLY: clientToReply,
      NO_REPLY_NEEDED: noReplyNeeded,
      NEEDS_REVIEW: needsReview
    };

    const activityFilter = base.clientId ? { clientId: base.clientId } : {};
    const recentActivity = await ActivityLog.find(activityFilter).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      totalEmails, unreadEmails, importantEmails,
      assistantToReply, clientToReply, noReplyNeeded, needsReview,
      actionRequired, waitingForResponse, completedToday,
      classificationBreakdown, recentActivity
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/recent/:clientId?
router.get('/recent/:clientId?', async (req, res) => {
  try {
    const { clientId } = req.params;
    const mongoose = require('mongoose');
    const filter = { isArchived: false };
    if (clientId && clientId !== 'undefined' && mongoose.Types.ObjectId.isValid(clientId)) {
      filter.clientId = clientId;
    }
    const emails = await Email.find(filter)
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, emails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
