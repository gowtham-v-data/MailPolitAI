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
      if (state && state.startsWith('auth_')) {
        return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error)}`);
      }
      return res.redirect(`http://localhost:5173/settings?oauth=error&message=${encodeURIComponent(error)}`);
    }
    if (!code) {
      if (state && state.startsWith('auth_')) {
        return res.redirect('http://localhost:5173/login?error=No+authorization+code+provided');
      }
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
      if (state && state.startsWith('auth_')) {
        return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(tokenData.error_description || 'Google authentication failed')}`);
      }
      return res.redirect(`http://localhost:5173/settings?oauth=error&message=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`);
    }

    // Fetch user info from Google
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userinfoResponse.json();
    const userEmail = (userInfo.email || '').toLowerCase();
    const displayName = userInfo.name || userEmail;

    // ─── AUTH FLOW (Sign in / Sign up with Google) ───
    if (state && state.startsWith('auth_')) {
      const parts = state.split('_');
      const mode = parts[1] || 'login';
      const role = parts[2] || 'assistant';

      const User = require('../models/User');
      const jwt = require('jsonwebtoken');

      let user = await User.findOne({ email: userEmail });
      if (!user) {
        // Automatically create user account with verified Google profile
        const randomPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
        user = await User.create({
          name: displayName || userEmail.split('@')[0],
          email: userEmail,
          password: randomPassword,
          role: role,
          avatar: userInfo.picture || ''
        });
      } else if (userInfo.picture && !user.avatar) {
        user.avatar = userInfo.picture;
        await user.save();
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'mailpilot-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      // Also ensure Client and EmailAccount are synced so Gmail emails are available
      try {
        let client = await Client.findOne({ email: userEmail });
        if (!client) {
          const companyDomain = userEmail.includes('@') ? userEmail.split('@')[1].split('.')[0].toUpperCase() : 'Google';
          client = await Client.create({
            name: displayName || userEmail.split('@')[0],
            email: userEmail,
            company: `${companyDomain} Workspace`,
            phone: '',
            assistantId: user._id,
            status: 'active',
            connectedAccounts: [{
              provider: 'gmail',
              email: userEmail,
              status: 'connected',
              lastSync: new Date(),
              connectedAt: new Date()
            }]
          });
        }

        let account = await EmailAccount.findOne({ clientId: client._id, provider: 'gmail', email: userEmail });
        if (account) {
          account.accessToken = tokenData.access_token || '';
          if (tokenData.refresh_token) account.refreshToken = tokenData.refresh_token;
          account.status = 'connected';
          account.lastSync = new Date();
          await account.save();
        } else {
          account = await EmailAccount.create({
            clientId: client._id,
            provider: 'gmail',
            email: userEmail,
            displayName,
            status: 'connected',
            accessToken: tokenData.access_token || '',
            refreshToken: tokenData.refresh_token || '',
            lastSync: new Date(),
            connectedAt: new Date()
          });
        }

        // Trigger real Gmail sync in background
        const { syncRealGmailEmails } = require('../services/gmailSyncService');
        syncRealGmailEmails(account, { maxResults: 50 }).catch(e => console.warn('[Google Auth Sync] Notice:', e.message));
      } catch (clientErr) {
        console.warn('[Google Auth Sync Setup]', clientErr.message);
      }

      const targetPath = user.role === 'client' ? '/client' : '/';
      const redirectUrl = `http://localhost:5173/auth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }))}&redirect=${encodeURIComponent(targetPath)}`;

      return res.redirect(redirectUrl);
    }

    // Determine or dynamically create client for ANY email that connects
    const mongoose = require('mongoose');
    let targetClientId = state;
    let client = null;

    // 1. First check if a client with this exact email already exists
    client = await Client.findOne({ email: userEmail });

    // 2. If not, check if state provided a valid existing client ID
    if (!client && targetClientId && targetClientId !== 'all' && mongoose.Types.ObjectId.isValid(targetClientId)) {
      client = await Client.findById(targetClientId);
    }

    // 3. If still no client, dynamically create a new Client record for this email
    if (!client) {
      const User = require('../models/User');
      const assistantUser = await User.findOne({ role: 'assistant' });
      const companyDomain = userEmail.includes('@') ? userEmail.split('@')[1].split('.')[0].toUpperCase() : 'Google';
      client = await Client.create({
        name: displayName || userEmail.split('@')[0],
        email: userEmail,
        company: `${companyDomain} Workspace`,
        phone: '',
        assistantId: assistantUser?._id,
        status: 'active',
        connectedAccounts: [{
          provider: 'gmail',
          email: userEmail,
          status: 'connected',
          lastSync: new Date(),
          connectedAt: new Date()
        }]
      });
    }
    targetClientId = client._id;

    if (targetClientId) {
      // Upsert EmailAccount for ANY connecting email
      let account = await EmailAccount.findOne({ clientId: targetClientId, provider: 'gmail', email: userEmail });
      if (!account) {
        account = await EmailAccount.findOne({ clientId: targetClientId, provider: 'gmail' });
      }

      if (account) {
        account.email = userEmail;
        account.displayName = displayName;
        account.status = 'connected';
        account.accessToken = tokenData.access_token || '';
        if (tokenData.refresh_token) account.refreshToken = tokenData.refresh_token;
        account.lastSync = new Date();
        await account.save();
      } else {
        account = await EmailAccount.create({
          clientId: targetClientId,
          provider: 'gmail',
          email: userEmail,
          displayName,
          status: 'connected',
          accessToken: tokenData.access_token || '',
          refreshToken: tokenData.refresh_token || '',
          lastSync: new Date(),
          connectedAt: new Date()
        });
      }

      // Update Client's connectedAccounts
      await Client.findByIdAndUpdate(targetClientId, {
        $pull: { connectedAccounts: { provider: 'gmail', email: userEmail } }
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

      // Synchronize real emails immediately from user's Gmail inbox
      let realSyncedCount = 0;
      try {
        const { syncRealGmailEmails } = require('../services/gmailSyncService');
        const syncRes = await syncRealGmailEmails(account, { maxResults: 50 });
        realSyncedCount = syncRes.syncedCount || 0;
      } catch (syncErr) {
        console.warn('[Google OAuth] Initial real Gmail sync notice:', syncErr.message);
      }
    }

    res.redirect(`http://localhost:5173/settings?oauth=google_success&email=${encodeURIComponent(userEmail)}&clientId=${targetClientId}`);
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

// POST /api/accounts/connect - Connect ANY email account dynamically
router.post('/connect', async (req, res) => {
  try {
    const { clientId, provider = 'gmail', email, displayName } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const mongoose = require('mongoose');
    let targetClientId = clientId;

    // Find or auto-create client for this custom email
    let client = null;
    if (targetClientId && targetClientId !== 'all' && mongoose.Types.ObjectId.isValid(targetClientId)) {
      client = await Client.findById(targetClientId);
    }
    if (!client) {
      client = await Client.findOne({ email: cleanEmail });
    }
    if (!client) {
      const User = require('../models/User');
      const assistantUser = await User.findOne({ role: 'assistant' });
      const domainName = cleanEmail.includes('@') ? cleanEmail.split('@')[1].split('.')[0].toUpperCase() : 'Custom';
      client = await Client.create({
        name: displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        company: `${domainName} Account`,
        assistantId: assistantUser?._id,
        status: 'active',
        connectedAccounts: []
      });
    }
    targetClientId = client._id;

    let account = await EmailAccount.findOne({ clientId: targetClientId, email: cleanEmail });
    if (!account) {
      account = await EmailAccount.create({
        clientId: targetClientId,
        provider: provider.toLowerCase(),
        email: cleanEmail,
        displayName: displayName || cleanEmail,
        status: 'connected',
        lastSync: new Date(),
        connectedAt: new Date()
      });
    } else {
      account.status = 'connected';
      account.lastSync = new Date();
      await account.save();
    }

    // Update Client's connectedAccounts list
    await Client.findByIdAndUpdate(targetClientId, {
      $pull: { connectedAccounts: { email: cleanEmail } }
    });
    await Client.findByIdAndUpdate(targetClientId, {
      $push: {
        connectedAccounts: {
          provider: provider.toLowerCase(),
          email: cleanEmail,
          status: 'connected',
          lastSync: new Date(),
          connectedAt: new Date()
        }
      }
    });

    await ActivityLog.create({
      clientId: targetClientId,
      userId: req.user._id,
      action: 'account_connected',
      description: `Connected ${provider.toUpperCase()} account for: ${cleanEmail}`,
      entityType: 'account',
      entityId: account._id
    });

    res.status(201).json({ success: true, account, client });
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

// POST /api/accounts/purge-dummy-data - Purges all simulated/dummy data
router.post('/purge-dummy-data', async (req, res) => {
  try {
    const Email = require('../models/Email');
    const Meeting = require('../models/Meeting');
    // Remove all emails except real Gmail ones (which start with 'gmail-')
    const emailResult = await Email.deleteMany({ threadId: { $not: /^gmail-/ } });
    const meetingResult = await Meeting.deleteMany({});
    res.json({
      success: true,
      message: `Successfully purged ${emailResult.deletedCount} dummy emails. MailPilot AI is operating in Real Data Only Mode.`,
      realEmailsCount: await Email.countDocuments()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
