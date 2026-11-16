import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import ClassificationBadge from '../components/ClassificationBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { CLASSIFICATION_CONFIG, TONE_OPTIONS } from '../utils/constants';
import { stringToColor, getInitials, formatFullDate } from '../utils/helpers';
import {
  ArrowLeft, Star, Archive, CheckCircle2, Eye, EyeOff, Sparkles,
  Copy, Send, RefreshCw, X, ChevronDown, Paperclip, Clock
} from 'lucide-react';

function formatEmailBody(content = '') {
  if (!content) return '';
  let str = String(content);

  // Strip <style> and <script>
  str = str.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  str = str.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');

  // Strip preheader spacer blocks
  str = str.replace(/<[^>]+style\s*=\s*["'][^"']*(display\s*:\s*none|font-size\s*:\s*[01]px|max-height\s*:\s*0|opacity\s*:\s*0)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, ' ');

  // Convert break tags
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<\/p>/gi, '\n\n');
  str = str.replace(/<\/div>/gi, '\n');

  // Strip HTML tags if rendering in clean reader mode
  str = str.replace(/<[^>]+>/g, ' ');

  // Decode repetitive &nbsp;&zwnj; and zero-width spacer spam
  str = str.replace(/(&nbsp;|&zwnj;|&zwj;|\u200B|\u200C|\u200D|\uFEFF|\u2007|\u034F|\s){4,}/gi, ' ');

  // Replace common HTML entities
  const map = {
    '&nbsp;': ' ',
    '&zwnj;': '',
    '&zwj;': '',
    '&shy;': '',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '...'
  };
  for (const [k, v] of Object.entries(map)) {
    str = str.replaceAll(new RegExp(k, 'gi'), v);
  }

  // Handle numeric entities
  str = str.replace(/&#(\d+);/g, (_, d) => {
    const code = parseInt(d, 10);
    if (code === 8204 || code === 8205 || code === 8203 || code === 65279) return '';
    return String.fromCharCode(code);
  });

  // Remove zero-width & invisible spaces
  str = str.replace(/[\u200B-\u200D\uFEFF\u034F\u2007\u00A0]+/g, ' ');

  // Collapse empty lines
  str = str.replace(/[ \t]+/g, ' ');
  str = str.replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

  // Strip stub banner if present
  str = str.replace(/^To view this email message, open it in a program that understands HTML!?\s*/i, '');

  return str;
}

export default function EmailDetail({ clientView = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [tone, setTone] = useState('professional');
  const [classDropdown, setClassDropdown] = useState(false);
  const [viewMode, setViewMode] = useState('reader'); // 'reader' | 'html'

  useEffect(() => {
    fetchEmail();
  }, [id]);

  const fetchEmail = async () => {
    setLoading(true);
    try {
      const res = await api.getEmail(id);
      setEmail(res.data.email || res.data);
      // Mark as read
      if (res.data.email?.isUnread || res.data.isUnread) {
        api.markRead(id, { isUnread: false }).catch(() => {});
      }
    } catch (err) {
      toast.error('Failed to load email');
    }
    setLoading(false);
  };

  const handleToggleImportant = async () => {
    try {
      await api.toggleImportant(id);
      setEmail(prev => ({ ...prev, isImportant: !prev.isImportant }));
      toast.success(email.isImportant ? 'Removed from important' : 'Marked as important');
    } catch { toast.error('Action failed'); }
  };

  const handleArchive = async () => {
    try {
      await api.archiveEmail(id);
      toast.success('Email archived');
      navigate(-1);
    } catch { toast.error('Archive failed'); }
  };

  const handleComplete = async () => {
    try {
      await api.completeEmail(id);
      toast.success('Conversation completed');
      navigate(-1);
    } catch { toast.error('Action failed'); }
  };

  const handleClassify = async (type) => {
    try {
      await api.classifyEmail(id, { classification: type, reason: 'Manually reclassified' });
      setEmail(prev => ({ ...prev, classification: { ...prev.classification, type, classifiedBy: 'manual' } }));
      setClassDropdown(false);
      toast.success(`Reclassified as ${CLASSIFICATION_CONFIG[type]?.label || type}`);
    } catch { toast.error('Classification failed'); }
  };

  const handleGenerateDraft = async () => {
    setDraftLoading(true);
    setShowDraft(true);
    try {
      const res = await api.aiDraftReply(id, { tone });
      setDraft(res.data.draft?.content || res.data.content || 'Draft generated successfully.');
    } catch {
      setDraft('Thank you for your email. I will review this and get back to you shortly.\n\nBest regards');
    }
    setDraftLoading(false);
  };

  const handleSend = () => {
    toast.success('Reply sent successfully (simulated)');
    setShowDraft(false);
    setDraft('');
  };

  const handleDelegate = async () => {
    try {
      await api.delegateEmail(id);
      toast.success('Delegated to assistant');
      navigate(clientView ? '/client' : -1);
    } catch { toast.error('Delegation failed'); }
  };

  const handleBack = () => {
    if (clientView) {
      navigate('/client');
    } else {
      navigate(-1);
    }
  };

  if (loading) return <div className="p-6"><LoadingSpinner /></div>;
  if (!email) return <div className="p-6 text-center text-slate-500">Email not found</div>;

  const classification = email.classification?.type || 'NEEDS_REVIEW';
  const confidence = email.classification?.confidence || 0;
  const messages = email.messages || [];

  return (
    <div className="p-4 lg:p-6">
      {/* Back button */}
      <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {clientView ? 'Back to Executive View' : 'Back'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left - Conversation */}
        <div className="lg:col-span-3 space-y-4">
          {/* Subject & Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-slate-900">{email.subject}</h1>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <ClassificationBadge classification={classification} />
                <PriorityBadge priority={email.classification?.priority} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => api.markRead(id, { isUnread: !email.isUnread }).then(() => setEmail(p => ({ ...p, isUnread: !p.isUnread })))}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5">
                {email.isUnread ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {email.isUnread ? 'Mark Read' : 'Mark Unread'}
              </button>
              <button onClick={handleToggleImportant}
                className={`px-3 py-1.5 text-xs border rounded-lg inline-flex items-center gap-1.5 ${email.isImportant ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Star className="w-3.5 h-3.5" fill={email.isImportant ? 'currentColor' : 'none'} />
                {email.isImportant ? 'Important' : 'Star'}
              </button>
              <button onClick={handleArchive} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
              <button onClick={handleComplete} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete
              </button>
              {clientView && (
                <button onClick={handleDelegate} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-1.5">
                  Delegate to Assistant
                </button>
              )}

              {/* Classification dropdown */}
              <div className="relative">
                <button onClick={() => setClassDropdown(!classDropdown)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5">
                  Classify <ChevronDown className="w-3 h-3" />
                </button>
                {classDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 w-48">
                    {Object.entries(CLASSIFICATION_CONFIG).map(([key, config]) => (
                      <button key={key} onClick={() => handleClassify(key)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${classification === key ? 'font-medium text-indigo-600' : 'text-slate-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} /> {config.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {messages.map((msg, i) => {
              const fromName = msg.from?.name || msg.from?.email || 'Unknown';
              const color = stringToColor(fromName);
              const hasHtml = Boolean(msg.html || (msg.content && /<[a-z][\s\S]*>/i.test(msg.content)));
              const cleanContent = formatEmailBody(msg.content);

              return (
                <div key={msg.id || i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: color }}>
                        {getInitials(fromName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{fromName}</p>
                        <p className="text-xs text-slate-400 truncate">{msg.from?.email} · {formatFullDate(msg.timestamp)}</p>
                      </div>
                    </div>
                    {hasHtml && (
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setViewMode('reader')}
                          className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'reader' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Clean Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('html')}
                          className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'html' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Rich HTML
                        </button>
                      </div>
                    )}
                  </div>

                  {viewMode === 'html' && hasHtml ? (
                    <div className="mt-2 rounded-lg border border-slate-100 overflow-hidden bg-white">
                      <iframe
                        srcDoc={msg.html || msg.content}
                        className="w-full h-[600px] border-0"
                        sandbox="allow-same-origin allow-popups"
                        title="Formatted email content"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed pl-1 sm:pl-12 font-normal">
                      {cleanContent}
                    </div>
                  )}

                  {msg.attachments?.length > 0 && (
                    <div className="flex gap-2 mt-3 pl-12">
                      {msg.attachments.map((att, j) => (
                        <div key={j} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                          <Paperclip className="w-3 h-3" /> {att.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Draft Reply */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            {!showDraft ? (
              <button onClick={handleGenerateDraft}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors inline-flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Draft AI Reply
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-slate-900">AI Draft Reply</h3>
                  <button onClick={() => { setShowDraft(false); setDraft(''); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-2 mb-3">
                  {TONE_OPTIONS.map((t) => (
                    <button key={t.value} onClick={() => setTone(t.value)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${tone === t.value ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-medium' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {draftLoading ? (
                  <div className="py-8 text-center"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /><p className="text-xs text-slate-400 mt-2">Generating draft...</p></div>
                ) : (
                  <>
                    <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleGenerateDraft} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3" /> Regenerate
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(draft); toast.success('Copied!'); }}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      <button onClick={handleSend} className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-1.5 ml-auto">
                        <Send className="w-3 h-3" /> Send (Simulated)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right - AI Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> AI Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Summary</p>
                <p className="text-sm text-slate-700">{formatEmailBody(email.classification?.summary) || 'No summary available'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Classification</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <ClassificationBadge classification={classification} />
                  <span className="text-xs text-slate-400">({email.classification?.classifiedBy === 'manual' ? 'Manual' : 'AI'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${confidence * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{Math.round(confidence * 100)}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Reasoning</p>
                <p className="text-sm text-slate-600 italic">{formatEmailBody(email.classification?.reason) || 'N/A'}</p>
              </div>
              {email.classification?.suggestedAction && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-xs font-medium text-indigo-700 mb-0.5">Suggested Action</p>
                  <p className="text-sm text-indigo-600">{email.classification.suggestedAction}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Items */}
          {email.extractedInfo?.actionItems?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-sm text-slate-900 mb-3">Action Items</h3>
              <div className="space-y-2">
                {email.extractedInfo.actionItems.map((item, i) => (
                  <label key={i} className="flex items-start gap-2.5 text-sm cursor-pointer group">
                    <input type="checkbox" className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-slate-600 group-hover:text-slate-900">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Classification History */}
          {email.classificationHistory?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Classification History
              </h3>
              <div className="space-y-3">
                {email.classificationHistory.slice(-5).reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${CLASSIFICATION_CONFIG[h.type]?.dotClass || 'bg-slate-400'}`} />
                    <div>
                      <p className="text-xs font-medium text-slate-700">{CLASSIFICATION_CONFIG[h.type]?.label || h.type}</p>
                      <p className="text-xs text-slate-400">by {h.changedBy} · {formatFullDate(h.changedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
