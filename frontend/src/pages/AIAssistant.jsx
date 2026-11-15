import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../api';
import { Sparkles, Send, User, Bot, MessageSquare } from 'lucide-react';

const QUICK_ACTIONS = [
  'What emails need my attention?',
  'Show client approvals pending',
  'Summarize my inbox',
  'Help me draft a reply',
  'What am I waiting for?',
  'Show upcoming meetings',
];

export default function AIAssistant() {
  const { selectedClient } = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hi! I'm your **MailPilot AI Assistant**. I can help you understand your inbox, summarize conversations, draft replies, and more.\n\nTry asking me:\n• \"What emails need my attention?\"\n• \"Summarize this conversation\"\n• \"Draft a professional reply\"\n• \"Which emails require client approval?\"\n\nWhat would you like to know?",
      suggestions: ['What needs attention?', 'Summarize my inbox', 'Show client-pending items'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
        content: res.data.response || 'I\'m here to help! Could you rephrase your question?',
        suggestions: res.data.suggestions || [],
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "I understand you're asking about your emails. Let me help!\n\nI can:\n• Classify and prioritize emails\n• Draft replies in various tones\n• Summarize email threads\n• Track follow-ups and deadlines\n\nCould you be more specific about what you'd like me to help with?",
        suggestions: ['Show priority emails', 'Draft a reply', 'Summarize inbox'],
      }]);
    }
    setIsTyping(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/• /g, '&bull; ');
      return <p key={i} className={line === '' ? 'h-2' : ''} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="h-[calc(100vh-65px)] flex">
      {/* Sidebar - Quick Actions */}
      <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col p-4">
        <h3 className="font-semibold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" /> Quick Actions
        </h3>
        <div className="space-y-2">
          {QUICK_ACTIONS.map((action) => (
            <button key={action} onClick={() => sendMessage(action)}
              className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-slate-900">AI Email Assistant</h2>
            <p className="text-xs text-slate-500">Ask anything about your emails</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-slate-600" />}
                </div>
                <div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'}`}>
                    {renderContent(msg.content)}
                  </div>
                  {msg.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.suggestions.map((s) => (
                        <button key={s} onClick={() => sendMessage(s)}
                          className="px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors font-medium">
                          {s}
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
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-slate-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your emails..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            <button type="submit" disabled={!input.trim() || isTyping}
              className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
