import React from 'react';
import { X, AlertCircle, LogIn, Sparkles, Upload, Image as ImageIcon, Lock } from 'lucide-react';

export default function LimitModal({
  isOpen,
  onClose,
  limitType, // 'questions' | 'create_image' | 'upload_image' | 'guest_image_upload' | 'guest_image_gen'
  onOpenAuth
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1f20] border border-[#383a3c] rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#282a2c] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Guest Daily Question Limit Reached */}
        {limitType === 'questions' && (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
              Daily Guest Question Limit Reached
            </h3>

            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              You've used your <strong className="text-amber-400">4 free questions</strong> for today! Your 4 questions reset every day at midnight. To keep chatting right now with <strong className="text-emerald-400">unlimited questions</strong>, sign in or create a free account.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('signin');
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In for Unlimited Questions</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 px-4 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Wait for daily reset
              </button>
            </div>
          </>
        )}

        {/* 2. Guest Attempted Photo Upload */}
        {limitType === 'guest_image_upload' && (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
              Photo Uploads Require Sign In
            </h3>

            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Guests can ask 4 free questions each day. To upload photos and let Ray analyze images, please sign in or create a free account! Members get <strong className="text-teal-400">5 photo uploads every day</strong> (resets daily).
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('signin');
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Upload Photos</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 px-4 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </>
        )}

        {/* 3. Guest Attempted Image Creation */}
        {limitType === 'guest_image_gen' && (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
              Image Creation Requires Sign In
            </h3>

            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Guests can ask 4 free questions each day. To create AI art with Ray, please sign in or create a free account! Members get <strong className="text-purple-400">5 AI image creations every day</strong> (resets daily).
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('signin');
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Create Images</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 px-4 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </>
        )}

        {/* 4. Daily Image Creation Limit (5/5) Reached */}
        {limitType === 'create_image' && (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
              Daily Image Creation Limit (5/5) Reached
            </h3>

            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              You have generated all <strong className="text-purple-400">5 allowed images for today</strong>! Your image creation limit resets every day at midnight. You can continue chatting and asking questions without limits!
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-[#282a2c] hover:bg-[#333537] text-white rounded-xl text-sm font-semibold transition-all"
            >
              Got it
            </button>
          </>
        )}

        {/* 5. Daily Image Upload Limit (5/5) Reached */}
        {limitType === 'upload_image' && (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
              Daily Image Upload Limit (5/5) Reached
            </h3>

            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              You have uploaded <strong className="text-teal-400">5 images today</strong>! Your image upload limit resets every day at midnight. You can continue asking questions and chatting with Ray without limits!
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-[#282a2c] hover:bg-[#333537] text-white rounded-xl text-sm font-semibold transition-all"
            >
              Understood
            </button>
          </>
        )}
      </div>
    </div>
  );
}
