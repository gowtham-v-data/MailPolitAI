/**
 * Google Gemini API Integration Service
 * Powered by @google/genai SDK (gemini-2.5-flash / gemini-1.5-flash)
 *
 * Provides:
 * - AI-powered email classification
 * - Automatic email thread summarization
 * - Context-aware professional reply drafting
 * - Interactive chat assistant over user inbox
 */

const { GoogleGenAI } = require('@google/genai');

let genAIInstance = null;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

function isGeminiConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== 'your-gemini-api-key' && key.trim().length > 10);
}

/**
 * Classify email using Google Gemini API
 */
async function classifyWithGemini(email) {
  const ai = getGenAI();
  if (!ai) return null;

  const content = email.messages && email.messages.length > 0
    ? email.messages.map(m => `From: ${m.from?.name || m.from?.email}\nContent: ${m.content}`).join('\n---\n')
    : email.preview || '';

  const prompt = `You are MailPilot AI, an elite executive assistant email classifier.
Analyze this email conversation and determine who is responsible for replying.

Email Subject: "${email.subject}"
Sender: "${email.sender?.name || email.sender?.email}"
Recipients: "${(email.recipients || []).map(r => r.name || r.email).join(', ')}"
Conversation Body:
${content}

Your job is to classify it into exactly ONE of these four categories:
1. ASSISTANT_TO_REPLY: Routine scheduling, booking, travel, catering, office admin, IT logistics, vendor coordination.
2. CLIENT_TO_REPLY: Requires client's personal sign-off, high-stakes decisions, board votes, strategic partnerships, equity, executive escalations.
3. NO_REPLY_NEEDED: Newsletters, receipts, automated notifications, status updates, resolved threads.
4. NEEDS_REVIEW: Ambiguous or mixed requests requiring assistant review.

Respond with ONLY a valid raw JSON object (no markdown code fences, no extra text) with this exact schema:
{
  "classification": "ASSISTANT_TO_REPLY" | "CLIENT_TO_REPLY" | "NO_REPLY_NEEDED" | "NEEDS_REVIEW",
  "confidence": 0.85 to 0.99,
  "reason": "1-2 sentence explanation of why this responsibility was assigned",
  "summary": "Concise 1-2 sentence executive summary of the email",
  "actionRequired": boolean,
  "suggestedAction": "Specific action step to take next",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "category": "meeting" | "followup" | "urgent" | "administrative" | "general",
  "actionItems": ["extracted action item 1", "..."],
  "deadlines": [{"description": "action deadline", "date": "YYYY-MM-DD"}],
  "meetingInfo": {"title": "meeting title if any", "date": "YYYY-MM-DD", "time": "HH:MM", "location": "location/platform"}
}`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text ? response.text.trim() : '';
    // Strip markdown fences if Gemini added them
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch (err) {
    console.warn('Gemini classification call failed, falling back to rule-based classifier:', err.message);
    return null;
  }
}

/**
 * Summarize email using Google Gemini API
 */
async function summarizeWithGemini(email) {
  const ai = getGenAI();
  if (!ai) return null;

  const content = email.messages && email.messages.length > 0
    ? email.messages.map(m => `${m.from?.name || m.from?.email}: ${m.content}`).join('\n\n')
    : email.preview || '';

  const prompt = `Summarize this email conversation for an executive in 2 clear sentences. Include the key ask and any critical dates:\n\nSubject: ${email.subject}\n\n${content}`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text ? response.text.trim() : null;
  } catch (err) {
    console.warn('Gemini summarization failed:', err.message);
    return null;
  }
}

/**
 * Draft reply using Google Gemini API
 */
async function draftReplyWithGemini(email, tone = 'professional') {
  const ai = getGenAI();
  if (!ai) return null;

  const lastMessage = email.messages && email.messages.length > 0
    ? email.messages[email.messages.length - 1].content
    : email.preview || '';

  const prompt = `You are drafting an email reply on behalf of an executive or personal assistant.
Subject: Re: ${email.subject}
Original Sender: ${email.sender?.name || email.sender?.email}
Original Message:
${lastMessage}

Tone requested: ${tone} (Options: professional, friendly, formal, concise)
Write a polished, ready-to-send draft reply that directly addresses the sender's points. Do not include placeholders like "[Your Name]" — sign off naturally as Sarah Mitchell or MailPilot Executive Team.`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text ? response.text.trim() : null;
  } catch (err) {
    console.warn('Gemini draft reply failed:', err.message);
    return null;
  }
}

/**
 * Chat with AI about emails using Google Gemini API
 */
async function chatWithGemini(message, context = {}) {
  const ai = getGenAI();
  if (!ai) return null;

  const emails = context.emails || [];
  const clientApprovalEmails = emails.filter(e => e.classification?.type === 'CLIENT_TO_REPLY');
  const assistantEmails = emails.filter(e => e.classification?.type === 'ASSISTANT_TO_REPLY');

  const emailsSummary = emails.slice(0, 15).map(e => (
    `- Subject: "${e.subject}", From: "${e.sender?.name || e.sender?.email}", Classified: "${e.classification?.type || 'N/A'}", Priority: "${e.classification?.priority || 'MEDIUM'}", Summary: "${e.classification?.summary || e.preview || ''}"`
  )).join('\n');

  const prompt = `You are MailPilot AI, an elite executive AI email assistant companion.
You have real-time live access to the user's executive inbox.

Inbox Status:
- Total Live Emails: ${emails.length}
- Client Approvals Required: ${clientApprovalEmails.length}
- Assistant Actions: ${assistantEmails.length}

Recent Inbox Conversations:
${emailsSummary}

User Request: "${message}"

Instructions:
1. Provide a professional, direct, executive response using the actual email data above.
2. If the user asks about client approvals, explicitly list the real client-pending emails with senders and subjects.
3. If the user asks for a draft or reply, write a polished, ready-to-send email response.
4. Do NOT say generic robotic lines like "I understand you're asking about..." or show static menus.
5. Be concise, executive, and actionable.`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text ? response.text.trim() : null;
  } catch (err) {
    console.warn('Gemini chat failed:', err.message);
    return null;
  }
}

module.exports = {
  isGeminiConfigured,
  classifyWithGemini,
  summarizeWithGemini,
  draftReplyWithGemini,
  chatWithGemini,
};
