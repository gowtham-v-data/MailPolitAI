import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Sparkles, Mail, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = [
  { title: 'Welcome', desc: 'Let\'s get you set up' },
  { title: 'Connect Email', desc: 'Link your email accounts' },
  { title: 'All Set', desc: 'You\'re ready to go' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${i <= step ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          {step === 0 && (
            <>
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Welcome to MailPilot AI</h2>
              <p className="text-slate-500 mb-2">Your intelligent email management assistant.</p>
              <p className="text-slate-500 mb-8 text-sm">MailPilot AI uses artificial intelligence to classify your emails, determine who should respond, and help you manage your inbox efficiently.</p>
              <button onClick={() => setStep(1)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Connect Your Email</h2>
              <p className="text-slate-500 mb-6 text-sm">Choose a provider to connect your client's email account.</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'gmail', name: 'Gmail', emoji: '📧', color: 'border-red-200 hover:bg-red-50' },
                  { id: 'outlook', name: 'Outlook', emoji: '📬', color: 'border-blue-200 hover:bg-blue-50' },
                ].map((p) => (
                  <button key={p.id} onClick={() => setConnected(p.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${connected === p.id ? 'border-indigo-500 bg-indigo-50' : `border-slate-200 ${p.color}`}`}>
                    <span className="text-3xl block mb-2">{p.emoji}</span>
                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                    {connected === p.id && <p className="text-xs text-indigo-600 mt-1 font-medium">✓ Connected</p>}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep(2)} disabled={!connected}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">You're All Set! 🎉</h2>
              <p className="text-slate-500 mb-2">Your inbox is connected and ready.</p>
              <p className="text-slate-500 mb-8 text-sm">MailPilot AI is now analyzing your emails and classifying them automatically. Head to your dashboard to get started.</p>
              <button onClick={() => navigate('/')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
