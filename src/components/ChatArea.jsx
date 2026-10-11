import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  User, 
  Heart, 
  Cpu, 
  Zap, 
  ImageIcon, 
  HelpCircle,
  Eye
} from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: '✨',
    title: 'Talk to me like a friend',
    desc: 'Tell me about what you love and let me match your vibe!'
  },
  {
    icon: '🎨',
    title: 'Create an AI image',
    desc: 'Generate an artistic image of a neon cyberpunk city'
  },
  {
    icon: '💡',
    title: 'Ask any question',
    desc: 'Explain quantum physics or help plan a weekend trip'
  },
  {
    icon: '📷',
    title: 'Upload a photo',
    desc: 'Show me an image and ask for feedback or fun details'
  }
];

export default function ChatArea({
  messages = [],
  detectedVibe,
  isGenerating,
  onSelectSuggestion,
  onOpenImageGen,
  userStats,
  user,
  onOpenAuth,
  onViewImage,
  onLimitExceeded
}) {
  const bottomRef = useRef(null);
  const [copiedId, setCopiedId] = React.useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isAuth = !!user;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Empty State / Welcome Hero */}
        {messages.length === 0 ? (
          <div className="py-8 md:py-14 flex flex-col items-center text-center">
            {/* Sparkle Logo */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-1 mb-6 shadow-xl shadow-blue-500/20 animate-pulse-subtle">
              <div className="w-full h-full bg-[#1e1f20] rounded-[22px] flex items-center justify-center">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold font-['Outfit'] mb-3 tracking-tight">
              Meet <span className="gemini-gradient-text">Ray AI</span>
            </h1>

            <p className="text-gray-400 text-sm md:text-base max-w-xl mb-6 leading-relaxed">
              Your adaptive AI companion and friend. I listen, learn how you talk, joke around, give advice, and match your exact vibe!
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-lg">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300">
                ⚡ 4 Free Guest Questions / Day (Resets Daily)
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300">
                ✨ Unlimited with Free Sign In
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-300">
                🎨 5 AI Image Creations / Day (Resets Daily)
              </span>
              <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-medium text-teal-300">
                📷 5 Photo Uploads / Day (Resets Daily)
              </span>
            </div>

            {/* Starter Suggestion Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
              {SUGGESTIONS.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (idx === 1) {
                      if (!isAuth) {
                        onLimitExceeded?.('guest_image_gen');
                      } else {
                        onOpenImageGen();
                      }
                    } else if (idx === 3) {
                      if (!isAuth) {
                        onLimitExceeded?.('guest_image_upload');
                      } else {
                        onSelectSuggestion(item.title);
                      }
                    } else {
                      onSelectSuggestion(item.title);
                    }
                  }}
                  className="p-4 bg-[#1e1f20] hover:bg-[#252729] border border-[#333537] hover:border-blue-500/40 rounded-2xl cursor-pointer transition-all active:scale-[0.98] group"
                >
                  <div className="text-xl mb-1.5">{item.icon}</div>
                  <div className="font-semibold text-sm text-gray-200 group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Message Stream */
          messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 p-0.5 flex-shrink-0 shadow-md">
                    <div className="w-full h-full bg-[#1e1f20] rounded-[10px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[85%] md:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Meta / Subtitle */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-medium text-gray-400">
                      {isUser ? (user?.name || 'You') : 'Ray'}
                    </span>
                    {!isUser && msg.vibe && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                        {msg.vibe}
                      </span>
                    )}
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md'
                        : 'bg-[#1e1f20] border border-[#333537] text-gray-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Uploaded User Images (if any) */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {msg.images.map((img, i) => (
                          <div
                            key={i}
                            onClick={() => onViewImage(img)}
                            className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/20 max-w-[200px] max-h-[160px]"
                          >
                            <img src={img} alt="Uploaded attachment" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Generated Image (if any) */}
                    {msg.generatedImage && (
                      <div className="mb-3 space-y-2">
                        <div 
                          onClick={() => onViewImage(msg.generatedImage)}
                          className="relative group cursor-pointer rounded-xl overflow-hidden border border-purple-500/30 max-w-md shadow-lg"
                        >
                          <img
                            src={msg.generatedImage}
                            alt="Generated creation"
                            className="w-full h-auto object-cover rounded-xl"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white gap-2 font-medium text-xs">
                            <Eye className="w-4 h-4" />
                            <span>Click to enlarge</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={msg.generatedImage}
                            target="_blank"
                            rel="noreferrer"
                            download="ray-ai-art.jpg"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a2c] hover:bg-[#333537] text-xs font-medium text-purple-300 border border-[#3c4043] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Full 1024x1024</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Text Body */}
                    {msg.content && (
                      isUser ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="markdown-body">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )
                    )}
                  </div>

                  {/* Bottom AI action bar (copy button, etc) */}
                  {!isUser && msg.content && (
                    <div className="flex items-center gap-2 mt-1.5 px-1 text-gray-500">
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.content)}
                        className="p-1 hover:text-gray-300 rounded hover:bg-[#282a2c] text-xs flex items-center gap-1 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md">
                    {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing / Generating Indicator */}
        {isGenerating && (
          <div className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 p-0.5 flex-shrink-0 shadow-md">
              <div className="w-full h-full bg-[#1e1f20] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            </div>

            <div className="bg-[#1e1f20] border border-[#333537] rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-gray-400 font-medium">Ray is thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
