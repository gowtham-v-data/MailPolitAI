/**
 * MailPilot AI - Executive Intelligence & Conversation Engine
 *
 * Provides real-time, context-aware executive email assistance over
 * live MongoDB data:
 * - Dynamic inbox triage & client approval breakdown
 * - Tone-adaptive email drafting with real recipient & subject context
 * - Deep entity & keyword search over live conversations
 * - Meeting schedule intelligence
 */

/**
 * Format relative or standard date
 */
function formatEmailDate(date) {
  if (!date) return 'Recently';
  try {
    const d = new Date(date);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (diffHours < 24) {
      return `Today at ${timeStr}`;
    }
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dateStr} at ${timeStr}`;
  } catch {
    return 'Recently';
  }
}

/**
 * Clean up text content
 */
function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&([a-zA-Z0-9#]+)[\r\n\s]+([a-zA-Z0-9]+);/g, '&$1$2;')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&zwnj;/gi, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Generate intelligent draft response for an email
 */
function generateContextualDraft(email, tone = 'professional') {
  const senderName = email.sender?.name || email.sender?.email?.split('@')[0] || 'Team';
  const subject = email.subject || 'Follow-up';
  const summary = email.classification?.summary || email.preview || '';

  const toneLower = (tone || 'professional').toLowerCase();

  let body = '';

  if (toneLower === 'friendly') {
    body = `Hi ${senderName},

Thanks for reaching out about this!

I've reviewed the details regarding ${subject.replace(/^(re|fwd):\s*/i, '')}. We're excited about this direction and would love to move forward with the next steps.

Could you let us know what time works best for a quick catch-up later this week?

Best,
Sarah Mitchell
Executive Assistant | MailPilot AI`;
  } else if (toneLower === 'formal') {
    body = `Dear ${senderName},

Thank you for your correspondence regarding "${subject.replace(/^(re|fwd):\s*/i, '')}".

This is to confirm receipt of your email. The details have been noted and submitted to executive leadership for review. 

We will provide a formal response alongside our decisions by the close of business tomorrow.

Sincerely,
Sarah Mitchell
Office of the Executive | MailPilot AI`;
  } else if (toneLower === 'concise') {
    body = `Hi ${senderName},

Thanks for the update on ${subject.replace(/^(re|fwd):\s*/i, '')}. 

Acknowledged and approved. Let's proceed as planned.

Best,
Sarah Mitchell`;
  } else {
    // Professional (default)
    body = `Hello ${senderName},

Thank you for contacting us regarding "${subject.replace(/^(re|fwd):\s*/i, '')}".

We have reviewed your message and are currently aligning on the appropriate next steps. Everything looks on track, and we will follow up with our finalized input shortly.

Please feel free to reach out if any urgent items arise in the meantime.

Warm regards,
Sarah Mitchell
Executive Assistant to James Richardson | MailPilot AI`;
  }

  return {
    to: email.sender?.email || email.sender?.name || senderName,
    subject: `Re: ${subject.replace(/^(re|fwd):\s*/i, '')}`,
    body,
    tone: toneLower
  };
}

/**
 * Main query processor
 */
function processExecutiveQuery(message, { emails = [], meetings = [], clients = [], context = {} }) {
  const q = (message || '').trim().toLowerCase();

  // Helper getters
  const clientApprovalEmails = emails.filter(e => e.classification?.type === 'CLIENT_TO_REPLY');
  const assistantEmails = emails.filter(e => e.classification?.type === 'ASSISTANT_TO_REPLY');
  const needsReviewEmails = emails.filter(e => e.classification?.type === 'NEEDS_REVIEW');
  const unreadEmails = emails.filter(e => e.isUnread);
  const importantEmails = emails.filter(e => e.isImportant || e.classification?.priority === 'HIGH');

  // ─────────────────────────────────────────────────────────────
  // 1. CLIENT APPROVALS / CLIENT TO REPLY
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('client approval') ||
    q.includes('client-pending') ||
    q.includes('client to reply') ||
    q.includes('client_to_reply') ||
    q === 'client' ||
    q.includes('require client') ||
    q.includes('client decisions')
  ) {
    if (clientApprovalEmails.length === 0) {
      return {
        response: `### 👤 Client Approvals: None Pending\n\nThere are currently **0 emails** requiring your client's personal sign-off. All active conversations have either been handled or are administrative items managed by the assistant.`,
        type: 'client_approvals',
        suggestions: ['What needs assistant reply?', 'Summarize my inbox', 'Show upcoming meetings']
      };
    }

    let response = `### 👤 Emails Requiring Client Approval (${clientApprovalEmails.length} Pending)\n\nThe following conversations require your client's personal decision, strategic authorization, or sign-off:\n\n`;

    clientApprovalEmails.slice(0, 5).forEach((e, idx) => {
      const sender = e.sender?.name || e.sender?.email || 'Unknown';
      const dateStr = formatEmailDate(e.createdAt);
      const summary = cleanText(e.classification?.summary || e.preview || 'Strategic email requiring authorization');
      const reason = cleanText(e.classification?.reason || 'Requires personal executive input.');

      response += `**${idx + 1}. ${sender}** — *${e.subject}*\n`;
      response += `• **Received**: ${dateStr}\n`;
      response += `• **Summary**: ${summary}\n`;
      response += `• **Why Client Input Needed**: ${reason}\n\n`;
    });

    response += `Would you like me to draft an executive reply for any of these, or delegate them to your assistant?`;

    const topSender = clientApprovalEmails[0]?.sender?.name || clientApprovalEmails[0]?.sender?.email?.split('@')[0] || 'top email';
    return {
      response,
      type: 'client_approvals',
      suggestions: [
        `Draft reply for ${topSender}`,
        'What needs assistant reply?',
        'Summarize my inbox'
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ASSISTANT ACTIONS
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('assistant to reply') ||
    q.includes('assistant_to_reply') ||
    q.includes('assistant tasks') ||
    q.includes('what should i do') ||
    q.includes('assistant reply')
  ) {
    if (assistantEmails.length === 0) {
      return {
        response: `### 🤖 Assistant Action Queue\n\nYou currently have **0 pending administrative tasks**. All routine items are up to date!`,
        type: 'assistant_tasks',
        suggestions: ['Which emails require client approval?', 'Summarize my inbox']
      };
    }

    let response = `### 🤖 Assistant Action Queue (${assistantEmails.length} Pending)\n\nHere are the administrative tasks ready for you to handle:\n\n`;
    assistantEmails.slice(0, 5).forEach((e, idx) => {
      const sender = e.sender?.name || e.sender?.email || 'Unknown';
      const summary = cleanText(e.classification?.summary || e.preview || 'Routine inquiry');
      const action = cleanText(e.classification?.suggestedAction || 'Respond with requested information');

      response += `**${idx + 1}. ${sender}** — *${e.subject}*\n`;
      response += `• **Ask**: ${summary}\n`;
      response += `• **Suggested Action**: ${action}\n\n`;
    });

    const topSender = assistantEmails[0]?.sender?.name || 'sender';
    return {
      response,
      type: 'assistant_tasks',
      suggestions: [
        `Draft reply for ${topSender}`,
        'Which emails require client approval?',
        'Show upcoming meetings'
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. ACTION REQUIRED / WHAT NEEDS ATTENTION
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('need attention') ||
    q.includes('needs attention') ||
    q.includes('action required') ||
    q.includes('needs_review') ||
    q.includes('urgent') ||
    q.includes('priority')
  ) {
    let response = `### ⚡ Action Items Requiring Attention\n\n`;
    response += `Here is your priority breakdown:\n\n`;

    if (clientApprovalEmails.length > 0) {
      response += `**👤 Client Approvals (${clientApprovalEmails.length})**:\n`;
      clientApprovalEmails.slice(0, 3).forEach(e => {
        response += `• **${e.sender?.name || e.sender?.email}**: *${e.subject}*\n`;
      });
      response += `\n`;
    }

    if (assistantEmails.length > 0) {
      response += `**🤖 Assistant Tasks (${assistantEmails.length})**:\n`;
      assistantEmails.slice(0, 3).forEach(e => {
        response += `• **${e.sender?.name || e.sender?.email}**: *${e.subject}*\n`;
      });
      response += `\n`;
    }

    if (needsReviewEmails.length > 0) {
      response += `**⚠️ Needs Review (${needsReviewEmails.length})**:\n`;
      needsReviewEmails.slice(0, 2).forEach(e => {
        response += `• **${e.sender?.name || e.sender?.email}**: *${e.subject}*\n`;
      });
      response += `\n`;
    }

    response += `💡 **Recommended Next Step**: Handle the client-pending items first to avoid executive bottlenecks.`;

    return {
      response,
      type: 'action_summary',
      suggestions: [
        'Which emails require client approval?',
        'Draft a professional reply',
        'Summarize my inbox'
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. INBOX SUMMARY / OVERVIEW
  // ─────────────────────────────────────────────────────────────
  const resolvedCount = emails.filter(e => e.classification?.type === 'NO_REPLY_NEEDED').length;

  if (
    q.includes('summarize my inbox') ||
    q.includes('summarize inbox') ||
    q.includes('inbox summary') ||
    q.includes('overview') ||
    q.includes('how is my inbox') ||
    q.includes('inbox status') ||
    (q.includes('summarize') && !context.email)
  ) {
    const total = emails.length;

    let response = `### 📊 Live Executive Inbox Briefing\n\n`;
    response += `Here is the current state of your inbox:\n\n`;
    response += `• **Total Synced Emails**: ${total}\n`;
    response += `• **Unread**: ${unreadEmails.length}\n`;
    response += `• **Client Approvals Pending**: ${clientApprovalEmails.length}\n`;
    response += `• **Assistant Routine Tasks**: ${assistantEmails.length}\n`;
    response += `• **Resolved / Newsletters**: ${resolvedCount}\n\n`;

    if (emails.length > 0) {
      response += `**Latest Active Conversations**:\n`;
      emails.slice(0, 3).forEach(e => {
        const type = e.classification?.type || 'Under Review';
        response += `• **${e.sender?.name || e.sender?.email}** — *${e.subject}* (${type})\n`;
      });
    }

    return {
      response,
      type: 'inbox_summary',
      suggestions: [
        'Which emails require client approval?',
        'What needs attention?',
        'Show upcoming meetings'
      ]
    };
  }

  // Single conversation summary if context email provided or requested
  if (context.email && (q.includes('summarize') || q.includes('summary') || q.includes('brief') || q.includes('this conversation'))) {
    const e = context.email;
    const sender = e.sender?.name || e.sender?.email || 'Unknown';
    const dateStr = formatEmailDate(e.createdAt);
    const summary = cleanText(e.classification?.summary || e.preview || 'No summary available');
    const action = cleanText(e.classification?.suggestedAction || 'Review conversation');

    let response = `### 📋 Conversation Brief: "${e.subject}"\n\n`;
    response += `• **From**: ${sender}\n`;
    response += `• **Received**: ${dateStr}\n`;
    response += `• **Classification**: \`${e.classification?.type || 'Under Review'}\`\n`;
    response += `• **Executive Summary**: ${summary}\n`;
    response += `• **Recommended Action**: ${action}\n\n`;
    response += `Would you like me to draft a response for this email?`;

    return {
      response,
      type: 'email_summary',
      suggestions: [
        'Draft professional reply',
        'Draft concise reply',
        'Which emails require client approval?'
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 5. CLASSIFICATION BREAKDOWN & STATS
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('classification stats') ||
    q.includes('view stats') ||
    q.includes('stats') ||
    q.includes('classify and prioritize') ||
    q.includes('classification types') ||
    q.includes('how email classification works') ||
    q === 'classify' ||
    q === 'classification'
  ) {
    const total = emails.length;
    const clientPct = total ? Math.round((clientApprovalEmails.length / total) * 100) : 0;
    const assistantPct = total ? Math.round((assistantEmails.length / total) * 100) : 0;
    const resolvedPct = total ? Math.round((resolvedCount / total) * 100) : 0;
    const needsReviewPct = total ? Math.round((needsReviewEmails.length / total) * 100) : 0;

    let response = `### 📊 Live Classification Distribution\n\n`;
    response += `Here is your current inbox breakdown across **${total} active emails**:\n\n`;
    response += `• **👤 CLIENT_TO_REPLY**: ${clientApprovalEmails.length} (${clientPct}%) — Strategic emails requiring executive client decision\n`;
    response += `• **🤖 ASSISTANT_TO_REPLY**: ${assistantEmails.length} (${assistantPct}%) — Routine & administrative tasks for the assistant\n`;
    response += `• **📁 NO_REPLY_NEEDED**: ${resolvedCount} (${resolvedPct}%) — Newsletters, receipts, automated notifications\n`;
    response += `• **⚠️ NEEDS_REVIEW**: ${needsReviewEmails.length} (${needsReviewPct}%) — Ambiguous threads flagged for manual review\n\n`;
    response += `Every incoming message is analyzed in real time. You can manually adjust any classification anytime.`;

    return {
      response,
      type: 'classification_stats',
      suggestions: [
        'Which emails require client approval?',
        'What needs assistant reply?',
        'What needs attention?'
      ]
    };
  }

  // Reclassification / misclassified queries
  if (q.includes('reclassify') || q.includes('misclassified') || q.includes('override')) {
    let response = `### 🏷️ How to Reclassify Emails\n\n`;
    response += `You have full control to override any AI classification:\n\n`;
    response += `1. **Open Conversation**: Click any email in your inbox or category view.\n`;
    response += `2. **Select Classification**: In the top action bar or side panel, click **Classify** and pick **Client**, **Assistant**, or **No Reply**.\n`;
    response += `3. **Instant Audit**: The email immediately moves to the correct workflow, and the action is recorded in your audit log.\n\n`;
    if (needsReviewEmails.length > 0) {
      response += `Currently, there are **${needsReviewEmails.length} emails** in **NEEDS_REVIEW** waiting for triage.`;
    } else {
      response += `All of your current emails are fully classified!`;
    }

    return {
      response,
      type: 'reclassify_guidance',
      suggestions: [
        'Which emails require client approval?',
        'What needs attention?',
        'Summarize my inbox'
      ]
    };
  }

  // Waiting for / pending follow-ups
  if (
    q.includes('waiting for') ||
    q.includes('waiting on') ||
    q.includes('follow up') ||
    q.includes('follow-up')
  ) {
    let response = `### ⏳ Pending & Follow-up Tracking\n\n`;
    if (clientApprovalEmails.length > 0) {
      response += `**You are currently waiting on ${clientApprovalEmails.length} client decisions**:\n`;
      clientApprovalEmails.slice(0, 3).forEach(e => {
        response += `• **${e.sender?.name || e.sender?.email}**: *${e.subject}*\n`;
      });
      response += `\n`;
    } else {
      response += `No outstanding items are currently awaiting client response.\n\n`;
    }
    response += `💡 **Recommendation**: For emails pending over 48 hours, send a quick reminder to keep projects moving.`;
    return {
      response,
      type: 'pending_summary',
      suggestions: [
        'Which emails require client approval?',
        'Draft a professional reply',
        'Summarize my inbox'
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 6. DRAFT A REPLY (Context-Aware Drafting)
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('draft') ||
    q.includes('reply') ||
    q === 'professional' ||
    q === 'friendly' ||
    q === 'formal' ||
    q === 'concise' ||
    q.includes('write a response')
  ) {
    // Determine tone
    let tone = 'professional';
    if (q.includes('friendly')) tone = 'friendly';
    else if (q.includes('formal')) tone = 'formal';
    else if (q.includes('concise') || q.includes('brief')) tone = 'concise';

    // Find the best target email:
    // 0. Use context email if provided
    let target = context.email;

    // 1. Check if user mentioned a sender or subject
    if (!target) {
      target = emails.find(e => {
        const sender = (e.sender?.name || e.sender?.email || '').toLowerCase();
        const subj = (e.subject || '').toLowerCase();
        return q.includes(sender) || (subj.length > 5 && q.includes(subj));
      });
    }

    // 2. Otherwise pick top client-to-reply or assistant-to-reply or first email
    if (!target) {
      target = clientApprovalEmails[0] || assistantEmails[0] || emails[0];
    }

    if (!target) {
      return {
        response: `I'd be glad to draft a reply! Please sync your inbox or mention which contact you'd like me to write to.`,
        type: 'draft',
        suggestions: ['Summarize my inbox', 'Which emails require client approval?']
      };
    }

    const draft = generateContextualDraft(target, tone);

    let response = `### 📝 Draft Reply (${draft.tone.toUpperCase()} TONE)\n\n`;
    response += `**To**: \`${draft.to}\`\n`;
    response += `**Subject**: \`${draft.subject}\`\n\n`;
    response += `\`\`\`text\n${draft.body}\n\`\`\`\n\n`;
    response += `Would you like me to adjust this to a different tone (friendly, concise, or formal), or customize any specific detail?`;

    return {
      response,
      type: 'draft_reply',
      suggestions: [
        'Make it more concise',
        'Change tone to friendly',
        'Which emails require client approval?'
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 6. SPECIFIC SENDER / TOPIC SEARCH (e.g. "Indeed", "Instacart", "ByteByteGo", "Unstop", "NextRaise")
  // ─────────────────────────────────────────────────────────────
  const matchedEmail = emails.find(e => {
    const sName = (e.sender?.name || '').toLowerCase();
    const sEmail = (e.sender?.email || '').toLowerCase();
    const sSubj = (e.subject || '').toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 2);
    return words.some(w => sName.includes(w) || sEmail.includes(w) || sSubj.includes(w));
  });

  if (matchedEmail) {
    const sender = matchedEmail.sender?.name || matchedEmail.sender?.email;
    const summary = cleanText(matchedEmail.classification?.summary || matchedEmail.preview || 'No summary available');
    const classification = matchedEmail.classification?.type || 'NEEDS_REVIEW';
    const reason = cleanText(matchedEmail.classification?.reason || 'No specific reasoning recorded');
    const dateStr = formatEmailDate(matchedEmail.createdAt);

    let response = `### 📨 Found Conversation: "${matchedEmail.subject}"\n\n`;
    response += `• **From**: ${sender}\n`;
    response += `• **Received**: ${dateStr}\n`;
    response += `• **Classification**: \`${classification}\`\n`;
    response += `• **Summary**: ${summary}\n`;
    response += `• **AI Reasoning**: ${reason}\n\n`;
    response += `Would you like me to draft a reply for this email?`;

    return {
      response,
      type: 'email_detail',
      suggestions: [
        `Draft professional reply for ${sender.split(' ')[0]}`,
        'Which emails require client approval?',
        'Summarize my inbox'
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 7. UPCOMING MEETINGS & CALENDAR
  // ─────────────────────────────────────────────────────────────
  if (q.includes('meeting') || q.includes('calendar') || q.includes('schedule') || q.includes('appointment')) {
    if (meetings.length === 0) {
      return {
        response: `### 📅 Calendar Schedule\n\nYou currently have **0 upcoming meetings** scheduled in MailPilot. When meeting requests arrive via email, I will automatically detect them and help schedule them.`,
        type: 'meetings',
        suggestions: ['Summarize my inbox', 'Which emails require client approval?']
      };
    }

    let response = `### 📅 Upcoming Meetings (${meetings.length})\n\n`;
    meetings.forEach((m, idx) => {
      let d = 'TBD';
      try {
        if (m.date) {
          d = new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch {}
      response += `**${idx + 1}. ${m.title}**\n`;
      response += `• **Date & Time**: ${d} at ${m.time || 'TBD'}\n`;
      if (m.location) response += `• **Location**: ${m.location}\n`;
      response += `\n`;
    });

    return {
      response,
      type: 'meetings',
      suggestions: ['What emails need my attention?', 'Summarize my inbox']
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 8. DEFAULT / GENERAL EXECUTIVE INTELLIGENCE
  // ─────────────────────────────────────────────────────────────
  return {
    response: `I'm your **MailPilot AI Executive Assistant**. I have live access to your ${emails.length} inbox conversations and calendar.\n\nHere are some concrete things you can ask me:\n• *"Which emails require client approval?"* — Lists pending strategic decisions\n• *"What needs attention?"* — Prioritized action items for today\n• *"Draft a reply for [Sender]"* — Instantly drafts a ready-to-send response\n• *"Summarize my inbox"* — Real-time breakdown of all unread and active threads\n\nHow can I help streamline your inbox right now?`,
    type: 'help',
    suggestions: [
      'Which emails require client approval?',
      'What needs attention?',
      'Summarize my inbox'
    ]
  };
}

module.exports = {
  processExecutiveQuery,
  generateContextualDraft,
  formatEmailDate
};
