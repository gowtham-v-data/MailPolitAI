const express = require('express');
const Email = require('../models/Email');
const Meeting = require('../models/Meeting');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// GET /api/dashboard/stats/:clientId
router.get('/stats/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const base = { clientId, isArchived: false };

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

    const recentActivity = await ActivityLog.find({ clientId }).sort({ createdAt: -1 }).limit(10);

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

// GET /api/dashboard/recent/:clientId
router.get('/recent/:clientId', async (req, res) => {
  try {
    const emails = await Email.find({ clientId: req.params.clientId, isArchived: false })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, emails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
