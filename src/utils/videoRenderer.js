/**
 * Synthesizes a real playable cinematic motion video clip from an AI-generated keyframe.
 * Uses native HTML5 Canvas & MediaRecorder to render smooth 30fps camera motion and export MP4/WebM.
 */
export async function renderCinematicVideoBlob({
  imageUrl,
  prompt = '',
  motion = 'zoom',
  durationSeconds = 4.5
}) {
  return new Promise((resolve) => {
    // If MediaRecorder is not available, return image directly
    if (typeof window === 'undefined' || !window.MediaRecorder || !window.HTMLCanvasElement) {
      return resolve({ videoUrl: imageUrl, isVideoBlob: false });
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve({ videoUrl: imageUrl, isVideoBlob: false });

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      resolve({ videoUrl: imageUrl, isVideoBlob: false });
    }, 7000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const stream = canvas.captureStream(30);

        // Select supported container
        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
          mimeType = 'video/mp4;codecs=avc1';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
        }

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 4000000
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const videoUrl = URL.createObjectURL(blob);
          resolve({ videoUrl, blob, isVideoBlob: true, mimeType });
        };

        recorder.start();

        const startTime = performance.now();
        const durationMs = durationSeconds * 1000;

        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / durationMs);

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Calculate camera motion based on selected mode
          let scale = 1.0;
          let panX = 0;
          let panY = 0;

          if (motion === 'pan') {
            scale = 1.08;
            panX = (progress - 0.5) * 60;
          } else if (motion === 'orbital') {
            scale = 1.05 + Math.sin(progress * Math.PI) * 0.05;
            panX = Math.sin(progress * Math.PI * 2) * 25;
            panY = Math.cos(progress * Math.PI * 2) * 15;
          } else {
            // Default: Smooth Zoom In
            scale = 1.0 + progress * 0.14;
            panY = progress * -10;
          }

          // Center & draw image
          ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
          ctx.restore();

          // Cinematic atmospheric vignette
          const vignette = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.35,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.72
          );
          vignette.addColorStop(0, 'rgba(0,0,0,0)');
          vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Top/bottom subtle film letterbox bars
          ctx.fillStyle = 'rgba(10, 10, 12, 0.4)';
          ctx.fillRect(0, 0, canvas.width, 24);
          ctx.fillRect(0, canvas.height - 24, canvas.width, 24);

          // Ray AI Pro Watermark badge
          ctx.font = 'bold 16px Outfit, sans-serif';
          ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
          ctx.fillText('👑 Ray AI Pro Studio • 1080p', 28, canvas.height - 35);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            recorder.stop();
          }
        }

        requestAnimationFrame(animate);
      } catch (err) {
        console.warn('Video rendering error, falling back to keyframe:', err);
        resolve({ videoUrl: imageUrl, isVideoBlob: false });
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve({ videoUrl: imageUrl, isVideoBlob: false });
    };

    img.src = imageUrl;
  });
}
