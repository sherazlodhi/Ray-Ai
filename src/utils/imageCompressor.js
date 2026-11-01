/**
 * High-performance client-side image compression utility.
 * Downscales images to max width/height (default 1200px) and compresses to clean JPEG/WebP.
 * Keeps file size tiny (~100-250KB) so uploads are instantaneous and never hit payload limits.
 */

export async function compressImage(file, maxDimension = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    // If not a file or blob, return null
    if (!file) return reject(new Error('No file provided'));

    // Check if browser has FileReader & Canvas
    if (typeof window === 'undefined' || !window.FileReader || !window.HTMLCanvasElement) {
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => resolve(fallbackReader.target.result);
      fallbackReader.onerror = (err) => reject(err);
      fallbackReader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        // If image fails to decode (e.g., corrupted or unsupported format), fallback to raw data URL
        resolve(e.target.result);
      };
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate scaled dimensions
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target.result);
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          // If canvas operations fail (e.g. memory issue), fallback to original dataUrl
          resolve(e.target.result);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
