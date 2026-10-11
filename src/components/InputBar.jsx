import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Upload, X, Sparkles, Loader2 } from 'lucide-react';

export default function InputBar({
  onSendMessage,
  onOpenImageGen,
  userStats,
  user,
  device,
  disabled,
  onLimitExceeded
}) {
  const [text, setText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const isAuth = !!user;
  const questionsAsked = userStats?.questionsAsked || 0;
  const imagesUploaded = userStats?.imagesUploaded || 0;
  const imagesCreated = userStats?.imagesCreated || 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [text]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!isAuth) {
      onLimitExceeded('guest_image_upload');
      e.target.value = '';
      return;
    }

    // Check upload limit
    if (imagesUploaded + selectedImages.length + files.length > 5) {
      onLimitExceeded('upload_image');
      e.target.value = '';
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImages(prev => {
          if (imagesUploaded + prev.length >= 5) {
            onLimitExceeded('upload_image');
            return prev;
          }
          return [...prev, uploadEvent.target.result];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (disabled) return;

    // Check question limit for guests
    if (!isAuth && questionsAsked >= 4) {
      onLimitExceeded('questions');
      return;
    }

    const trimmed = text.trim();
    if (!trimmed && selectedImages.length === 0) return;

    onSendMessage(trimmed, selectedImages);
    setText('');
    setSelectedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageGenClick = () => {
    if (!isAuth) {
      onLimitExceeded('guest_image_gen');
      return;
    }
    if (imagesCreated >= 5) {
      onLimitExceeded('create_image');
      return;
    }
    onOpenImageGen();
  };

  return (
    <div 
      className="p-2.5 sm:p-4 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent border-t border-white/[0.03] lg:border-none"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Selected images preview tray */}
        {selectedImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 p-2 bg-[#1e1f20] border border-[#333537] rounded-xl">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#444] w-14 h-14 sm:w-16 sm:h-16 bg-black">
                <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 rounded-full text-white transition-colors"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="text-[11px] text-gray-400 self-center pl-2">
              Uploading {selectedImages.length} image(s) ({imagesUploaded + selectedImages.length}/5 used)
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="relative bg-[#1e1f20] border border-[#383a3c] focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/50 rounded-2xl shadow-xl transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !isAuth && questionsAsked >= 4
                ? "Daily guest limit reached (4/4 questions used). Resets tomorrow, or sign in for unlimited!"
                : !isAuth
                ? "Ask Ray anything (4 free/day)..."
                : "Ask Ray anything, share a thought, create art, or attach a photo..."
            }
            rows={1}
            disabled={disabled}
            className="w-full bg-transparent px-3.5 sm:px-4 pt-3 sm:pt-3.5 pb-12 text-[16px] sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none resize-none min-h-[50px] max-h-[160px] leading-relaxed"
          />

          {/* Bottom Action Controls */}
          <div className="absolute bottom-1.5 sm:bottom-2 left-2 right-2 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-hidden">
              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => {
                  if (!isAuth) {
                    onLimitExceeded('guest_image_upload');
                    return;
                  }
                  if (imagesUploaded >= 5) {
                    onLimitExceeded('upload_image');
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] touch-manipulation active:scale-95 ${
                  isAuth && imagesUploaded >= 5
                    ? 'text-gray-500 hover:text-gray-400 bg-[#282a2c]/50 cursor-not-allowed'
                    : 'text-teal-300 hover:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20'
                }`}
                title={isAuth ? "Upload photo for Ray Vision analysis (5 per day)" : "Sign in to upload photos"}
              >
                <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  <span className="hidden sm:inline">Upload </span>Photo
                </span>
                <span className="text-[9px] sm:text-[10px] opacity-75">{isAuth ? `(${imagesUploaded}/5)` : '(Sign in)'}</span>
              </button>

              {/* Generate image button */}
              <button
                type="button"
                onClick={handleImageGenClick}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] touch-manipulation active:scale-95 ${
                  isAuth && imagesCreated >= 5
                    ? 'text-gray-500 hover:text-gray-400 bg-[#282a2c]/50 cursor-not-allowed'
                    : 'text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20'
                }`}
                title={isAuth ? "Generate an image with AI (5 per day)" : "Sign in to create images"}
              >
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  <span className="hidden sm:inline">Create </span>Art
                </span>
                <span className="text-[9px] sm:text-[10px] opacity-75">{isAuth ? `(${imagesCreated}/5)` : '(Sign in)'}</span>
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={disabled || (!text.trim() && selectedImages.length === 0)}
              className={`min-w-[40px] min-h-[40px] sm:min-w-[38px] sm:min-h-[38px] p-2 rounded-xl transition-all flex items-center justify-center flex-shrink-0 touch-manipulation ${
                disabled || (!text.trim() && selectedImages.length === 0)
                  ? 'bg-[#2b2d30] text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
              }`}
              title="Send message"
            >
              {disabled ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Footer info text */}
        <div className="mt-1.5 sm:mt-2 text-center text-[10px] sm:text-[11px] text-gray-500 truncate px-1">
          {!isAuth ? (
            <span>
              Guest mode: <strong className="text-gray-400">{Math.max(0, 4 - questionsAsked)}/4</strong> free questions left today • Resets daily • Sign in for unlimited
            </span>
          ) : (
            <span>
              <strong className="text-gray-300">{user.name}</strong> • Unlimited questions • 5 creations & 5 uploads per day (resets daily)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
