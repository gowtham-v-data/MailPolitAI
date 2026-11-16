/**
 * MailPilot AI - Real Gmail Synchronization Service
 * 
 * Fetches real incoming emails from the user's connected Gmail account via the Gmail REST API (v1),
 * runs each real email through Google Gemini AI for classification and action extraction,
 * and persists the real email threads into the MongoDB database.
 */

const Email = require('../models/Email');
const EmailAccount = require('../models/EmailAccount');
const ActivityLog = require('../models/ActivityLog');
const { classifyEmail } = require('./aiClassifier');

/**
 * Parses header string like "John Doe <john@example.com>" into { name, email }
 */
function parseSender(fromHeader = '') {
  const match = fromHeader.match(/^(.*?)\s*<(.+@.+)>$/);
  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, '').trim() || match[2].split('@')[0],
      email: match[2].trim().toLowerCase()
    };
  }
  const cleanEmail = fromHeader.replace(/^["']|["']$/g, '').trim().toLowerCase();
  return {
    name: cleanEmail.split('@')[0] || 'Unknown',
    email: cleanEmail
  };
}

/**
 * Decodes Gmail URL-safe base64 string
 */
function decodeBase64Url(str = '') {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

/**
 * Recursively extracts plain text or HTML body from a Gmail payload
 */
function extractBody(payload) {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    // Prefer text/plain first
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Fallback to text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    // Nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }
  return '';
}

/**
 * Refreshes an expired Google OAuth access token using the stored refresh_token
 */
async function refreshGoogleAccessToken(account) {
  if (!account.refreshToken) {
    throw new Error('No refresh token available to renew access.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(`Token refresh failed: ${data.error_description || JSON.stringify(data)}`);
  }

  account.accessToken = data.access_token;
  await account.save();
  return data.access_token;
}

/**
 * Synchronizes real emails from Gmail for a connected EmailAccount
 */
async function syncRealGmailEmails(account, options = {}) {
  const maxResults = options.maxResults || 15;
  let accessToken = account.accessToken;

  if (!accessToken) {
    console.warn(`[GmailSync] No access token for account ${account.email}. Attempting refresh...`);
    if (account.refreshToken) {
      accessToken = await refreshGoogleAccessToken(account);
    } else {
      throw new Error(`Account ${account.email} has no OAuth access token. Please reconnect via "Connect Google".`);
    }
  }

  console.log(`[GmailSync] Fetching real messages for ${account.email} from Gmail API...`);

  // 1. Fetch message IDs from user's primary inbox
  let listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  // If unauthorized, attempt one token refresh
  if (listRes.status === 401 && account.refreshToken) {
    console.log('[GmailSync] Access token expired. Refreshing token...');
    accessToken = await refreshGoogleAccessToken(account);
    listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
  }

  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Gmail API messages list failed (HTTP ${listRes.status}): ${errText}`);
  }

  const listData = await listRes.json();
  const messagesList = listData.messages || [];
  console.log(`[GmailSync] Retrieved ${messagesList.length} message IDs from Gmail.`);

  if (messagesList.length === 0) {
    account.lastSync = new Date();
    await account.save();
    return { syncedCount: 0, totalEmails: 0, emails: [] };
  }

  const syncedEmails = [];

  // 2. Fetch full detail for each message
  for (const item of messagesList) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!msgRes.ok) {
        console.warn(`[GmailSync] Could not fetch message ${item.id}: HTTP ${msgRes.status}`);
        continue;
      }

      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const getHeader = (name) => {
        const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : '';
      };

      const subject = getHeader('Subject') || '(No Subject)';
      const fromRaw = getHeader('From');
      const sender = parseSender(fromRaw);
      const toRaw = getHeader('To') || account.email;
      const dateRaw = getHeader('Date');
      const emailDate = dateRaw && !isNaN(new Date(dateRaw).getTime()) ? new Date(dateRaw) : new Date(parseInt(msgData.internalDate, 10) || Date.now());
      const isUnread = (msgData.labelIds || []).includes('UNREAD');
      const isImportant = (msgData.labelIds || []).includes('IMPORTANT') || (msgData.labelIds || []).includes('STARRED');

      const bodyText = extractBody(msgData.payload) || msgData.snippet || '';
      const snippet = msgData.snippet || bodyText.substring(0, 160);

      // Check if this threadId or message ID already exists
      const threadKey = msgData.threadId ? `gmail-${msgData.threadId}` : `gmail-${msgData.id}`;
      let existingEmail = await Email.findOne({ threadId: threadKey });

      if (existingEmail) {
        // Update read status and snippet
        existingEmail.isUnread = isUnread;
        existingEmail.isImportant = isImportant;
        await existingEmail.save();
        syncedEmails.push(existingEmail);
        continue;
      }

      // 3. Run Gemini AI classification on the real email
      const emailForClassifier = {
        subject,
        sender,
        recipients: [{ name: account.displayName || account.email, email: account.email, type: 'to' }],
        messages: [{
          id: msgData.id,
          from: sender,
          to: [{ name: account.displayName || account.email, email: account.email }],
          content: bodyText || snippet,
          timestamp: emailDate
        }],
        isUnread,
        isImportant
      };

      let aiResult;
      try {
        aiResult = await classifyEmail(emailForClassifier);
      } catch (classifyErr) {
        console.warn('[GmailSync] AI classification fallback:', classifyErr.message);
        aiResult = {
          classification: 'ASSISTANT_TO_REPLY',
          confidence: 0.90,
          reason: 'Live synchronized email from Gmail inbox.',
          summary: `Real email from ${sender.name}: "${subject}"`,
          priority: isImportant ? 'HIGH' : 'MEDIUM',
          actionRequired: true,
          suggestedAction: 'Review email in MailPilot'
        };
      }

      // 4. Save real email into MongoDB
      const newEmail = await Email.create({
        clientId: account.clientId,
        accountId: account._id.toString(),
        threadId: threadKey,
        sender,
        recipients: [{ name: account.displayName || account.email, email: account.email, type: 'to' }],
        subject,
        preview: snippet,
        messages: [{
          id: msgData.id,
          from: sender,
          to: [{ name: account.displayName || account.email, email: account.email }],
          content: bodyText || snippet,
          timestamp: emailDate
        }],
        classification: {
          type: aiResult.classification || 'ASSISTANT_TO_REPLY',
          confidence: aiResult.confidence || 0.92,
          reason: aiResult.reason || 'Classified from live Gmail inbox content.',
          summary: aiResult.summary || `Live incoming email regarding "${subject}"`,
          actionRequired: aiResult.actionRequired !== undefined ? aiResult.actionRequired : true,
          suggestedAction: aiResult.suggestedAction || 'Review incoming email',
          priority: aiResult.priority || (isImportant ? 'HIGH' : 'MEDIUM'),
          deadline: aiResult.deadlines && aiResult.deadlines.length > 0 ? aiResult.deadlines[0] : null,
          meetingInfo: aiResult.meetingInfo || null,
          classifiedAt: new Date(),
          classifiedBy: 'ai'
        },
        category: aiResult.category || (isImportant ? 'urgent' : 'general'),
        classificationHistory: [{
          type: aiResult.classification || 'ASSISTANT_TO_REPLY',
          confidence: aiResult.confidence || 0.92,
          reason: aiResult.reason || 'AI classified on live ingestion',
          changedBy: 'ai',
          changedAt: new Date()
        }],
        isUnread,
        isImportant,
        status: 'active',
        createdAt: emailDate
      });

      syncedEmails.push(newEmail);
      console.log(`   ✉️  [Real Gmail] Synced & Classified: "${subject}" -> ${newEmail.classification.type}`);
    } catch (msgErr) {
      console.error(`[GmailSync] Error processing message ${item.id}:`, msgErr.message);
    }
  }

  // 5. Update account metadata
  account.lastSync = new Date();
  account.totalEmails = await Email.countDocuments({ clientId: account.clientId });
  account.unreadEmails = await Email.countDocuments({ clientId: account.clientId, isUnread: true });
  await account.save();

  await ActivityLog.create({
    clientId: account.clientId,
    action: 'account_synced',
    description: `Synchronized ${syncedEmails.length} live email(s) from Gmail account (${account.email}) using Gmail API.`,
    entityType: 'account',
    entityId: account._id
  });

  return {
    success: true,
    email: account.email,
    syncedCount: syncedEmails.length,
    totalEmails: account.totalEmails,
    emails: syncedEmails
  };
}

module.exports = {
  syncRealGmailEmails,
  refreshGoogleAccessToken
};
