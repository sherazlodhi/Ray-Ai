import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { Send, Image as ImageIcon, Upload, X, Sparkles, Loader2, Video, Crown } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor.js';

export default function InputBar({
  onSendMessage,
  onOpenImageGen,
  onOpenVideoGen,
  onOpenProModal,
  userStats,
  user,
  device,
  disabled,
  onLimitExceeded,
  uploadRef
}) {
  const [text, setText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Expose openFilePicker method to parent ref
  useImperativeHandle(uploadRef, () => ({
    openFilePicker: () => {
      if (!user) {
        onLimitExceeded('guest_image_upload');
        return;
      }
      if (!userStats?.isPro && (userStats?.imagesUploaded >= 5)) {
        onLimitExceeded('upload_image');
        return;
      }
      fileInputRef.current?.click();
    }
  }));

  const isAuth = !!user;
  const isPro = !!userStats?.isPro;
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

  const processFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    if (!isAuth) {
      onLimitExceeded('guest_image_upload');
      return;
    }

    const imageFiles = files.filter(f => 
      (f.type && f.type.startsWith('image/')) || 
      /\.(jpe?g|png|webp|gif|bmp|heic|svg)$/i.test(f.name)
    );

    if (imageFiles.length === 0) return;

    // Check upload limit (Pro members bypass!)
    if (!isPro && imagesUploaded + selectedImages.length + imageFiles.length > 5) {
      onLimitExceeded('upload_image');
      return;
    }

    setIsCompressing(true);
    try {
      const processed = await Promise.all(
        imageFiles.map(async (file) => {
          try {
            return await compressImage(file, 1200, 0.85);
          } catch {
            return null;
          }
        })
      );
      const validImages = processed.filter(Boolean);
      setSelectedImages(prev => {
        const combined = [...prev, ...validImages];
        if (!isPro && imagesUploaded + combined.length > 5) {
          onLimitExceeded('upload_image');
          return combined.slice(0, Math.max(0, 5 - imagesUploaded));
        }
        return combined;
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type && item.type.startsWith('image/'));
    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
      processFiles(files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (disabled || isCompressing) return;

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
    // Pro members have UNLIMITED creations
    if (!isPro && imagesCreated >= 5) {
      onLimitExceeded('create_image');
      return;
    }
    onOpenImageGen();
  };

  const handleVideoGenClick = () => {
    if (!isAuth) {
      onLimitExceeded('pro_required');
      return;
    }
    if (!isPro) {
      onOpenProModal();
      return;
    }
    onOpenVideoGen();
  };

  return (
    <div 
      className="p-2.5 sm:p-4 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent border-t border-white/[0.03] lg:border-none"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))' }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto">
        {/* Selected images preview tray */}
        {(selectedImages.length > 0 || isCompressing) && (
          <div className="mb-2 flex flex-wrap gap-2 p-2 bg-[#1e1f20] border border-[#333537] rounded-xl items-center">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#444] w-14 h-14 sm:w-16 sm:h-16 bg-black flex-shrink-0">
                <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 rounded-full text-white transition-colors"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {isCompressing && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-teal-500/40 bg-teal-500/10 flex flex-col items-center justify-center text-teal-300 text-[10px] gap-1 flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span>Optimizing...</span>
              </div>
            )}

            <div className="text-[11px] text-gray-400 self-center pl-2">
              {isPro
                ? `${selectedImages.length} photo(s) attached • Unlimited Pro uploads active 👑`
                : `${selectedImages.length} photo(s) attached (${imagesUploaded + selectedImages.length}/5 daily used)`
              }
            </div>
          </div>
        )}

        {/* Input box */}
        <div className={`relative bg-[#1e1f20] border ${isDragging ? 'border-teal-400 ring-2 ring-teal-500/40' : 'border-[#383a3c]'} focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/50 rounded-2xl shadow-xl transition-all`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              !isAuth && questionsAsked >= 4
                ? "Daily guest limit reached (4/4 questions used). Resets tomorrow, or sign in for unlimited!"
                : !isAuth
                ? "Ask Ray anything (4 free/day)..."
                : selectedImages.length > 0
                ? "Ask anything about this photo, or hit send..."
                : "Ask Ray anything, share a thought, paste/attach a photo, or create art..."
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
                  if (!isPro && imagesUploaded >= 5) {
                    onLimitExceeded('upload_image');
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] touch-manipulation active:scale-95 ${
                  !isPro && isAuth && imagesUploaded >= 5
                    ? 'text-gray-500 hover:text-gray-400 bg-[#282a2c]/50 cursor-not-allowed'
                    : 'text-teal-300 hover:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20'
                }`}
                title={isPro ? "Upload unlimited photos with Pro" : isAuth ? "Upload photo for Ray Vision analysis (5 per day)" : "Sign in to upload photos"}
              >
                <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  <span className="hidden sm:inline">Upload </span>Photo
                </span>
                <span className="text-[9px] sm:text-[10px] opacity-75">
                  {isPro ? '(Unlimited)' : isAuth ? `(${imagesUploaded}/5)` : '(Sign in)'}
                </span>
              </button>

              {/* Generate image button */}
              <button
                type="button"
                onClick={handleImageGenClick}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] touch-manipulation active:scale-95 ${
                  !isPro && isAuth && imagesCreated >= 5
                    ? 'text-gray-500 hover:text-gray-400 bg-[#282a2c]/50 cursor-not-allowed'
                    : 'text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20'
                }`}
                title={isPro ? "Generate unlimited AI images with Pro" : isAuth ? "Generate an image with AI (5 per day)" : "Sign in to create images"}
              >
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  <span className="hidden sm:inline">Create </span>Art
                </span>
                <span className="text-[9px] sm:text-[10px] opacity-75">
                  {isPro ? '(Unlimited)' : isAuth ? `(${imagesCreated}/5)` : '(Sign in)'}
                </span>
              </button>

              {/* Generate AI Video button (Pro feature) */}
              <button
                type="button"
                onClick={handleVideoGenClick}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] touch-manipulation active:scale-95 ${
                  isPro
                    ? 'text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                    : 'text-amber-400/90 hover:text-amber-300 bg-[#252729] hover:bg-[#2e3033] border border-[#3c4043]'
                }`}
                title={isPro ? "Generate AI Video (Pro Unlimited)" : "AI Video (Exclusive to Pro members - Ask 4 questions/day for 30 days or unlock)"}
              >
                <Video className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                <span className="text-[11px] sm:text-xs">
                  <span className="hidden sm:inline">AI </span>Video
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5" />
                  <span>Pro</span>
                </span>
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={disabled || isCompressing || (!text.trim() && selectedImages.length === 0)}
              className={`min-w-[40px] min-h-[40px] sm:min-w-[38px] sm:min-h-[38px] p-2 rounded-xl transition-all flex items-center justify-center flex-shrink-0 touch-manipulation ${
                disabled || isCompressing || (!text.trim() && selectedImages.length === 0)
                  ? 'bg-[#2b2d30] text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
              }`}
              title="Send message"
            >
              {disabled || isCompressing ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Footer info text */}
        <div className="mt-1.5 sm:mt-2 text-center text-[10px] sm:text-[11px] text-gray-500 truncate px-1">
          {isPro ? (
            <span className="text-amber-400/90">
              👑 <strong className="text-amber-300">PRO MEMBER</strong>: Unlimited questions, unlimited photo uploads, unlimited art & AI video active!
            </span>
          ) : !isAuth ? (
            <span>
              Guest mode: <strong className="text-gray-400">{Math.max(0, 4 - questionsAsked)}/4</strong> free questions left today • Resets daily • Sign in to unlock Pro
            </span>
          ) : (
            <span>
              Ray Member: <strong className="text-gray-300">Unlimited questions</strong> • Photos: {imagesUploaded}/5 • Art: {imagesCreated}/5 • Ask 4 questions/day to unlock Pro!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
