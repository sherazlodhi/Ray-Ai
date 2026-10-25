import React from 'react';
import { Menu, Sparkles, Key, LogIn, LogOut, Heart, ShieldAlert, Cpu, Plus, Crown } from 'lucide-react';

export default function Navbar({
  onToggleSidebar,
  detectedVibe,
  user,
  userStats,
  device,
  onOpenAuth,
  onOpenProModal,
  onNewChat,
  onLogout
}) {
  const isPro = !!userStats?.isPro;
  const proDaysCount = userStats?.proDaysCount || 0;

  return (
    <header className="h-14 sm:h-16 border-b border-[#333537] bg-[#1a1b1d]/85 backdrop-blur-md px-2.5 sm:px-4 flex items-center justify-between z-20 sticky top-0 touch-manipulation select-none">
      {/* Left: Mobile hamburger, brand & new chat */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-xl text-gray-300 hover:text-white hover:bg-[#282a2c] lg:hidden transition-colors"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold tracking-tight">Ray <span className="hidden xs:inline sm:inline">AI</span></span>
          </div>

          <button
            onClick={onNewChat}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#282a2c] hover:bg-[#333537] text-gray-200 hover:text-white border border-[#3c4043] text-xs font-medium transition-all shadow-sm active:scale-95"
            title="Start a new chat"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Center: Live Adaptive Tone & Vibe Radar (Hidden on narrow mobile) */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-xs font-medium text-purple-300 max-w-[200px] md:max-w-none truncate">
          <Heart className="w-3.5 h-3.5 text-pink-400 animate-pulse flex-shrink-0" />
          <span className="text-gray-400 hidden lg:inline">Vibe:</span>
          <span className="font-semibold text-purple-200 truncate">{detectedVibe || 'Friendly & Casual ✨'}</span>
        </div>
      </div>

      {/* Right: Pro Badge & Auth buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Pro Subscription Button */}
        <button
          onClick={onOpenProModal}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 min-h-[36px] ${
            isPro
              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400'
              : 'bg-[#242628] hover:bg-[#2d2f31] text-gray-300 border border-[#3c4043]'
          }`}
          title={isPro ? "Ray AI Pro Active (Unlimited Everything)" : "View Ray Pro 30-Day Streak & Perks"}
        >
          <Crown className={`w-3.5 h-3.5 ${isPro ? 'text-amber-400 animate-pulse-subtle' : 'text-amber-400/80'}`} />
          <span>{isPro ? 'Pro' : `${proDaysCount}/30d`}</span>
          {isPro && (
            <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 font-bold">
              VIP
            </span>
          )}
        </button>

        {!user ? (
          <button
            onClick={() => onOpenAuth('signin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95 min-h-[36px]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-[#242628] border border-[#383a3c]">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow ${
                isPro 
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-black' 
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
              }`}>
                {isPro ? '👑' : (user.name ? user.name[0].toUpperCase() : 'U')}
              </div>
              <span className="text-xs font-medium text-gray-200 hidden md:inline max-w-[100px] truncate">
                {user.name}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#282a2c] hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-[#3c4043] hover:border-red-500/30 text-xs font-medium transition-all shadow-sm active:scale-95 min-h-[36px]"
              title="Sign out of your account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
