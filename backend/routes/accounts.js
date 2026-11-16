const express = require('express');
const EmailAccount = require('../models/EmailAccount');
const Client = require('../models/Client');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');
const { getIntegrationsStatus, syncProvider } = require('../services/integrationService');
const router = express.Router();

// ─── PUBLIC GOOGLE OAUTH ROUTES (no Bearer token required for OAuth redirects) ───

// GET /api/accounts/google/auth - Redirects user to Google OAuth consent screen
router.get('/google/auth', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/accounts/google/callback';
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ].join(' ');

  const state = req.query.clientId && req.query.clientId !== 'all' ? req.query.clientId : '';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

  res.redirect(authUrl);
});

// GET /api/accounts/google/callback - Receives authorization code from Google
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(`http://localhost:5173/settings?oauth=error&message=${encodeURIComponent(error)}`);
    }
    if (!code) {
      return res.redirect('http://localhost:5173/settings?oauth=error&message=No+code+provided');
    }

    // Exchange code for access & refresh tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/accounts/google/callback',
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to exchange code for tokens:', tokenData);
      return res.redirect(`http://localhost:5173/settings?oauth=error&message=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`);
    }

    // Fetch user info from Google
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userinfoResponse.json();
    const userEmail = (userInfo.email || '').toLowerCase();
    const displayName = userInfo.name || userEmail;

    // Determine target client
    const mongoose = require('mongoose');
    let targetClientId = state;
    if (!targetClientId || targetClientId === 'all' || !mongoose.Types.ObjectId.isValid(targetClientId)) {
      const defaultClient = await Client.findOne({ status: 'active' });
      if (defaultClient) targetClientId = defaultClient._id;
    }

    if (targetClientId) {
      // Upsert EmailAccount
      let account = await EmailAccount.findOne({ clientId: targetClientId, provider: 'gmail' });
      if (account) {
        account.email = userEmail;
        account.displayName = displayName;
        account.status = 'connected';
        account.lastSync = new Date();
        await account.save();
      } else {
        account = await EmailAccount.create({
          clientId: targetClientId,
          provider: 'gmail',
          email: userEmail,
          displayName,
          status: 'connected',
          lastSync: new Date(),
          connectedAt: new Date()
        });
      }

      // Update Client's connectedAccounts
      await Client.findByIdAndUpdate(targetClientId, {
        $pull: { connectedAccounts: { provider: 'gmail' } }
      });
      await Client.findByIdAndUpdate(targetClientId, {
        $push: {
          connectedAccounts: {
            provider: 'gmail',
            email: userEmail,
            status: 'connected',
            lastSync: new Date(),
            connectedAt: new Date()
          }
        }
      });

      await ActivityLog.create({
        clientId: targetClientId,
        action: 'account_connected',
        description: `Successfully authorized Gmail API OAuth2 for: ${userEmail}`,
        entityType: 'account',
        entityId: account._id
      });
    }

    res.redirect(`http://localhost:5173/settings?oauth=google_success&email=${encodeURIComponent(userEmail)}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`http://localhost:5173/settings?oauth=error&message=${encodeURIComponent(err.message)}`);
  }
});

// ─── AUTHENTICATED ROUTES (Require JWT) ───
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
    const { clientId } = req.params;
    const filter = {};
    if (clientId && clientId !== 'all' && clientId !== 'undefined' && mongoose.Types.ObjectId.isValid(clientId)) {
      filter.clientId = clientId;
    }
    const accounts = await EmailAccount.find(filter);
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
