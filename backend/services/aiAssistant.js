/**
 * MailPilot AI Assistant Service
 *
 * Higher-level orchestration that wraps the AI classifier
 * for route-level convenience methods.
 */

const {
  classifyEmail,
  generateSummary,
  generateDraftReply,
  chatWithAI,
  getInsights
} = require('./aiClassifier');

const Email = require('../models/Email');
const Draft = require('../models/Draft');
const ActivityLog = require('../models/ActivityLog');
const Meeting = require('../models/Meeting');
const Client = require('../models/Client');
const { processExecutiveQuery } = require('./executiveAssistantEngine');

/**
 * Classify a single email and persist the results.
 */
async function classifyAndPersist(emailId) {
  const email = await Email.findById(emailId);
  if (!email) throw new Error('Email not found');

  const result = await classifyEmail(email);

  email.classification = {
    type: result.classification,
    confidence: result.confidence,
    reason: result.reason,
    summary: result.summary,
    actionRequired: result.actionRequired,
    suggestedAction: result.suggestedAction,
    priority: result.priority,
    classifiedAt: new Date(),
    classifiedBy: 'ai'
  };

  email.category = result.category;
  email.isImportant = result.priority === 'HIGH';

  if (result.extractedInfo) {
    email.extractedInfo = result.extractedInfo;
  }

  email.classificationHistory.push({
    type: result.classification,
    confidence: result.confidence,
    reason: result.reason,
    changedBy: 'ai',
    changedAt: new Date()
  });

  await email.save();

  await ActivityLog.create({
    clientId: email.clientId,
    action: 'ai_classification',
    description: `AI classified email "${email.subject}" as ${result.classification} with ${Math.round(result.confidence * 100)}% confidence`,
    entityType: 'classification',
    entityId: email._id,
    metadata: {
      classification: result.classification,
      confidence: result.confidence,
      priority: result.priority
    }
  });

  return result;
}

/**
 * Classify all unclassified (NEEDS_REVIEW) emails for a client.
 */
async function classifyAllForClient(clientId) {
  const emails = await Email.find({
    clientId,
    'classification.type': 'NEEDS_REVIEW',
    manualOverride: false
  });

  const results = [];
  for (const email of emails) {
    try {
      const result = await classifyAndPersist(email._id);
      results.push({ emailId: email._id, subject: email.subject, ...result });
    } catch (err) {
      results.push({ emailId: email._id, subject: email.subject, error: err.message });
    }
  }

  return {
    total: emails.length,
    classified: results.filter(r => !r.error).length,
    errors: results.filter(r => r.error).length,
    results
  };
}

/**
 * Generate a summary for an email and return it.
 */
async function summarizeEmail(emailId) {
  const email = await Email.findById(emailId);
  if (!email) throw new Error('Email not found');
  return generateSummary(email);
}

/**
 * Generate a draft reply, persist it, and return it.
 */
async function createDraftReply(emailId, tone = 'professional') {
  const email = await Email.findById(emailId);
  if (!email) throw new Error('Email not found');

  const content = await generateDraftReply(email, tone);

  const draft = await Draft.create({
    emailId: email._id,
    clientId: email.clientId,
    content,
    tone,
    generatedBy: 'ai',
    status: 'draft'
  });

  await ActivityLog.create({
    clientId: email.clientId,
    action: 'draft_generated',
    description: `AI generated a ${tone} draft reply for "${email.subject}"`,
    entityType: 'email',
    entityId: email._id,
    metadata: { draftId: draft._id, tone }
  });

  return draft;
}

/**
 * Real-time Intelligent Executive Email Assistant Chat.
 */
async function chat(message, context = {}) {
  const clientId = context.clientId && context.clientId !== 'all' ? context.clientId : null;
  const filter = { isArchived: false };
  if (clientId) filter.clientId = clientId;

  const [emails, meetings, clients] = await Promise.all([
    Email.find(filter).sort({ createdAt: -1 }).limit(50).lean().catch(() => []),
    Meeting.find({ status: 'upcoming' }).sort({ date: 1 }).limit(10).lean().catch(() => []),
    Client.find().lean().catch(() => [])
  ]);

  // 1. Try Google Gemini API if configured
  try {
    const geminiService = require('./geminiService');
    if (geminiService.isGeminiConfigured()) {
      const gChat = await geminiService.chatWithGemini(message, {
        ...context,
        emails,
        meetings,
        clients
      });
      if (gChat && gChat.trim()) {
        return {
          response: gChat,
          type: 'gemini_response',
          generatedBy: 'Google Gemini AI',
          suggestions: [
            'Which emails require client approval?',
            'What needs attention?',
            'Summarize my inbox'
          ]
        };
      }
    }
  } catch (err) {
    console.warn('Gemini chat unavailable, falling back to Executive Engine:', err.message);
  }

  // 2. High-Precision Real-time Executive Intelligence Engine over live MongoDB emails
  return processExecutiveQuery(message, { emails, meetings, clients, context });
}

/**
 * Get insights for a client's emails.
 */
async function getClientInsights(clientId) {
  const emails = await Email.find({ clientId, isArchived: false });
  return getInsights(emails);
}

module.exports = {
  classifyAndPersist,
  classifyAllForClient,
  summarizeEmail,
  createDraftReply,
  chat,
  getClientInsights
};
