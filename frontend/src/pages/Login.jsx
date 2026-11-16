import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

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

          <div className="mt-8 space-y-3.5 max-w-lg">
            <div className="flex items-start gap-3 text-indigo-100 text-sm font-medium">
              <span className="text-indigo-300 font-mono font-bold select-none text-sm flex-shrink-0 whitespace-nowrap leading-snug">
                -&gt;
              </span>
              <span className="flex-1 leading-snug">Autonomous 4-tier email classification and priority triage</span>
            </div>
            <div className="flex items-start gap-3 text-indigo-100 text-sm font-medium">
              <span className="text-indigo-300 font-mono font-bold select-none text-sm flex-shrink-0 whitespace-nowrap leading-snug">
                -&gt;
              </span>
              <span className="flex-1 leading-snug">Tone-adaptive executive draft generation powered by Gemini AI</span>
            </div>
            <div className="flex items-start gap-3 text-indigo-100 text-sm font-medium">
              <span className="text-indigo-300 font-mono font-bold select-none text-sm flex-shrink-0 whitespace-nowrap leading-snug">
                -&gt;
              </span>
              <span className="flex-1 leading-snug">Live two-way synchronization with Gmail and Microsoft 365</span>
            </div>
            <div className="flex items-start gap-3 text-indigo-100 text-sm font-medium">
              <span className="text-indigo-300 font-mono font-bold select-none text-sm flex-shrink-0 whitespace-nowrap leading-snug">
                -&gt;
              </span>
              <span className="flex-1 leading-snug">Dedicated portal separating assistant workflows from client approvals</span>
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Authentication Option */}
          <a
            href="http://localhost:5000/api/auth/google?mode=login"
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-2xs mb-4"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google</span>
          </a>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">or sign in with email</span>
            </div>
          </div>

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
