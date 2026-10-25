import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  Flame, 
  ArrowRight, 
  Zap,
  Calendar,
  Lock
} from 'lucide-react';

export default function ProModal({
  isOpen,
  onClose,
  userStats,
  user,
  onOpenAuth,
  onToggleProSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isAuth = !!user;
  const isPro = !!userStats?.isPro;
  const proDaysCount = userStats?.proDaysCount || 0;
  const proDaysTarget = userStats?.proDaysTarget || 30;
  const questionsAskedToday = userStats?.questionsAsked || 0;
  const progressPercent = Math.min(100, Math.round((proDaysCount / proDaysTarget) * 100));

  const handleSimulatePro = async () => {
    if (!isAuth) {
      onClose();
      onOpenAuth('signin');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('ray_auth_token') || '';
      const res = await fetch('/api/user/toggle-pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPro: !isPro })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update Pro status');
      
      onToggleProSuccess?.(data.userStats);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1e1f20] border border-amber-500/30 rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#282a2c] transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/20 mb-3 animate-pulse-subtle">
            <div className="w-full h-full bg-[#1e1f20] rounded-[14px] flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            Ray AI <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">Pro Subscription</span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md">
            Unlock the ultimate companion powers: <strong className="text-amber-300 font-semibold">AI Video Generation</strong>, plus <strong className="text-white font-semibold">Unlimited Photos & Uploads</strong>!
          </p>
        </div>

        {/* 30-Day Streak Requirement Progress Card */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-b from-[#252321] to-[#1e1d1c] border border-amber-500/20 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400/30" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-200">
                Monthly Streak Requirement
              </span>
            </div>

            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              isPro 
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}>
              {isPro ? '👑 Pro Unlocked!' : `${proDaysCount} / ${proDaysTarget} Days`}
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            Rule: Ask at least <strong className="text-amber-300 font-medium">4 questions every day for 30 days</strong> while signed in to earn your Pro membership for free.
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-[#161617] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5 mb-2">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${isPro ? 100 : progressPercent}%` }}
            />
          </div>

          {/* Today's Status */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
            <span>
              Today's questions: <strong className="text-gray-200">{questionsAskedToday}/4</strong>
            </span>
            <span>
              {questionsAskedToday >= 4 ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Day counted!
                </span>
              ) : (
                <span className="text-amber-400/90 font-medium">
                  Ask {Math.max(0, 4 - questionsAskedToday)} more today
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Pro Benefits Grid */}
        <div className="space-y-3 mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Pro Member Perks
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#252729] border border-[#383a3c] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200">AI Video Generation</h4>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Generate cinematic 1080p AI videos from prompts with camera motion
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#252729] border border-[#383a3c] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200">Unlimited AI Photos</h4>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Create infinite FLUX AI images without the daily 5-image cap
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#252729] border border-[#383a3c] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200">Unlimited Photo Uploads</h4>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Upload and analyze unlimited photos with Ray Vision AI
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#252729] border border-[#383a3c] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200">Pro Badge & Priority</h4>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Stand out with the gold crown badge on your account & chats
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Action Button: Instant Pro Unlock / Streak Completion */}
        <div className="space-y-2">
          {!isAuth ? (
            <button
              onClick={() => {
                onClose();
                onOpenAuth('signin');
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all min-h-[44px]"
            >
              <Zap className="w-4 h-4" />
              <span>Sign In to Track Your 30-Day Pro Streak</span>
            </button>
          ) : (
            <button
              onClick={handleSimulatePro}
              disabled={loading}
              className={`w-full py-3 px-4 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all min-h-[44px] ${
                isPro
                  ? 'bg-[#282a2c] hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-[#3c4043]'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-bold shadow-amber-500/20'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>
                {loading
                  ? 'Updating Pro Status...'
                  : isPro
                  ? 'Downgrade to Standard Member (Demo)'
                  : '👑 Unlock Pro Subscription Now (Demo / 30-Day Completed)'}
              </span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
