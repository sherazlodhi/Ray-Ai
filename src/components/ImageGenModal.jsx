import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';

const PRESET_STYLES = [
  'Cyberpunk neon',
  'Cozy anime aesthetic',
  'Photorealistic 8k',
  'Vibrant 3D digital art',
  'Oil painting masterpiece'
];

export default function ImageGenModal({
  isOpen,
  onClose,
  imagesCreated = 0,
  onGenerateImage
}) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const remaining = Math.max(0, 5 - imagesCreated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    if (imagesCreated >= 5) {
      setError('You have reached the maximum limit of 5 created images.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onGenerateImage(prompt.trim());
      setPrompt('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (style) => {
    setPrompt(prev => prev ? `${prev}, ${style}` : style);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1f20] border border-[#383a3c] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#282a2c] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Outfit']">
            Create an AI Image
          </h2>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <span>Imagine anything, Ray will generate it!</span>
          <span className={`px-2 py-0.5 rounded-full font-semibold border ${
            remaining > 0 ? 'text-purple-300 bg-purple-500/10 border-purple-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'
          }`}>
            {remaining}/5 today (resets daily)
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Describe the image
            </label>
            <textarea
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A cute robotic cat having coffee in a rainy Tokyo street at sunset..."
              className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#333537] focus:border-purple-500 rounded-xl text-[16px] sm:text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
            />
          </div>

          {/* Preset tags */}
          <div>
            <div className="text-[11px] text-gray-400 mb-1.5">Suggested styles:</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_STYLES.map((style, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(style)}
                  className="px-2.5 py-1 rounded-lg bg-[#282a2c] hover:bg-[#333537] text-gray-300 hover:text-white text-xs border border-[#3c4043] transition-colors"
                >
                  + {style}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || remaining === 0 || !prompt.trim()}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Artwork...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Image ({remaining} left)</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-[#282a2c] hover:bg-[#333537] text-gray-300 rounded-xl text-sm font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
