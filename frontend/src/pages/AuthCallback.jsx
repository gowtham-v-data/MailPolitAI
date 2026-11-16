import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processGoogleAuth = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const redirectPath = searchParams.get('redirect') || '/';
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setErrorMessage(decodeURIComponent(errorParam));
        setTimeout(() => navigate(`/login?error=${encodeURIComponent(errorParam)}`), 2500);
        return;
      }

      if (!token) {
        setErrorMessage('Authentication token missing from Google response.');
        setTimeout(() => navigate('/login?error=Authentication+token+missing'), 2500);
        return;
      }

      try {
        let userObj = null;
        if (userParam) {
          userObj = JSON.parse(decodeURIComponent(userParam));
        }

        loginWithToken(token, userObj);

        // Redirect based on user role or redirectPath
        if (userObj?.role === 'client') {
          navigate('/client', { replace: true });
        } else {
          navigate(redirectPath, { replace: true });
        }
      } catch (err) {
        console.error('Failed to parse Google auth payload:', err);
        setErrorMessage('Failed to finalize authentication.');
        setTimeout(() => navigate('/login?error=Invalid+auth+payload'), 2500);
      }
    };

    processGoogleAuth();
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        {errorMessage ? (
          <div>
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Authentication Notice</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{errorMessage}</p>
            <p className="text-xs text-slate-400">Redirecting to sign-in...</p>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Authenticating with Google</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Finalizing your session and securely loading your workspace...
            </p>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
