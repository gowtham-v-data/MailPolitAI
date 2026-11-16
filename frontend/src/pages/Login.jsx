import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginWithCredentials = async (loginEmail, loginPass) => {
    setError('');
    setLoading(true);
    const result = await login(loginEmail, loginPass);
    setLoading(false);
    if (result.success) {
      if (result.user?.role === 'client') {
        navigate('/client');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLoginWithCredentials(email, password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-16">
            <img src="/logo.png" alt="MailPilot AI" className="w-14 h-14 object-contain drop-shadow-md flex-shrink-0" />
            <div>
              <span className="text-white font-bold text-xl block leading-tight">MailPilot AI</span>
              <span className="text-indigo-200 text-xs font-medium">Your AI Email Assistant</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            AI-Powered Email<br />Management
          </h1>
          <p className="text-indigo-100 text-lg max-w-md">
            Intelligent email classification, automatic response assignment, and AI-powered assistance for personal assistants.
          </p>

          <div className="mt-8 space-y-3.5 max-w-md">
            <div className="flex items-start gap-3 text-indigo-100 text-sm font-medium">
              <span className="text-indigo-300 font-mono font-bold select-none text-base leading-none mt-0.5">-&gt;</span>
              <span>Autonomous 4-tier email classification and priority triage</span>
            </div>
            <div className="flex items-start gap-3 text-indigo-100 text-sm font-medium">
              <span className="text-indigo-300 font-mono font-bold select-none text-base leading-none mt-0.5">-&gt;</span>
              <span>Tone-adaptive executive draft generation powered by Gemini AI</span>
            </div>
            <div className="flex items-start gap-3 text-indigo-100 text-sm font-medium">
              <span className="text-indigo-300 font-mono font-bold select-none text-base leading-none mt-0.5">-&gt;</span>
              <span>Live two-way synchronization with Gmail and Microsoft 365</span>
            </div>
            <div className="flex items-start gap-3 text-indigo-100 text-sm font-medium">
              <span className="text-indigo-300 font-mono font-bold select-none text-base leading-none mt-0.5">-&gt;</span>
              <span>Dedicated portal separating assistant workflows from client approvals</span>
            </div>
          </div>
        </div>
        <p className="text-indigo-200 text-sm relative z-10">© 2024 MailPilot AI. All rights reserved.</p>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="MailPilot AI" className="w-11 h-11 object-contain flex-shrink-0" />
            <div>
              <span className="font-bold text-lg text-slate-900 block leading-tight">MailPilot AI</span>
              <span className="text-xs text-slate-500 font-medium">Your AI Email Assistant</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
