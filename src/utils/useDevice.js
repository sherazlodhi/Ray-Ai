import { useState, useEffect } from 'react';

/**
 * Custom React hook for comprehensive device and viewport detection.
 * Accurately detects Mobile, Tablet, and Desktop form factors, touch capabilities, and orientation.
 */
export function useDevice() {
  const [device, setDevice] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        deviceType: 'desktop',
        orientation: 'landscape',
        width: 1200,
        height: 800
      };
    }
    return evaluateDevice();
  });

  function evaluateDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ua = navigator.userAgent || '';
    const maxTouch = navigator.maxTouchPoints || 0;
    const isTouch = maxTouch > 0 || 'ontouchstart' in window;

    // Detect mobile/tablet user agents (including iPadOS desktop mode)
    const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isIPad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && maxTouch > 1);
    const isTabletUA = isIPad || /Tablet|PlayBook|Silk/i.test(ua);

    let deviceType = 'desktop';
    if (width < 640 || (isMobileUA && width < 768 && !isTabletUA)) {
      deviceType = 'mobile';
    } else if (width <= 1024 || isTabletUA) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }

    const orientation = height >= width ? 'portrait' : 'landscape';

    return {
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isTouch,
      deviceType,
      orientation,
      width,
      height
    };
  }

  useEffect(() => {
    const handleResize = () => setDevice(evaluateDevice());
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return device;
}
