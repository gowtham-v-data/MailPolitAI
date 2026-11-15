const express = require('express');
const EmailAccount = require('../models/EmailAccount');
const Client = require('../models/Client');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');
const { getIntegrationsStatus, syncProvider } = require('../services/integrationService');
const router = express.Router();

router.use(authenticate);

// GET /api/accounts/integrations-status
router.get('/integrations-status', async (req, res) => {
  try {
    const status = await getIntegrationsStatus(req.query.clientId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/sync-provider
router.post('/sync-provider', async (req, res) => {
  try {
    const { provider, clientId } = req.body;
    const result = await syncProvider(provider, clientId, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/connect
router.post('/connect', async (req, res) => {
  try {
    const { clientId, provider, email } = req.body;
    const account = await EmailAccount.create({
      clientId,
      provider,
      email,
      displayName: email,
      status: 'connected',
      lastSync: new Date(),
      connectedAt: new Date()
    });
    // Also add to client's connectedAccounts
    await Client.findByIdAndUpdate(clientId, {
      $push: { connectedAccounts: { provider, email, status: 'connected', lastSync: new Date(), connectedAt: new Date() } }
    });
    await ActivityLog.create({
      clientId,
      userId: req.user._id,
      action: 'account_connected',
      description: `Connected ${provider.toUpperCase()} account: ${email}`,
      entityType: 'account',
      entityId: account._id
    });
    res.status(201).json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/accounts/:clientId
router.get('/:clientId', async (req, res) => {
  try {
    const accounts = await EmailAccount.find({ clientId: req.params.clientId });
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/accounts/:id/sync
router.put('/:id/sync', async (req, res) => {
  try {
    const account = await EmailAccount.findByIdAndUpdate(
      req.params.id,
      { lastSync: new Date(), status: 'connected' },
      { new: true }
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, account, message: 'Sync completed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/accounts/:id
router.delete('/:id', async (req, res) => {
  try {
    const account = await EmailAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, message: 'Account disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
