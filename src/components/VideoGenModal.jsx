import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Sparkles, 
  Crown, 
  Loader2, 
  Film, 
  Compass, 
  Play, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const PRESET_VIDEO_STYLES = [
  'Cinematic 4K',
  'Cyberpunk Neon',
  'Cozy Anime Aesthetic',
  'Drone Nature Flyover',
  'Sci-Fi Space Opera',
  'Hyperlapse Sunset'
];

const CAMERA_MOTIONS = [
  { id: 'zoom', label: 'Smooth Zoom In' },
  { id: 'pan', label: 'Cinematic Pan' },
  { id: 'orbital', label: 'Orbital Dynamic' }
];

export default function VideoGenModal({
  isOpen,
  onClose,
  isPro,
  onOpenProModal,
  onGenerateVideo
}) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic 4K');
  const [selectedMotion, setSelectedMotion] = useState('zoom');
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    if (!isPro) {
      setError('AI Video generation is exclusive to Ray Pro members.');
      onOpenProModal?.();
      return;
    }

    setLoading(true);
    setError('');
    setProgressStep(1);

    const stepInterval = setInterval(() => {
      setProgressStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 1400);

    try {
      await onGenerateVideo(prompt.trim(), selectedStyle, selectedMotion);
      setPrompt('');
      clearInterval(stepInterval);
      onClose();
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Failed to generate video');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setProgressStep(0);
    }
  };

  const handleApplyPreset = (style) => {
    setSelectedStyle(style);
    if (!prompt) {
      setPrompt(`A stunning ${style.toLowerCase()} scene with dynamic camera motion and vivid lighting`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1e1f20] border border-amber-500/30 rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#282a2c] transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#1e1f20] rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
                AI Video Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> PRO
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Transform your ideas into cinematic 1080p motion video
            </p>
          </div>
        </div>

        {/* Not Pro Notice */}
        {!isPro && (
          <div className="my-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-amber-200">Pro Feature Locked</div>
              <p className="text-amber-300/80 mt-0.5 leading-relaxed">
                Video generation requires a Pro subscription. Ask 4 questions daily for a month while signed in to unlock Pro for free!
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProModal?.();
                }}
                className="mt-2 text-[11px] font-bold text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>Check Your 30-Day Pro Streak</span> →
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="my-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Prompt input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Describe your video scene
            </label>
            <textarea
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A neon supercar drifting through rainy Tokyo night streets with reflections and steam..."
              className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#333537] focus:border-amber-500 rounded-xl text-[16px] sm:text-sm text-white placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Style presets */}
          <div>
            <div className="text-[11px] font-medium text-gray-400 mb-1.5 flex items-center gap-1">
              <Film className="w-3 h-3 text-amber-400" />
              <span>Cinematic Styles</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_VIDEO_STYLES.map((style, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(style)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedStyle === style
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-[#282a2c] hover:bg-[#333537] text-gray-300 border border-[#3c4043]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Motion */}
          <div>
            <div className="text-[11px] font-medium text-gray-400 mb-1.5 flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Camera Motion Dynamics</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CAMERA_MOTIONS.map((motion) => (
                <button
                  key={motion.id}
                  type="button"
                  onClick={() => setSelectedMotion(motion.id)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-medium border transition-all ${
                    selectedMotion === motion.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-[#242628] hover:bg-[#2b2d30] text-gray-400 border-[#383a3c]'
                  }`}
                >
                  {motion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading indicator with stages */}
          {loading && (
            <div className="p-3.5 rounded-xl bg-[#242628] border border-amber-500/30 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>
                  {progressStep === 1 && 'Synthesizing 4K visual scene...'}
                  {progressStep === 2 && 'Injecting cinematic camera motion...'}
                  {progressStep >= 3 && 'Finalizing Ray Pro HD Video...'}
                </span>
              </div>
              <div className="w-full bg-[#161617] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-700"
                  style={{ width: `${progressStep === 1 ? 35 : progressStep === 2 ? 70 : 95}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={loading || !prompt.trim() || !isPro}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering Video...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Generate AI Video (1080p)</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-[#282a2c] hover:bg-[#333537] text-gray-300 rounded-xl text-xs sm:text-sm font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
