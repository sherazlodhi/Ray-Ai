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
  X,
  Crown,
  Video,
  Flame,
  Terminal
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
  onOpenVideoGen,
  onOpenProModal,
  onOpenDevControls,
  onLimitExceeded
}) {
  const isAuth = !!user;
  const isPro = !!userStats?.isPro;
  const proDaysCount = userStats?.proDaysCount || 0;
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

          {/* Pro Streak Tracker / Pro Status Card */}
          <div
            onClick={onOpenProModal}
            className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
              isPro
                ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-amber-500/40 hover:border-amber-400'
                : 'bg-[#242628] hover:bg-[#2b2d30] border-amber-500/25 hover:border-amber-500/50'
            }`}
            title={isPro ? "Ray AI Pro Active (Unlimited Everything)" : "Ask 4 questions/day for 30 days to earn Pro!"}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-gray-200">
                <Crown className={`w-3.5 h-3.5 ${isPro ? 'text-amber-400' : 'text-amber-400/80'}`} />
                {isPro ? 'Ray AI Pro' : 'Pro Streak'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isPro 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {isPro ? '👑 Unlocked' : `${proDaysCount} / 30 Days`}
              </span>
            </div>

            {!isPro && (
              <>
                <div className="w-full bg-[#18191a] h-1.5 rounded-full overflow-hidden my-1">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (proDaysCount / 30) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>4 questions/day</span>
                  <span className="text-amber-300 font-medium">View perks →</span>
                </div>
              </>
            )}

            {isPro && (
              <div className="text-[10px] text-amber-300/90 flex items-center justify-between">
                <span>Unlimited Art, Uploads & Videos</span>
                <span className="text-amber-400">👑 Active</span>
              </div>
            )}
          </div>

          {/* Creation & Upload limits grid */}
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
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
              title={isPro ? "Create unlimited images with Pro" : isAuth ? "Create image (5/day)" : "Sign in to create images"}
            >
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-purple-400" />
                  <span className="truncate">Art</span>
                </span>
                <span className={`font-semibold ${isPro ? 'text-amber-300 text-[10px]' : isAuth ? 'text-gray-300' : 'text-purple-400 text-[10px]'}`}>
                  {isPro ? '👑 Unltd' : isAuth ? `${imagesCreated}/5` : 'Sign in'}
                </span>
              </div>
              <div className="w-full bg-[#18191a] h-1 rounded-full overflow-hidden">
                <div 
                  className={`${isPro ? 'bg-amber-400' : 'bg-purple-500'} h-full transition-all`}
                  style={{ width: `${isPro ? 100 : isAuth ? Math.min(100, (imagesCreated / 5) * 100) : 0}%` }}
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
              title={isPro ? "Upload unlimited photos with Pro" : isAuth ? "Upload photo (5/day)" : "Sign in to upload photos"}
            >
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1">
                  <Upload className="w-3 h-3 text-teal-400" />
                  <span className="truncate">Photos</span>
                </span>
                <span className={`font-semibold ${isPro ? 'text-amber-300 text-[10px]' : isAuth ? 'text-gray-300' : 'text-teal-400 text-[10px]'}`}>
                  {isPro ? '👑 Unltd' : isAuth ? `${imagesUploaded}/5` : 'Sign in'}
                </span>
              </div>
              <div className="w-full bg-[#18191a] h-1 rounded-full overflow-hidden">
                <div 
                  className={`${isPro ? 'bg-amber-400' : 'bg-teal-500'} h-full transition-all`}
                  style={{ width: `${isPro ? 100 : isAuth ? Math.min(100, (imagesUploaded / 5) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* AI Video widget */}
            <div 
              onClick={() => {
                if (!isAuth) {
                  onLimitExceeded?.('pro_required');
                } else if (!isPro) {
                  onOpenProModal();
                } else {
                  onOpenVideoGen();
                }
              }}
              className={`bg-[#242628] p-2 rounded-lg border border-[#333537] flex flex-col gap-1 cursor-pointer hover:bg-[#2b2d30] transition-all`}
              title={isPro ? "Generate AI Video (Pro Unlimited)" : "AI Video (Pro Exclusive)"}
            >
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3 text-amber-400" />
                  <span className="truncate">Video</span>
                </span>
                <span className={`font-semibold text-[10px] ${isPro ? 'text-amber-300' : 'text-amber-400/80'}`}>
                  {isPro ? '👑 Ready' : '👑 Pro'}
                </span>
              </div>
              <div className="w-full bg-[#18191a] h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full transition-all"
                  style={{ width: `${isPro ? 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 text-center">
            {isPro ? 'Ray AI Pro Active • Unlimited Access' : 'All limits reset daily at midnight'}
          </div>

          {/* User profile / Sign in button */}
          {isAuth ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 truncate">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow ${
                  isPro 
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-black' 
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                }`}>
                  {isPro ? '👑' : (user.name ? user.name[0].toUpperCase() : 'U')}
                </div>
                <div className="truncate text-xs">
                  <div className="font-medium text-gray-200 truncate flex items-center gap-1">
                    <span>{user.name}</span>
                    {isPro && <Crown className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className={`text-[10px] ${isPro ? 'text-amber-400 font-semibold' : 'text-emerald-400'}`}>
                    {isPro ? '👑 Pro Member' : 'Unlimited Member'}
                  </div>
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
          {/* Dev Testing Controls Button */}
          <button
            onClick={onOpenDevControls}
            className="w-full py-1.5 px-2.5 bg-[#17191b] hover:bg-[#202327] text-gray-400 hover:text-cyan-300 border border-[#2e3135] hover:border-cyan-500/40 rounded-xl text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Open Developer Testing Controls (Code Access)"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dev Testing Controls</span>
          </button>
        </div>
      </aside>
    </>
  );
}
