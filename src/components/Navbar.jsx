import React from 'react';
import { Menu, Sparkles, Key, LogIn, LogOut, Heart, ShieldAlert, Cpu, Plus } from 'lucide-react';

export default function Navbar({
  onToggleSidebar,
  detectedVibe,
  user,
  onOpenAuth,
  onNewChat,
  onLogout
}) {
  return (
    <header className="h-14 border-b border-[#333537] bg-[#1a1b1d]/80 backdrop-blur-md px-4 flex items-center justify-between z-20 sticky top-0">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#282a2c] lg:hidden transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">Ray Intelligence</span>
          </div>

          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#282a2c] hover:bg-[#333537] text-gray-200 hover:text-white border border-[#3c4043] text-xs font-medium transition-all shadow-sm active:scale-95"
            title="Start a new chat"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Center: Live Adaptive Tone & Vibe Radar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-xs font-medium text-purple-300">
          <Heart className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="text-gray-400 hidden md:inline">Friend Vibe:</span>
          <span className="font-semibold text-purple-200">{detectedVibe || 'Friendly & Casual ✨'}</span>
        </div>
      </div>

      {/* Right: Auth */}
      <div className="flex items-center gap-2">
        {/* User Auth Button */}
        {!user ? (
          <button
            onClick={() => onOpenAuth('signin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#242628] border border-[#383a3c]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-gray-200 hidden sm:inline max-w-[120px] truncate">
                {user.name}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#282a2c] hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-[#3c4043] hover:border-red-500/30 text-xs font-medium transition-all shadow-sm active:scale-95"
              title="Sign out of your account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
