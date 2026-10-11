import React from 'react';
import { 
  Sparkles, 
  Plus, 
  MessageSquare, 
  Trash2, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Image as ImageIcon, 
  Upload, 
  Infinity as InfinityIcon, 
  HelpCircle,
  Key,
  X
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  setIsOpen,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  userStats,
  user,
  device,
  onOpenAuth,
  onLogout,
  onOpenImageGen,
  onLimitExceeded
}) {
  const isAuth = !!user;
  const questionsAsked = userStats?.questionsAsked || 0;
  const imagesCreated = userStats?.imagesCreated || 0;
  const imagesUploaded = userStats?.imagesUploaded || 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-40
        w-[84vw] max-w-[320px] sm:w-72 bg-[#1e1f20] border-r border-[#333537]
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header & New Chat */}
        <div className="p-3.5 sm:p-4 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-[#1e1f20] rounded-[7px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                </div>
              </div>
              <span className="font-semibold text-lg tracking-tight font-['Outfit']">
                Ray <span className="gemini-gradient-text">AI</span>
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#282a2c] lg:hidden transition-colors"
              title="Close menu"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-full flex items-center gap-3 transition-all text-sm font-medium shadow-sm active:scale-[0.98] ${
              currentChatId === null
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
                : 'bg-[#282a2c] hover:bg-[#333537] border border-[#3c4043] text-gray-200'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase px-3 py-1">
            Recent Conversations
          </div>

          {chats.length === 0 ? (
            <div className="text-xs text-gray-500 px-3 py-4 text-center">
              No conversations yet. Say hello to Ray!
            </div>
          ) : (
            chats.map((c) => {
              const active = c.id === currentChatId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectChat(c.id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`
                    group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm transition-all
                    ${active ? 'bg-[#2b2d30] text-blue-300 font-medium' : 'text-gray-300 hover:bg-[#282a2c] hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className="truncate text-xs">{c.title || 'Conversation'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-gray-500 transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Limits & Status Panel */}
        <div 
          className="p-3 border-t border-[#333537] bg-[#1a1b1c] space-y-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
        >
          {/* Question Limit Widget */}
          <div className="bg-[#242628] rounded-xl p-3 border border-[#333537] text-xs space-y-2">
            <div className="flex items-center justify-between font-medium">
              <span className="text-gray-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                Questions
              </span>
              {isAuth ? (
                <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <InfinityIcon className="w-3 h-3" /> Unlimited
                </span>
              ) : (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  questionsAsked >= 4 
                    ? 'text-red-400 bg-red-500/10 border-red-500/30' 
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}>
                  {questionsAsked} / 4 today
                </span>
              )}
            </div>

            {/* Question progress bar */}
            {!isAuth && (
              <div className="w-full bg-[#18191a] h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    questionsAsked >= 4 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (questionsAsked / 4) * 100)}%` }}
                />
              </div>
            )}

            {!isAuth && (
              <p className="text-[11px] text-gray-400 leading-tight">
                Guest: 4 questions per day (resets daily). Sign in for infinite questions!
              </p>
            )}
          </div>

          {/* Image limits */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* Create Image widget */}
            <div 
              onClick={() => {
                if (!isAuth) {
                  onLimitExceeded?.('guest_image_gen');
                } else {
                  onOpenImageGen();
                }
              }}
              className="bg-[#242628] hover:bg-[#2b2d30] cursor-pointer p-2 rounded-lg border border-[#333537] flex flex-col gap-1 transition-all"
              title={isAuth ? "Click to generate an image (5/day)" : "Sign in to generate images"}
            >
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-purple-400" />
                  Create
                </span>
                <span className={`font-semibold ${isAuth ? 'text-gray-300' : 'text-purple-400 text-[10px]'}`}>
                  {isAuth ? `${imagesCreated}/5` : 'Sign in'}
                </span>
              </div>
              <div className="w-full bg-[#18191a] h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full transition-all"
                  style={{ width: `${isAuth ? Math.min(100, (imagesCreated / 5) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Upload Image widget */}
            <div 
              onClick={() => {
                if (!isAuth) {
                  onLimitExceeded?.('guest_image_upload');
                }
              }}
              className={`bg-[#242628] p-2 rounded-lg border border-[#333537] flex flex-col gap-1 ${!isAuth ? 'hover:bg-[#2b2d30] cursor-pointer' : ''}`}
              title={isAuth ? "Upload photo (5/day)" : "Sign in to upload photos"}
            >
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1">
                  <Upload className="w-3 h-3 text-teal-400" />
                  Upload
                </span>
                <span className={`font-semibold ${isAuth ? 'text-gray-300' : 'text-teal-400 text-[10px]'}`}>
                  {isAuth ? `${imagesUploaded}/5` : 'Sign in'}
                </span>
              </div>
              <div className="w-full bg-[#18191a] h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full transition-all"
                  style={{ width: `${isAuth ? Math.min(100, (imagesUploaded / 5) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 text-center">
            All limits reset daily at midnight
          </div>

          {/* User profile / Sign in button */}
          {isAuth ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate text-xs">
                  <div className="font-medium text-gray-200 truncate">{user.name}</div>
                  <div className="text-[10px] text-emerald-400">Unlimited Member</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#282a2c] hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-[#3c4043] hover:border-red-500/30 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
                title="Sign out of your account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In for Unlimited</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
