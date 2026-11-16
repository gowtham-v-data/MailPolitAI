import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../api';
import {
  Sparkles,
  Send,
  User,
  Bot,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Mail,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Which emails require client approval?', icon: User },
  { label: 'What needs assistant reply?', icon: Bot },
  { label: 'What needs attention?', icon: Zap },
  { label: 'Summarize my inbox', icon: Mail },
  { label: 'Show upcoming meetings', icon: Calendar },
  { label: 'View classification stats', icon: CheckCircle2 },
  { label: 'What am I waiting for?', icon: Clock },
];

export default function AIAssistant() {
  const { selectedClient } = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `### 🚀 Welcome to MailPilot AI Executive Assistant\n\nI have real-time visibility into your inbox conversations, meeting schedules, and client approval workflows.\n\n**Here are quick ways to get started:**\n• **"Which emails require client approval?"** — Review pending client decisions\n• **"What needs assistant reply?"** — View administrative tasks for you to handle\n• **"Summarize my inbox"** — Comprehensive live status report\n• **"Draft a professional reply"** — Generate context-aware draft responses\n\nWhat would you like me to inspect?`,
      suggestions: [
        'Which emails require client approval?',
        'What needs assistant reply?',
        'What needs attention?',
        'Summarize my inbox'
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const copyDraft = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'ai',
        content: `### 🚀 Session Reset\n\nI'm ready with real-time access to your inbox. What would you like to review?`,
        suggestions: [
          'Which emails require client approval?',
          'What needs attention?',
          'Summarize my inbox'
        ],
      },
    ]);
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.aiChat({ message: text, clientId: selectedClient?._id });
      const aiMsg = {
        role: 'ai',
        content: res.data.response || 'Inbox inspected. How else may I assist you?',
        suggestions: res.data.suggestions || [],
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `### ⚠️ Connection Notice\n\nUnable to reach executive assistant engine (${err.message || 'Network error'}). Please verify your backend server is active and try again.`,
        suggestions: ['Which emails require client approval?', 'Summarize my inbox'],
      }]);
    }
    setIsTyping(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Helper to format inline markdown (bold, italic, code)
  const formatInline = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800 dark:text-slate-200">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/50">$1</code>');
  };

  // Render rich assistant messages (headers, codeblocks, lists)
  const renderMessageContent = (content, msgIdx) => {
    if (!content) return null;

    // Split on code blocks: ```lang ... ```
    const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: content.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', value: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'text', value: content.substring(lastIndex) });
    }

    return (
      <div className="space-y-3">
        {parts.map((part, pIdx) => {
          if (part.type === 'code') {
            const isCopied = copiedIndex === `${msgIdx}-${pIdx}`;
            return (
              <div key={pIdx} className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 text-slate-100 shadow-md">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-800/80 border-b border-slate-700/60 text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Mail className="w-3.5 h-3.5" /> Ready-to-Send Email Draft
                  </span>
                  <button
                    onClick={() => copyDraft(part.value, `${msgIdx}-${pIdx}`)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors text-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto text-slate-200 selection:bg-indigo-700">
                  {part.value}
                </pre>
              </div>
            );
          }

          // Format regular text lines
          const lines = part.value.split('\n');
          return (
            <div key={pIdx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                  return <div key={lIdx} className="h-1.5" />;
                }

                // Heading 3
                if (trimmed.startsWith('### ')) {
                  const headingText = trimmed.replace(/^###\s+/, '');
                  return (
                    <h3
                      key={lIdx}
                      className="font-bold text-base text-slate-900 dark:text-white pt-1 pb-0.5 border-b border-slate-200/60 dark:border-slate-800"
                      dangerouslySetInnerHTML={{ __html: formatInline(headingText) }}
                    />
                  );
                }

                // Bullet point
                if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                  const bulletText = trimmed.replace(/^[•\-]\s+/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1 text-slate-700 dark:text-slate-300">
                      <span className="text-indigo-500 font-bold select-none">•</span>
                      <span
                        className="flex-1 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatInline(bulletText) }}
                      />
                    </div>
                  );
                }

                return (
                  <p
                    key={lIdx}
                    className="leading-relaxed text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: formatInline(line) }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-65px)] flex bg-slate-50/50 dark:bg-slate-950 transition-colors">
      {/* Sidebar - Quick Actions */}
      <div className="hidden lg:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col p-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Executive Actions
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
            Live
          </span>
        </div>
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => sendMessage(label)}
              className="w-full text-left px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 flex items-center gap-2.5 font-medium"
            >
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleResetChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-200/60 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Assistant Session</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-sm text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                MailPilot AI Executive Assistant
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  Real-time Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected to active inbox • Autonomous triage • Contextual drafting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              title="Reset conversation"
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] lg:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    msg.role === 'user'
                      ? 'bg-indigo-600'
                      : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div
                    className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      renderMessageContent(msg.content, i)
                    )}
                  </div>

                  {msg.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pl-1">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="px-3 py-1 text-xs bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 rounded-full transition-colors font-medium border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Analyzing inbox...</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your inbox, drafts, client items, or meetings..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
