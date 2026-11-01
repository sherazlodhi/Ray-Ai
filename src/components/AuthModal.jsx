import React, { useState, useEffect } from 'react';
import { X, Sparkles, LogIn, UserPlus, Zap, Crown, ShieldCheck, Check, KeyRound } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
  onAuthSuccess
}) {
  const [mode, setMode] = useState(initialMode); // 'signin', 'signup', or 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedDev, setCopiedDev] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'signin');
      setError('');
      setLoading(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please provide both email and password.');
      setLoading(false);
      return;
    }

    try {
      let endpoint = '/api/auth/login';
      let body = { email: cleanEmail, password: cleanPassword };

      if (mode === 'signup') {
        endpoint = '/api/auth/register';
        body = { email: cleanEmail, password: cleanPassword, name: name.trim() || cleanEmail.split('@')[0] };
      } else if (mode === 'reset') {
        endpoint = '/api/auth/reset-password';
        body = { email: cleanEmail, newPassword: cleanPassword };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setError('');
    setLoading(true);
    const devEmail = 'dev@ray.ai';
    const devPassword = 'raydev123';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: devEmail, password: devPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Developer login failed');

      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    const demoEmail = 'friend@example.com';
    const demoPassword = 'password123';

    try {
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword })
      });

      if (!res.ok) {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: demoPassword, name: 'Friend' })
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');

      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDevCredentials = () => {
    setMode('signin');
    setEmail('dev@ray.ai');
    setPassword('raydev123');
    setCopiedDev(true);
    setTimeout(() => setCopiedDev(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1e1f20] border border-[#383a3c] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#282a2c] transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Outfit']">
            {mode === 'signup'
              ? 'Create Your Account'
              : mode === 'reset'
              ? 'Reset Your Password'
              : 'Welcome Back'}
          </h2>
        </div>

        <p className="text-xs text-gray-400 mb-5">
          {mode === 'reset'
            ? 'Enter your email and desired new password to reset and sign in immediately.'
            : 'Sign in to unlock unlimited questions, save your conversations, and claim your VIP superpowers!'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
            <span className="font-semibold text-red-400">Notice:</span>
            <span>{error}</span>
          </div>
        )}

        {/* 1. Privileged Developer Account Card */}
        <div className="mb-4 p-3.5 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/40 rounded-2xl shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Privileged Developer Account</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 font-bold border border-amber-500/40">
              PRO VIP
            </span>
          </div>

          <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">
            Pre-loaded with privileged master permissions: <strong className="text-amber-300">Unlimited Photos</strong>, <strong className="text-amber-300">Unlimited Uploads</strong>, & <strong className="text-amber-300">AI Video Studio</strong>.
          </p>

          <div className="bg-[#141517] p-2 rounded-xl text-[11px] font-mono mb-2.5 border border-[#333537] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-gray-400">Email: <span className="text-amber-300 font-semibold select-all">dev@ray.ai</span></div>
              <div className="text-gray-400">Pass: <span className="text-amber-300 font-semibold select-all">raydev123</span></div>
            </div>
            <button
              type="button"
              onClick={fillDevCredentials}
              className="px-2.5 py-1 bg-[#242628] hover:bg-[#303236] text-[10px] text-gray-300 hover:text-white rounded-lg border border-[#444] transition-colors"
              title="Auto-fill into the form below"
            >
              {copiedDev ? 'Filled! ✓' : 'Auto-fill'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all min-h-[40px] touch-manipulation"
          >
            <Crown className="w-4 h-4 text-black fill-black" />
            <span>1-Click Log In as Dev (Privileged Pro)</span>
          </button>
        </div>

        {/* 1-Click Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-4 py-2 px-4 bg-[#252729] hover:bg-[#2f3235] text-gray-300 hover:text-white border border-[#3c4043] rounded-xl text-xs font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all min-h-[38px] touch-manipulation"
        >
          <Zap className="w-3.5 h-3.5 text-teal-400" />
          <span>1-Click Standard Demo Login</span>
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-[#333537]"></div>
          <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase tracking-wider">
            Or sign in with email
          </span>
          <div className="flex-grow border-t border-[#333537]"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex or Jordan"
                className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#333537] focus:border-blue-500 rounded-xl text-[16px] sm:text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#333537] focus:border-blue-500 rounded-xl text-[16px] sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-300">
                {mode === 'reset' ? 'New Password' : 'Password'}
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError('');
                  }}
                  className="text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'reset' ? 'Enter your new password' : '••••••••'}
              className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#333537] focus:border-blue-500 rounded-xl text-[16px] sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[42px]"
          >
            {mode === 'signup' ? (
              <UserPlus className="w-4 h-4" />
            ) : mode === 'reset' ? (
              <KeyRound className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {loading
                ? 'Please wait...'
                : mode === 'signup'
                ? 'Create Account'
                : mode === 'reset'
                ? 'Set New Password & Sign In'
                : 'Sign In'}
            </span>
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
          {mode === 'reset' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Remember your password? Sign in
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                  setError('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {mode === 'signup'
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one for free"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
