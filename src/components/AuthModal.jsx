import React, { useState } from 'react';
import { X, Sparkles, LogIn, UserPlus, Zap } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
  onAuthSuccess
}) {
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const body = mode === 'signup' ? { email, password, name } : { email, password };

    try {
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

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    const demoEmail = 'friend@example.com';
    const demoPassword = 'password123';

    try {
      // First try to login
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword })
      });

      if (!res.ok) {
        // If not exists, register demo user
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: demoPassword, name: 'Bestie Alex' })
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1f20] border border-[#383a3c] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#282a2c] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Outfit']">
            {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h2>
        </div>

        <p className="text-xs text-gray-400 mb-6">
          Sign in to unlock <strong className="text-emerald-400 font-semibold">unlimited questions</strong> and save your friendship conversations forever!
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* 1-Click Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-4 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all min-h-[40px] touch-manipulation"
        >
          <Zap className="w-4 h-4" />
          <span>1-Click Instant Demo Login (Unlimited Questions)</span>
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-[#333537]"></div>
          <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase">Or with email</span>
          <div className="flex-grow border-t border-[#333537]"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#333537] focus:border-blue-500 rounded-xl text-[16px] sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {mode === 'signup' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setError('');
            }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one for free"}
          </button>
        </div>
      </div>
    </div>
  );
}
