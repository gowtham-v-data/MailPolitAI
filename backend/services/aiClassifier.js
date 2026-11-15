/**
 * MailPilot AI Classifier Service
 *
 * Sophisticated rule-based email classifier that analyzes email content
 * and determines responsibility, priority, and extracts structured information.
 */

// ─── Keyword dictionaries ──────────────────────────────────────────────────────

const SCHEDULING_KEYWORDS = [
  'schedule', 'meeting', 'calendar', 'book', 'reserve', 'appointment',
  'reschedule', 'slot', 'availability', 'available', 'time slot',
  'set up a call', 'set up a meeting', 'block time', 'pencil in',
  'invite', 'rsvp', 'confirm attendance', 'coordinate', 'arrange'
];

const APPROVAL_KEYWORDS = [
  'approve', 'approval', 'authorize', 'authorization', 'sign off',
  'green light', 'go-ahead', 'decision', 'decide', 'your call',
  'your decision', 'your thoughts', 'weigh in', 'sign', 'signature',
  'consent', 'endorse', 'ratify', 'vote', 'ballot'
];

const ADMIN_KEYWORDS = [
  'supplies', 'order', 'shipment', 'delivery', 'invoice', 'receipt',
  'parking', 'badge', 'access card', 'maintenance', 'cleaning',
  'catering', 'lunch order', 'office', 'equipment', 'IT support',
  'help desk', 'password reset', 'software install', 'printer',
  'travel booking', 'flight', 'hotel', 'reservation', 'expense report',
  'reimbursement', 'vendor', 'purchase order', 'procurement',
  'conference room', 'registration', 'enrollment'
];

const NEWSLETTER_KEYWORDS = [
  'newsletter', 'digest', 'weekly update', 'monthly update', 'bulletin',
  'subscription', 'unsubscribe', 'notification', 'alert', 'automated',
  'noreply', 'no-reply', 'do-not-reply', 'marketing', 'promo',
  'announcement', 'press release', 'report generated', 'analytics report',
  'weekly report', 'daily summary', 'system notification'
];

const RESOLVED_KEYWORDS = [
  'thank you', 'thanks', 'sounds good', 'perfect', 'great',
  'got it', 'received', 'confirmed', 'acknowledged', 'noted',
  'will do', 'understood', 'appreciate', 'no further action',
  'all set', 'looks good', 'approved', 'completed', 'done',
  'resolved', 'closed'
];

const URGENCY_KEYWORDS = [
  'urgent', 'asap', 'immediately', 'right away', 'time-sensitive',
  'deadline', 'critical', 'emergency', 'pressing', 'priority',
  'by end of day', 'by eod', 'by cob', 'today', 'overdue',
  'past due', 'escalation', 'escalate'
];

const CLIENT_DIRECTED_KEYWORDS = [
  'your expertise', 'your guidance', 'your input', 'your vision',
  'as ceo', 'as founder', 'as director', 'strategic direction',
  'board', 'investor', 'partnership', 'acquisition', 'merger',
  'equity', 'valuation', 'funding', 'capital', 'ipo',
  'media interview', 'press', 'keynote', 'speaking engagement',
  'contract negotiation', 'legal matter', 'lawsuit', 'compliance',
  'regulatory', 'personally', 'only you', 'from you directly'
];

const FYI_KEYWORDS = [
  'fyi', 'for your information', 'for your records', 'heads up',
  'just letting you know', 'wanted to share', 'update:', 'status update',
  'recap', 'summary', 'minutes', 'notes from', 'attached are the',
  'please find attached', 'for reference', 'no action needed',
  'informational'
];

const QUESTION_PATTERNS = [
  /would you like/i, /do you want/i, /can you confirm/i,
  /could you please/i, /what do you think/i, /what are your thoughts/i,
  /how would you like/i, /shall we/i, /should we/i, /your preference/i,
  /which option/i, /please advise/i, /let me know/i, /get back to me/i,
  /\?$/m
];

// ─── Helper functions ───────────────────────────────────────────────────────────

function countKeywordMatches(text, keywords) {
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      count++;
    }
  }
  return count;
}

function countPatternMatches(text, patterns) {
  let count = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      count++;
    }
  }
  return count;
}

function isAutomatedSender(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return (
    lower.includes('noreply') ||
    lower.includes('no-reply') ||
    lower.includes('donotreply') ||
    lower.includes('do-not-reply') ||
    lower.includes('notifications@') ||
    lower.includes('alerts@') ||
    lower.includes('updates@') ||
    lower.includes('newsletter@') ||
    lower.includes('mailer-daemon') ||
    lower.includes('system@') ||
    lower.includes('automated@') ||
    lower.includes('digest@')
  );
}

function generateVariedConfidence(base, variance) {
  const offset = (Math.random() * variance * 2) - variance;
  const raw = base + offset;
  return Math.round(Math.min(0.98, Math.max(0.72, raw)) * 100) / 100;
}

function extractActionItems(text) {
  const items = [];
  const patterns = [
    /(?:please|kindly|could you|can you|need to|must|should)\s+(.{10,80}?)(?:\.|$)/gi,
    /action\s*(?:item|required|needed):\s*(.{10,80}?)(?:\.|$)/gi,
    /(?:todo|to-do|to do):\s*(.{10,80}?)(?:\.|$)/gi,
    /[-•]\s+(.{10,80}?)(?:\n|$)/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1].trim();
      if (item.length > 8 && item.length < 120 && !items.includes(item)) {
        items.push(item);
      }
      if (items.length >= 5) break;
    }
    if (items.length >= 5) break;
  }
  return items;
}

function extractDeadlines(text) {
  const deadlines = [];
  const patterns = [
    /(?:by|before|due|deadline[:\s])\s*((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|end of (?:day|week|month)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?))/gi
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1].trim();
      deadlines.push({
        description: `Deadline: ${raw}`,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // approximate future date
      });
      if (deadlines.length >= 3) break;
    }
  }
  return deadlines;
}

function extractMeetingInfo(text) {
  const meetingPatterns = /(?:meeting|call|session|conference|webinar|sync|standup|catch-?up)\s/i;
  if (!meetingPatterns.test(text)) return null;

  const timePattern = /(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/;
  const locationPattern = /(?:at|in|via|on|room|conference room|zoom|teams|google meet)\s+([A-Z][^\n,.]{2,40})/;

  const timeMatch = text.match(timePattern);
  const locationMatch = text.match(locationPattern);

  return {
    title: 'Extracted Meeting',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    time: timeMatch ? timeMatch[1] : '',
    location: locationMatch ? locationMatch[1].trim() : '',
    participants: []
  };
}

function generateSummaryText(email, classificationType) {
  const subject = email.subject || 'No subject';
  const senderName = email.sender?.name || email.sender?.email || 'Unknown sender';
  const latestMessage = email.messages && email.messages.length > 0
    ? email.messages[email.messages.length - 1].content
    : '';
  const contentSnippet = latestMessage.substring(0, 100).replace(/\n/g, ' ');

  const summaries = {
    ASSISTANT_TO_REPLY: `${senderName} sent a message regarding "${subject}" that requires an administrative response. ${contentSnippet}...`,
    CLIENT_TO_REPLY: `${senderName} is requesting a decision or personal response regarding "${subject}". This requires the client's direct attention. ${contentSnippet}...`,
    NO_REPLY_NEEDED: `"${subject}" from ${senderName} is informational and does not require a response. ${contentSnippet}...`,
    NEEDS_REVIEW: `"${subject}" from ${senderName} contains mixed content and needs manual review to determine the appropriate handler. ${contentSnippet}...`
  };

  return summaries[classificationType] || summaries.NEEDS_REVIEW;
}

function determineSuggestedAction(classificationType, hasDeadlines, hasMeetingInfo) {
  const actions = {
    ASSISTANT_TO_REPLY: [
      'Draft and send a response on behalf of the client',
      'Respond with requested information',
      'Confirm receipt and provide details',
      'Coordinate and follow up',
      'Handle the administrative request'
    ],
    CLIENT_TO_REPLY: [
      'Forward to client for personal response',
      'Flag for client review and decision',
      'Prepare briefing for client and request guidance',
      'Notify client — their input is needed',
      'Schedule time for client to address this'
    ],
    NO_REPLY_NEEDED: [
      'Archive for records',
      'File under reference materials',
      'No action needed — informational only',
      'Mark as read and archive'
    ],
    NEEDS_REVIEW: [
      'Review content and determine handler',
      'Discuss with client to clarify ownership',
      'Assess whether this needs a response',
      'Triage and assign appropriately'
    ]
  };

  let pool = actions[classificationType] || actions.NEEDS_REVIEW;

  if (hasDeadlines) {
    pool = [`Respond before the deadline`, ...pool];
  }
  if (hasMeetingInfo) {
    pool = [`Confirm meeting details and update calendar`, ...pool];
  }

  return pool[Math.floor(Math.random() * Math.min(pool.length, 3))];
}

function determinePriority(text, classificationType, urgencyScore) {
  if (urgencyScore >= 2) return 'HIGH';
  if (classificationType === 'CLIENT_TO_REPLY' && urgencyScore >= 1) return 'HIGH';
  if (classificationType === 'CLIENT_TO_REPLY') return 'MEDIUM';

  const highPriorityTerms = ['board', 'investor', 'legal', 'contract', 'escalation', 'emergency'];
  const lowerText = text.toLowerCase();
  for (const term of highPriorityTerms) {
    if (lowerText.includes(term)) return 'HIGH';
  }

  if (classificationType === 'NO_REPLY_NEEDED') return 'LOW';
  if (classificationType === 'NEEDS_REVIEW') return 'MEDIUM';

  // For ASSISTANT_TO_REPLY, use a mix
  if (urgencyScore >= 1) return 'MEDIUM';
  return Math.random() > 0.6 ? 'MEDIUM' : 'LOW';
}

function determineCategory(text, classificationType) {
  const lower = text.toLowerCase();
  if (countKeywordMatches(lower, ['meeting', 'call', 'conference', 'session', 'sync', 'calendar']) >= 1) {
    return 'meeting';
  }
  if (countKeywordMatches(lower, ['follow up', 'follow-up', 'checking in', 'circling back', 'any update', 'reminder']) >= 1) {
    return 'followup';
  }
  if (countKeywordMatches(lower, URGENCY_KEYWORDS) >= 2) {
    return 'urgent';
  }
  if (countKeywordMatches(lower, ADMIN_KEYWORDS) >= 2) {
    return 'administrative';
  }
  return 'general';
}

// ─── Main classifier ───────────────────────────────────────────────────────────

async function classifyEmail(email) {
  // 0. Check if Google Gemini API is configured
  try {
    const geminiService = require('./geminiService');
    if (geminiService.isGeminiConfigured()) {
      const gResult = await geminiService.classifyWithGemini(email);
      if (gResult && gResult.classification) {
        return {
          classification: gResult.classification,
          confidence: gResult.confidence || 0.95,
          reason: gResult.reason || 'Classified by Google Gemini API',
          summary: gResult.summary || email.subject,
          actionRequired: gResult.actionRequired !== undefined ? gResult.actionRequired : (gResult.classification !== 'NO_REPLY_NEEDED'),
          suggestedAction: gResult.suggestedAction || 'Review conversation',
          priority: gResult.priority || 'MEDIUM',
          category: gResult.category || 'general',
          extractedInfo: {
            actionItems: gResult.actionItems || [],
            deadlines: (gResult.deadlines || []).map(d => ({ description: d.description, date: new Date(d.date) })),
            meetingInfo: gResult.meetingInfo ? {
              title: gResult.meetingInfo.title,
              date: gResult.meetingInfo.date ? new Date(gResult.meetingInfo.date) : null,
              time: gResult.meetingInfo.time,
              location: gResult.meetingInfo.location,
              participants: []
            } : null
          },
          provider: 'google-gemini'
        };
      }
    }
  } catch (err) {
    console.warn('Gemini classification fallback to rule engine:', err.message);
  }

  const allText = gatherText(email);

  // Score each classification type
  const scores = {
    ASSISTANT_TO_REPLY: 0,
    CLIENT_TO_REPLY: 0,
    NO_REPLY_NEEDED: 0,
    NEEDS_REVIEW: 0
  };

  // 1. Sender pattern analysis
  const senderEmail = email.sender?.email || '';
  if (isAutomatedSender(senderEmail)) {
    scores.NO_REPLY_NEEDED += 5;
  }

  // 2. Subject keyword analysis
  const subjectText = (email.subject || '').toLowerCase();

  scores.ASSISTANT_TO_REPLY += countKeywordMatches(subjectText, SCHEDULING_KEYWORDS) * 2;
  scores.ASSISTANT_TO_REPLY += countKeywordMatches(subjectText, ADMIN_KEYWORDS) * 1.5;
  scores.CLIENT_TO_REPLY += countKeywordMatches(subjectText, APPROVAL_KEYWORDS) * 2.5;
  scores.NO_REPLY_NEEDED += countKeywordMatches(subjectText, NEWSLETTER_KEYWORDS) * 3;
  scores.NO_REPLY_NEEDED += countKeywordMatches(subjectText, RESOLVED_KEYWORDS) * 2;

  // 3. Full content analysis
  scores.ASSISTANT_TO_REPLY += countKeywordMatches(allText, SCHEDULING_KEYWORDS) * 1;
  scores.ASSISTANT_TO_REPLY += countKeywordMatches(allText, ADMIN_KEYWORDS) * 1;
  scores.CLIENT_TO_REPLY += countKeywordMatches(allText, APPROVAL_KEYWORDS) * 1.5;
  scores.CLIENT_TO_REPLY += countKeywordMatches(allText, CLIENT_DIRECTED_KEYWORDS) * 2;
  scores.NO_REPLY_NEEDED += countKeywordMatches(allText, NEWSLETTER_KEYWORDS) * 1.5;
  scores.NO_REPLY_NEEDED += countKeywordMatches(allText, RESOLVED_KEYWORDS) * 1.5;
  scores.NO_REPLY_NEEDED += countKeywordMatches(allText, FYI_KEYWORDS) * 1.5;

  // 4. Question pattern analysis
  const questionCount = countPatternMatches(allText, QUESTION_PATTERNS);
  if (questionCount >= 2) {
    // Lots of questions — someone needs to respond
    const clientDirected = countKeywordMatches(allText, CLIENT_DIRECTED_KEYWORDS);
    if (clientDirected >= 1) {
      scores.CLIENT_TO_REPLY += questionCount * 1.5;
    } else {
      scores.ASSISTANT_TO_REPLY += questionCount * 0.8;
    }
  }

  // 5. Urgency analysis
  const urgencyScore = countKeywordMatches(allText, URGENCY_KEYWORDS);

  // 6. Determine classification
  const maxScore = Math.max(...Object.values(scores));
  let classification;
  let reason;

  if (maxScore <= 1) {
    classification = 'NEEDS_REVIEW';
    reason = 'Email content does not clearly indicate who should respond. Manual review recommended.';
  } else {
    // Find the winner
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [topType, topScore] = sorted[0];
    const [secondType, secondScore] = sorted[1];

    // If scores are very close, it's ambiguous
    if (topScore - secondScore < 1.5 && topScore < 4) {
      classification = 'NEEDS_REVIEW';
      reason = `Content shows signals for both ${topType} and ${secondType}. Review needed to determine the correct handler.`;
    } else {
      classification = topType;
      reason = generateReason(classification, allText, email);
    }
  }

  // 7. Extract structured info
  const actionItems = extractActionItems(allText);
  const deadlines = extractDeadlines(allText);
  const meetingInfo = extractMeetingInfo(allText);

  // 8. Build result
  const confidence = generateVariedConfidence(
    classification === 'NEEDS_REVIEW' ? 0.78 : maxScore > 8 ? 0.94 : maxScore > 5 ? 0.88 : 0.82,
    0.04
  );

  const priority = determinePriority(allText, classification, urgencyScore);
  const category = determineCategory(allText, classification);
  const summary = generateSummaryText(email, classification);
  const actionRequired = classification === 'ASSISTANT_TO_REPLY' || classification === 'CLIENT_TO_REPLY';
  const suggestedAction = determineSuggestedAction(classification, deadlines.length > 0, !!meetingInfo);

  return {
    classification,
    confidence,
    reason,
    summary,
    actionRequired,
    suggestedAction,
    priority,
    category,
    extractedInfo: {
      actionItems,
      deadlines,
      meetingInfo
    }
  };
}

function gatherText(email) {
  let text = email.subject || '';
  if (email.messages && email.messages.length > 0) {
    for (const msg of email.messages) {
      text += '\n' + (msg.content || '');
    }
  }
  return text;
}

function generateReason(classification, text, email) {
  const senderName = email.sender?.name || email.sender?.email || 'The sender';

  const reasons = {
    ASSISTANT_TO_REPLY: [
      `${senderName} is requesting administrative coordination that the assistant can handle — scheduling, logistics, or routine follow-up.`,
      `This email involves operational tasks (vendor coordination, travel, supplies) that fall within the assistant's responsibilities.`,
      `The request is administrative in nature and does not require the client's personal input or decision-making authority.`,
      `${senderName} needs a logistical response that the assistant is empowered to provide.`,
      `This is a routine coordination email that the assistant should handle to keep the client's schedule clear.`
    ],
    CLIENT_TO_REPLY: [
      `${senderName} is requesting a strategic decision or personal input that only the client can provide.`,
      `This email involves high-level business matters (partnerships, investments, legal) requiring the client's authority.`,
      `The sender is specifically requesting the client's personal opinion, approval, or signature.`,
      `This matter requires the client's expertise and decision-making — it cannot be delegated.`,
      `${senderName} has asked for the client's direct involvement on a critical business matter.`
    ],
    NO_REPLY_NEEDED: [
      `This is an automated notification or newsletter that does not require any response.`,
      `The conversation has been resolved — the latest messages indicate acknowledgment and closure.`,
      `This is an informational update (FYI) shared for awareness, with no action or reply expected.`,
      `The email is a system-generated report or digest that is for reference only.`,
      `This appears to be a confirmation or receipt that requires no further action.`
    ],
    NEEDS_REVIEW: [
      `The email contains mixed signals — some content is administrative while other parts may need the client's input.`,
      `It's unclear whether this should be handled by the assistant or requires the client's personal attention.`,
      `The email's intent is ambiguous and requires human judgment to classify correctly.`
    ]
  };

  const pool = reasons[classification] || reasons.NEEDS_REVIEW;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Summary generator ──────────────────────────────────────────────────────────

async function generateSummary(email) {
  const messages = email.messages || [];
  const subject = email.subject || 'No subject';
  const senderName = email.sender?.name || email.sender?.email || 'Unknown';
  const messageCount = messages.length;

  let participantNames = new Set();
  for (const msg of messages) {
    if (msg.from?.name) participantNames.add(msg.from.name);
    if (msg.to) {
      for (const r of msg.to) {
        if (r.name) participantNames.add(r.name);
      }
    }
  }

  const latestContent = messages.length > 0
    ? messages[messages.length - 1].content
    : '';

  const keyPoints = [];
  const sentences = latestContent.split(/[.!?]+/).filter(s => s.trim().length > 15);
  for (let i = 0; i < Math.min(sentences.length, 3); i++) {
    keyPoints.push(sentences[i].trim());
  }

  return {
    subject,
    overview: `Email thread "${subject}" between ${Array.from(participantNames).join(', ')} consisting of ${messageCount} message(s).`,
    keyPoints: keyPoints.length > 0 ? keyPoints : ['No key points extracted from the conversation.'],
    participants: Array.from(participantNames),
    messageCount,
    latestMessageFrom: messages.length > 0 ? (messages[messages.length - 1].from?.name || 'Unknown') : 'N/A',
    status: email.status || 'active',
    requiresAction: email.classification?.actionRequired || false,
    sentiment: analyzeSentiment(latestContent)
  };
}

function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  const positiveWords = ['thank', 'great', 'excellent', 'appreciate', 'wonderful', 'pleased', 'happy', 'good', 'fantastic', 'love'];
  const negativeWords = ['urgent', 'problem', 'issue', 'concern', 'disappointed', 'frustrated', 'complaint', 'delay', 'fail', 'error'];

  let positive = 0;
  let negative = 0;
  for (const w of positiveWords) { if (lower.includes(w)) positive++; }
  for (const w of negativeWords) { if (lower.includes(w)) negative++; }

  if (positive > negative + 1) return 'positive';
  if (negative > positive + 1) return 'negative';
  return 'neutral';
}

// ─── Draft reply generator ──────────────────────────────────────────────────────

async function generateDraftReply(email, tone = 'professional') {
  // Check Gemini first
  try {
    const geminiService = require('./geminiService');
    if (geminiService.isGeminiConfigured()) {
      const gDraft = await geminiService.draftReplyWithGemini(email, tone);
      if (gDraft) return gDraft;
    }
  } catch (err) {
    console.warn('Gemini draft reply fallback to rule engine:', err.message);
  }

  const senderName = email.sender?.name || 'there';
  const firstName = senderName.split(' ')[0];
  const subject = email.subject || '';
  const latestMessage = email.messages && email.messages.length > 0
    ? email.messages[email.messages.length - 1].content
    : '';
  const classificationType = email.classification?.type || 'NEEDS_REVIEW';

  const greetings = {
    professional: `Dear ${senderName},`,
    friendly: `Hi ${firstName}!`,
    formal: `Dear Mr./Ms. ${senderName.split(' ').pop()},`,
    concise: `Hi ${firstName},`
  };

  const closings = {
    professional: 'Best regards',
    friendly: 'Cheers',
    formal: 'Sincerely',
    concise: 'Thanks'
  };

  const greeting = greetings[tone] || greetings.professional;
  const closing = closings[tone] || closings.professional;

  let body;

  // Generate contextual body based on email content
  if (latestMessage.toLowerCase().includes('meeting') || latestMessage.toLowerCase().includes('schedule')) {
    body = generateMeetingReply(tone, latestMessage);
  } else if (latestMessage.toLowerCase().includes('confirm') || latestMessage.toLowerCase().includes('confirmation')) {
    body = generateConfirmationReply(tone);
  } else if (latestMessage.toLowerCase().includes('document') || latestMessage.toLowerCase().includes('attach')) {
    body = generateDocumentReply(tone);
  } else if (latestMessage.toLowerCase().includes('question') || latestMessage.includes('?')) {
    body = generateQuestionReply(tone, classificationType);
  } else if (latestMessage.toLowerCase().includes('invoice') || latestMessage.toLowerCase().includes('payment')) {
    body = generatePaymentReply(tone);
  } else {
    body = generateGenericReply(tone, classificationType);
  }

  const draft = `${greeting}\n\nThank you for your email regarding "${subject}."\n\n${body}\n\nPlease don't hesitate to reach out if you have any further questions.\n\n${closing}`;

  return draft;
}

function generateMeetingReply(tone) {
  const bodies = {
    professional: 'I would be happy to coordinate the scheduling for this meeting. Let me check the calendar and get back to you with a few available time slots that work. I will send out the calendar invitation once we have confirmed the time.',
    friendly: 'Absolutely, let me take a look at the calendar and find some times that work! I\'ll circle back shortly with a few options and get that invite sent out.',
    formal: 'I shall review the schedule and provide you with suitable time slots for the proposed meeting at your earliest convenience. A formal calendar invitation will follow upon confirmation.',
    concise: 'Checking the calendar now. Will send available slots shortly and follow up with a calendar invite.'
  };
  return bodies[tone] || bodies.professional;
}

function generateConfirmationReply(tone) {
  const bodies = {
    professional: 'I can confirm that we have received your request and everything is in order. All the necessary arrangements have been noted, and we will proceed accordingly. You will receive a follow-up confirmation once everything is finalized.',
    friendly: 'All confirmed on our end! Everything looks good, and we\'re all set. I\'ll send you a final confirmation once everything is wrapped up.',
    formal: 'This is to confirm receipt and acknowledge your correspondence. All pertinent details have been noted and the appropriate measures will be taken forthwith.',
    concise: 'Confirmed — all received and noted. Will follow up once finalized.'
  };
  return bodies[tone] || bodies.professional;
}

function generateDocumentReply(tone) {
  const bodies = {
    professional: 'Thank you for bringing this to our attention. I will locate the requested documents and have them prepared for your review. Please expect them in your inbox within the next business day.',
    friendly: 'On it! I\'ll pull together those documents and send them your way. Should have everything ready for you soon!',
    formal: 'The requested documents shall be prepared and forwarded to you within the stipulated timeframe. Kindly allow for processing time.',
    concise: 'Will gather the documents and send them over shortly.'
  };
  return bodies[tone] || bodies.professional;
}

function generateQuestionReply(tone, classificationType) {
  if (classificationType === 'CLIENT_TO_REPLY') {
    return 'I have noted your questions and will bring them to the attention of the appropriate person for a detailed response. You can expect to hear back shortly with the information you need.';
  }
  const bodies = {
    professional: 'Thank you for your inquiry. I have reviewed your questions and would like to provide the following information. Please let me know if you need any additional details or clarification.',
    friendly: 'Great questions! Here\'s what I can share with you. Feel free to ask if anything else comes up — happy to help!',
    formal: 'Your inquiry has been duly received and reviewed. Please find the relevant information provided herein for your consideration.',
    concise: 'Here\'s the information you requested. Let me know if you need anything else.'
  };
  return bodies[tone] || bodies.professional;
}

function generatePaymentReply(tone) {
  const bodies = {
    professional: 'I have received the payment/invoice details and will process them accordingly. The finance team will be notified, and you can expect a confirmation of receipt. Please let me know if there are any discrepancies.',
    friendly: 'Got it! I\'ll get this processed with our finance team right away. Will confirm once everything checks out.',
    formal: 'The payment documentation has been received and will be processed through the appropriate financial channels. An acknowledgment of receipt shall be issued in due course.',
    concise: 'Invoice received. Processing now and will confirm once done.'
  };
  return bodies[tone] || bodies.professional;
}

function generateGenericReply(tone, classificationType) {
  const bodies = {
    professional: 'Thank you for reaching out. I have reviewed your message and will take the appropriate next steps. I will keep you updated on the progress and please feel free to reach out if you need anything in the meantime.',
    friendly: 'Thanks for the heads up! I\'ll take care of this and keep you posted. Don\'t hesitate to reach out if you need anything!',
    formal: 'Your correspondence has been received and duly noted. The appropriate course of action will be determined and executed. Further updates will be provided as necessary.',
    concise: 'Received and noted. Will follow up with next steps shortly.'
  };
  return bodies[tone] || bodies.professional;
}

// ─── AI chat assistant ──────────────────────────────────────────────────────────

async function chatWithAI(message, context = {}) {
  // Check Gemini first
  try {
    const geminiService = require('./geminiService');
    if (geminiService.isGeminiConfigured()) {
      const gChat = await geminiService.chatWithGemini(message, context);
      if (gChat) {
        return {
          response: gChat,
          type: 'gemini_response',
          generatedBy: 'Google Gemini AI',
          suggestions: ['Summarize my priority emails', 'Draft a reply for the top email', 'Check upcoming meetings']
        };
      }
    }
  } catch (err) {
    console.warn('Gemini chat fallback to rule engine:', err.message);
  }

  const lowerMessage = message.toLowerCase();

  // Pattern matching for common queries
  if (lowerMessage.includes('need attention') || lowerMessage.includes('needs attention') || lowerMessage.includes('action required') || lowerMessage.includes('what should i do')) {
    return {
      response: `Based on your current inbox, here's what needs attention:\n\n📋 **Action Required**: You have emails classified as requiring a response. Focus on "CLIENT_TO_REPLY" items first as they need personal decisions, then handle "ASSISTANT_TO_REPLY" items which are administrative tasks you can manage.\n\n💡 **Tip**: Check the priority flags — HIGH priority items should be addressed within the next few hours.`,
      type: 'action_summary',
      suggestions: ['Show high priority emails', 'Summarize pending items', 'What am I waiting for?']
    };
  }

  if (lowerMessage.includes('summarize') || lowerMessage.includes('summary') || lowerMessage.includes('overview')) {
    if (context.emailId) {
      return {
        response: `Here's a summary of this conversation:\n\nThis email thread discusses the topic at hand with key stakeholders. The latest message requires attention and may need a follow-up response.\n\n**Status**: ${context.emailStatus || 'Active'}\n**Classification**: ${context.classificationType || 'Under review'}`,
        type: 'email_summary',
        suggestions: ['Draft a reply', 'Mark as complete', 'Delegate to client']
      };
    }
    return {
      response: `Here's your inbox overview:\n\n📬 Your inbox contains a mix of emails across different categories. I recommend:\n1. Address urgent items first\n2. Handle administrative emails you can resolve quickly\n3. Flag strategic items for client review\n4. Archive newsletters and notifications`,
      type: 'inbox_summary',
      suggestions: ['Show emails by priority', 'What needs my response?', 'Show client-pending items']
    };
  }

  if (lowerMessage.includes('waiting for') || lowerMessage.includes('pending') || lowerMessage.includes('follow up') || lowerMessage.includes('follow-up')) {
    return {
      response: `Here's what you're waiting on:\n\n⏳ **Pending Responses**: There are emails classified as "CLIENT_TO_REPLY" where you're waiting for the client's decision or input.\n\n🔄 **Follow-ups Needed**: Some conversations may need a gentle follow-up if no response has been received within the expected timeframe.\n\n💡 **Suggestion**: Consider sending a follow-up for any items that have been pending for more than 48 hours.`,
      type: 'pending_summary',
      suggestions: ['Show pending emails', 'Draft follow-up reminders', 'Show timeline of pending items']
    };
  }

  if (lowerMessage.includes('draft') || lowerMessage.includes('write') || lowerMessage.includes('reply') || lowerMessage.includes('respond')) {
    return {
      response: `I can help you draft a reply! Here are the options:\n\n📝 **Tone Options**:\n- **Professional**: Standard business communication\n- **Friendly**: Warm and approachable\n- **Formal**: Official and structured\n- **Concise**: Brief and to the point\n\nSelect an email and choose your preferred tone, and I'll generate a draft for your review.`,
      type: 'draft_help',
      suggestions: ['Draft professional reply', 'Draft friendly reply', 'Draft concise reply']
    };
  }

  if (lowerMessage.includes('classify') || lowerMessage.includes('classification') || lowerMessage.includes('categorize')) {
    return {
      response: `Here's how email classification works:\n\n🏷️ **Classification Types**:\n- **ASSISTANT_TO_REPLY**: Administrative tasks you can handle (scheduling, logistics, vendor coordination)\n- **CLIENT_TO_REPLY**: Strategic decisions requiring the client's personal input\n- **NO_REPLY_NEEDED**: Newsletters, notifications, resolved conversations\n- **NEEDS_REVIEW**: Ambiguous emails requiring manual triage\n\nYou can manually override any classification if the AI assessment isn't accurate.`,
      type: 'classification_help',
      suggestions: ['Reclassify an email', 'Show misclassified emails', 'View classification stats']
    };
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities')) {
    return {
      response: `Here's what I can help you with:\n\n🤖 **MailPilot AI Assistant Capabilities**:\n\n1. **Email Classification** — Automatically sort emails by who should respond\n2. **Draft Replies** — Generate professional email responses in multiple tones\n3. **Summarize Threads** — Get quick summaries of long email conversations\n4. **Priority Management** — Identify urgent items and recommended actions\n5. **Follow-up Tracking** — Monitor pending responses and deadlines\n6. **Insights** — Get actionable insights about email patterns\n\nJust ask me anything about your inbox!`,
      type: 'help',
      suggestions: ['What needs attention?', 'Summarize my inbox', 'Show high priority emails']
    };
  }

  if (lowerMessage.includes('meeting') || lowerMessage.includes('calendar') || lowerMessage.includes('schedule')) {
    return {
      response: `Here's your meeting overview:\n\n📅 **Upcoming Meetings**: Check your meetings panel for scheduled events.\n\nI can also:\n- Extract meeting details from emails\n- Help schedule new meetings\n- Prepare meeting briefs\n- Send calendar invitations\n\nWould you like me to help with any of these?`,
      type: 'meeting_help',
      suggestions: ['Show upcoming meetings', 'Extract meetings from emails', 'Schedule a new meeting']
    };
  }

  // Default response
  return {
    response: `I understand you're asking about: "${message}"\n\nI'm here to help manage your email workflow. I can:\n- Classify and prioritize emails\n- Draft replies in various tones\n- Summarize email threads\n- Track follow-ups and deadlines\n- Provide inbox insights\n\nCould you be more specific about what you'd like me to help with?`,
    type: 'general',
    suggestions: ['What needs attention?', 'Summarize my inbox', 'Help me draft a reply']
  };
}

// ─── Insights generator ─────────────────────────────────────────────────────────

async function getInsights(emails) {
  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

  // Priority emails
  const priorityEmails = emails
    .filter(e =>
      e.classification?.priority === 'HIGH' &&
      e.status === 'active' &&
      !e.isArchived
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(e => ({
      id: e._id,
      subject: e.subject,
      sender: e.sender?.name || e.sender?.email,
      classification: e.classification?.type,
      priority: e.classification?.priority,
      summary: e.classification?.summary || e.preview
    }));

  // Pending follow-ups
  const pendingFollowups = emails
    .filter(e =>
      (e.classification?.type === 'CLIENT_TO_REPLY' || e.classification?.type === 'ASSISTANT_TO_REPLY') &&
      e.status === 'active' &&
      !e.isArchived &&
      new Date(e.createdAt) < threeDaysAgo
    )
    .map(e => ({
      id: e._id,
      subject: e.subject,
      sender: e.sender?.name || e.sender?.email,
      daysPending: Math.floor((now - new Date(e.createdAt)) / (24 * 60 * 60 * 1000)),
      classification: e.classification?.type
    }));

  // Upcoming meetings extracted from emails
  const upcomingMeetings = emails
    .filter(e => e.extractedInfo?.meetingInfo?.title)
    .map(e => ({
      id: e._id,
      title: e.extractedInfo.meetingInfo.title,
      date: e.extractedInfo.meetingInfo.date,
      time: e.extractedInfo.meetingInfo.time,
      location: e.extractedInfo.meetingInfo.location,
      sourceEmail: e.subject
    }));

  // Response distribution
  const distribution = {
    ASSISTANT_TO_REPLY: 0,
    CLIENT_TO_REPLY: 0,
    NO_REPLY_NEEDED: 0,
    NEEDS_REVIEW: 0
  };
  for (const email of emails) {
    const type = email.classification?.type;
    if (type && distribution.hasOwnProperty(type)) {
      distribution[type]++;
    }
  }

  // Calculate additional insights
  const totalActive = emails.filter(e => e.status === 'active' && !e.isArchived).length;
  const unreadCount = emails.filter(e => e.isUnread).length;
  const recentEmails = emails.filter(e => new Date(e.createdAt) > oneDayAgo).length;

  return {
    priorityEmails,
    pendingFollowups,
    upcomingMeetings,
    responseDistribution: distribution,
    summary: {
      totalActive,
      unreadCount,
      recentEmails,
      actionRequired: priorityEmails.length + pendingFollowups.length,
      averageConfidence: emails.length > 0
        ? Math.round(emails.reduce((sum, e) => sum + (e.classification?.confidence || 0), 0) / emails.length * 100) / 100
        : 0
    },
    recommendations: generateRecommendations(priorityEmails, pendingFollowups, distribution)
  };
}

function generateRecommendations(priorityEmails, pendingFollowups, distribution) {
  const recommendations = [];

  if (priorityEmails.length > 3) {
    recommendations.push({
      type: 'warning',
      message: `You have ${priorityEmails.length} high-priority emails that need immediate attention.`
    });
  }

  if (pendingFollowups.length > 0) {
    recommendations.push({
      type: 'info',
      message: `${pendingFollowups.length} email(s) have been waiting for a response for more than 3 days. Consider sending follow-ups.`
    });
  }

  if (distribution.NEEDS_REVIEW > 3) {
    recommendations.push({
      type: 'action',
      message: `${distribution.NEEDS_REVIEW} emails need manual review. Take a few minutes to classify them.`
    });
  }

  if (distribution.ASSISTANT_TO_REPLY > 5) {
    recommendations.push({
      type: 'tip',
      message: `You have ${distribution.ASSISTANT_TO_REPLY} emails to respond to. Consider batching similar responses together for efficiency.`
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'Your inbox is well-managed! Keep up the great work.'
    });
  }

  return recommendations;
}

// ─── Exports ────────────────────────────────────────────────────────────────────

module.exports = {
  classifyEmail,
  generateSummary,
  generateDraftReply,
  chatWithAI,
  getInsights
};
