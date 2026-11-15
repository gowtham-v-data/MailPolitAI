const express = require('express');
const { authenticate } = require('../middleware/auth');
const aiAssistant = require('../services/aiAssistant');
const Email = require('../models/Email');
const router = express.Router();

router.use(authenticate);

// POST /api/ai/classify/:emailId
router.post('/classify/:emailId', async (req, res) => {
  try {
    const result = await aiAssistant.classifyAndPersist(req.params.emailId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/classify-all/:clientId
router.post('/classify-all/:clientId', async (req, res) => {
  try {
    const result = await aiAssistant.classifyAllForClient(req.params.clientId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/summarize/:emailId
router.post('/summarize/:emailId', async (req, res) => {
  try {
    const summary = await aiAssistant.summarizeEmail(req.params.emailId);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/draft-reply/:emailId
router.post('/draft-reply/:emailId', async (req, res) => {
  try {
    const { tone } = req.body;
    const draft = await aiAssistant.createDraftReply(req.params.emailId, tone || 'professional');
    res.json({ success: true, draft });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, clientId, emailId } = req.body;
    const context = { clientId, emailId };
    if (emailId) {
      const email = await Email.findById(emailId);
      if (email) {
        context.emailStatus = email.status;
        context.classificationType = email.classification?.type;
      }
    }
    const result = await aiAssistant.chat(message, context);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ai/insights/:clientId
router.get('/insights/:clientId', async (req, res) => {
  try {
    const insights = await aiAssistant.getClientInsights(req.params.clientId);
    res.json({ success: true, ...insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
