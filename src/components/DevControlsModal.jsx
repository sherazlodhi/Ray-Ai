import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Key, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Zap, 
  RotateCcw, 
  Crown, 
  Flame, 
  Sparkles, 
  Sliders, 
  User, 
  LogOut, 
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Video
} from 'lucide-react';

const VALID_DEV_CODES = ['hJ5%dK9&sP2#mX7@vF4*', 'raydev123'];

export default function DevControlsModal({
  isOpen,
  onClose,
  userStats,
  user,
  currentChat,
  onUpdateVibe,
  onStatsUpdated,
  onDevLogin,
  onDemoLogin,
  onLogout
}) {
  const [accessCode, setAccessCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('ray_dev_unlocked') === 'true';
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyCode = (e) => {
    e?.preventDefault();
    setError('');
    const clean = accessCode.trim();

    if (VALID_DEV_CODES.includes(clean)) {
      setIsUnlocked(true);
      localStorage.setItem('ray_dev_unlocked', 'true');
      setSuccess('Developer testing controls unlocked!');
      setAccessCode('');
      setTimeout(() => setSuccess(''), 2500);
    } else {
      setError('Invalid developer code.');
    }
  };

  const handleLockPanel = () => {
    setIsUnlocked(false);
    localStorage.removeItem('ray_dev_unlocked');
    setError('');
    setSuccess('');
  };

  const sendDevOverride = async (payload) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('ray_auth_token') || '';
      const guestId = localStorage.getItem('ray_guest_id') || 'guest_default';
      
      const res = await fetch('/api/dev/override-quota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : { 'x-guest-id': guestId })
        },
        body: JSON.stringify({ code: 'hJ5%dK9&sP2#mX7@vF4*', ...payload })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply dev override');

      if (data.userStats) {
        onStatsUpdated?.(data.userStats);
      }
      setSuccess('Applied override successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetLimits = async () => {
    await sendDevOverride({
      questionsAsked: 0,
      imagesCreated: 0,
      imagesUploaded: 0,
      videosCreated: 0
    });
  };

  const handleSimulateQuestionCap = async () => {
    await sendDevOverride({ questionsAsked: 4 });
  };

  const handleSimulateImageCap = async () => {
    await sendDevOverride({ imagesCreated: 5 });
  };

  const handleSimulateUploadCap = async () => {
    await sendDevOverride({ imagesUploaded: 5 });
  };

  const handleTogglePro = async () => {
    const nextPro = !userStats?.isPro;
    await sendDevOverride({ isPro: nextPro, streakDays: nextPro ? 30 : 0 });
  };

  const handleSetStreak = async (days) => {
    await sendDevOverride({ streakDays: days, isPro: days >= 30 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#18191c] border border-cyan-500/40 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-gray-200">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#282a2c] transition-colors"
          title="Close Dev Controls"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400 shadow-inner">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                Developer Testing Controls
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isUnlocked 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Live simulation, VIP permissions, quota testing, & telemetry.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-3.5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-3.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. CODE ACCESS GATE (If locked) */}
        {!isUnlocked ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141517] border border-cyan-500/25 space-y-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white">Enter Access Code</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Type your master access code to unlock developer tools and live overrides.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter code (hJ5%dK9&sP2#mX7@vF4*)"
                  className="w-full px-3.5 py-2.5 bg-[#1b1d20] border border-[#383b40] focus:border-cyan-400 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAccessCode('hJ5%dK9&sP2#mX7@vF4*')}
                  className="px-2.5 py-1.5 bg-[#25282c] hover:bg-[#30343a] text-[11px] text-gray-300 hover:text-white rounded-lg border border-[#3c4046] transition-colors"
                >
                  Quick Fill: <span className="text-cyan-300 font-mono font-bold">hJ5%dK9&sP2#mX7@vF4*</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all min-h-[40px]"
              >
                <Unlock className="w-4 h-4" />
                <span>Verify Code & Unlock Controls</span>
              </button>
            </form>
          </div>
        ) : (
          /* 2. UNLOCKED TESTING DASHBOARD */
          <div className="space-y-4">
            
            {/* VIP / Pro Override Card */}
            <div className="p-3.5 rounded-2xl bg-[#141517] border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>VIP Superpowers Simulator</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  userStats?.isPro 
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {userStats?.isPro ? '👑 VIP PRO ACTIVE' : 'STANDARD TIER'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleTogglePro}
                  disabled={loading}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    userStats?.isPro
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold shadow-md'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{userStats?.isPro ? 'Disable VIP Pro' : '👑 Enable VIP Pro'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStreak(30)}
                  disabled={loading}
                  className="py-2 px-3 bg-[#24272b] hover:bg-[#2d3137] text-gray-200 rounded-xl text-xs font-semibold border border-[#3c4046] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Set 30-Day Streak</span>
                </button>
              </div>

              {/* Streak Presets */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span>Streak Presets:</span>
                <button
                  onClick={() => handleSetStreak(0)}
                  className="px-2 py-0.5 rounded bg-[#202225] hover:bg-[#2a2d32] border border-[#383a3e] text-gray-300"
                >
                  0 Days
                </button>
                <button
                  onClick={() => handleSetStreak(15)}
                  className="px-2 py-0.5 rounded bg-[#202225] hover:bg-[#2a2d32] border border-[#383a3e] text-gray-300"
                >
                  15 Days
                </button>
                <button
                  onClick={() => handleSetStreak(29)}
                  className="px-2 py-0.5 rounded bg-[#202225] hover:bg-[#2a2d32] border border-[#383a3e] text-amber-300"
                >
                  29 Days (1 left)
                </button>
                <button
                  onClick={() => handleSetStreak(30)}
                  className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                >
                  30 Days (Pro)
                </button>
              </div>
            </div>

            {/* Daily Limits & Quotas Simulator */}
            <div className="p-3.5 rounded-2xl bg-[#141517] border border-cyan-500/25">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Quota & Limit Testing</span>
                </div>
                <button
                  onClick={handleResetLimits}
                  disabled={loading}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All to 0</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleSimulateQuestionCap}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-[#202225] hover:bg-[#2a2d32] border border-[#383a3e] flex flex-col items-center gap-1 text-center transition-all active:scale-95"
                >
                  <span className="text-[11px] text-gray-300 font-semibold">Questions Cap</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                    Set 4/4
                  </span>
                </button>

                <button
                  onClick={handleSimulateImageCap}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-[#202225] hover:bg-[#2a2d32] border border-[#383a3e] flex flex-col items-center gap-1 text-center transition-all active:scale-95"
                >
                  <span className="text-[11px] text-gray-300 font-semibold">Art Cap</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    Set 5/5
                  </span>
                </button>

                <button
                  onClick={handleSimulateUploadCap}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-[#202225] hover:bg-[#2a2d32] border border-[#383a3e] flex flex-col items-center gap-1 text-center transition-all active:scale-95"
                >
                  <span className="text-[11px] text-gray-300 font-semibold">Upload Cap</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
                    Set 5/5
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
                <span>Questions Asked: <strong className="text-white">{userStats?.questionsAsked || 0}</strong></span>
                <span>Art: <strong className="text-white">{userStats?.imagesCreated || 0}</strong></span>
                <span>Uploads: <strong className="text-white">{userStats?.imagesUploaded || 0}</strong></span>
              </div>
            </div>

            {/* Quick Account Switcher */}
            <div className="p-3.5 rounded-2xl bg-[#141517] border border-[#303338]">
              <div className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Quick Role Switcher</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onDevLogin?.();
                    setSuccess('Switched to Dev Master Account!');
                  }}
                  className="py-2 px-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 rounded-xl text-[11px] font-bold text-amber-200 text-center transition-all active:scale-95"
                >
                  👑 Dev VIP
                </button>

                <button
                  onClick={() => {
                    onDemoLogin?.();
                    setSuccess('Switched to Standard Member!');
                  }}
                  className="py-2 px-2.5 bg-[#202225] hover:bg-[#2a2d32] border border-[#383a3e] rounded-xl text-[11px] font-semibold text-gray-300 text-center transition-all active:scale-95"
                >
                  👤 Standard Free
                </button>

                <button
                  onClick={() => {
                    onLogout?.();
                    setSuccess('Switched to Guest Session!');
                  }}
                  className="py-2 px-2.5 bg-[#202225] hover:bg-[#2a2d32] border border-[#383a3e] rounded-xl text-[11px] font-semibold text-gray-400 text-center transition-all active:scale-95"
                >
                  🚪 Guest
                </button>
              </div>
            </div>

            {/* Vibe / Tone Tester */}
            <div className="p-3.5 rounded-2xl bg-[#141517] border border-[#303338]">
              <div className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Force Ray Vibe Matching</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                {[
                  'Friendly & Casual ✨',
                  'Playful & Teasing 😏',
                  'Chill & Bro 🤙',
                  'Deep & Intellectual 🧠',
                  'Empathetic & Warm 💖',
                  'Hyper-Excited 🎉'
                ].map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => {
                      onUpdateVibe?.(vibe);
                      setSuccess(`Vibe forced to: ${vibe}`);
                      setTimeout(() => setSuccess(''), 2000);
                    }}
                    className={`p-1.5 rounded-lg border text-left truncate transition-all ${
                      currentChat?.detectedVibe === vibe
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200 font-bold'
                        : 'bg-[#202225] hover:bg-[#2a2d32] border-[#383a3e] text-gray-300'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer controls: Lock or Reset */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                onClick={handleLockPanel}
                className="text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Lock Dev Panel</span>
              </button>

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="text-red-400/80 hover:text-red-300 flex items-center gap-1 transition-colors"
                title="Wipes local storage and reloads app"
              >
                <span>Factory Reset Local State</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
