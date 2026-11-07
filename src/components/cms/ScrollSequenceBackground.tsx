import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollSequenceBackgroundProps {
  totalFrames?: number;
}

const formatFrameUrl = (index: number): string => {
  const clamped = Math.min(100, Math.max(1, index));
  const padded = String(clamped).padStart(3, '0');
  return `/frames/ezgif-frame-${padded}.jpg`;
};

const formatFallbackFrameUrl = (index: number): string => {
  const clamped = Math.min(100, Math.max(1, index));
  const padded = String(clamped).padStart(3, '0');
  return `/frames/ezgif-frame-${padded}.jpg`;
};

export const ScrollSequenceBackground: React.FC<ScrollSequenceBackgroundProps> = ({
  totalFrames = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Array<HTMLImageElement | null>>(new Array(totalFrames).fill(null));
  const loadingStatusRef = useRef<Array<'unloaded' | 'loading' | 'loaded' | 'error'>>(
    new Array(totalFrames).fill('unloaded')
  );

  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastDrawnFrameRef = useRef<number>(-1);
  const [hasDrawnFirstFrame, setHasDrawnFirstFrame] = useState<boolean>(false);
  const [loadedPercent, setLoadedPercent] = useState<number>(0);

  // Helper to load a single frame with fallback
  const loadFrame = useCallback(
    (frameIndex: number): Promise<HTMLImageElement | null> => {
      const idx = Math.min(totalFrames - 1, Math.max(0, frameIndex));
      if (imagesRef.current[idx]) {
        return Promise.resolve(imagesRef.current[idx]);
      }
      if (loadingStatusRef.current[idx] === 'loading') {
        return Promise.resolve(null);
      }

      loadingStatusRef.current[idx] = 'loading';

      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = formatFrameUrl(idx + 1);

        img.onload = () => {
          imagesRef.current[idx] = img;
          loadingStatusRef.current[idx] = 'loaded';
          resolve(img);
        };

        img.onerror = () => {
          // Retry with root fallback
          const fallback = new Image();
          fallback.decoding = 'async';
          fallback.src = formatFallbackFrameUrl(idx + 1);
          fallback.onload = () => {
            imagesRef.current[idx] = fallback;
            loadingStatusRef.current[idx] = 'loaded';
            resolve(fallback);
          };
          fallback.onerror = () => {
            loadingStatusRef.current[idx] = 'error';
            resolve(null);
          };
        };
      });
    },
    [totalFrames]
  );

  // Progressive frame loading pipeline
  useEffect(() => {
    let cancelled = false;

    const startLoadingPipeline = async () => {
      // 1. Immediately load frame 0 (first frame)
      const first = await loadFrame(0);
      if (cancelled) return;
      if (first) {
        setLoadedPercent(1);
      }

      // 2. Load keyframes every 10 frames across the full 300 range for instant smooth scrubbing
      const keyframeIndices: number[] = [];
      for (let i = 10; i < totalFrames; i += 10) {
        keyframeIndices.push(i);
      }

      for (let i = 0; i < keyframeIndices.length; i += 6) {
        if (cancelled) return;
        const slice = keyframeIndices.slice(i, i + 6);
        await Promise.all(slice.map((idx) => loadFrame(idx)));
      }

      // 3. Load remaining intermediate frames in small progressive batches
      const remaining: number[] = [];
      for (let i = 1; i < totalFrames; i++) {
        if (loadingStatusRef.current[i] === 'unloaded') {
          remaining.push(i);
        }
      }

      let count = 0;
      for (let i = 0; i < remaining.length; i += 12) {
        if (cancelled) return;
        const slice = remaining.slice(i, i + 12);
        await Promise.all(slice.map((idx) => loadFrame(idx)));
        count += slice.length;
        if (count % 36 === 0) {
          setLoadedPercent(Math.round(((count + keyframeIndices.length) / totalFrames) * 100));
        }
      }
    };

    startLoadingPipeline();

    return () => {
      cancelled = true;
    };
  }, [totalFrames, loadFrame]);

  // Main Canvas Render & Scroll Scrubbing Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const findNearestLoadedImage = (targetIdx: number): HTMLImageElement | null => {
      const rounded = Math.min(totalFrames - 1, Math.max(0, Math.round(targetIdx)));
      if (imagesRef.current[rounded]) {
        return imagesRef.current[rounded];
      }
      for (let offset = 1; offset < totalFrames; offset++) {
        const prev = rounded - offset;
        const next = rounded + offset;
        if (prev >= 0 && imagesRef.current[prev]) {
          return imagesRef.current[prev];
        }
        if (next < totalFrames && imagesRef.current[next]) {
          return imagesRef.current[next];
        }
      }
      return null;
    };

    const drawCover = (img: HTMLImageElement, opacity = 1) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth || 1280;
      const ih = img.naturalHeight || 720;

      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) * 0.5;
      const dy = (ch - dh) * 0.5;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    const render = (frameFloat: number) => {
      const baseIdx = Math.min(totalFrames - 1, Math.max(0, Math.floor(frameFloat)));
      const nextIdx = Math.min(totalFrames - 1, baseIdx + 1);
      const blend = frameFloat - baseIdx;

      const baseImg = imagesRef.current[baseIdx] || findNearestLoadedImage(baseIdx);
      if (!baseImg) return;

      drawCover(baseImg, 1);

      // Smooth cross-fade blending between frames
      const nextImg = imagesRef.current[nextIdx];
      if (nextImg && nextImg !== baseImg && blend > 0.02) {
        drawCover(nextImg, blend);
      }

      if (!hasDrawnFirstFrame) {
        setHasDrawnFirstFrame(true);
      }
    };

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const fraction = Math.min(1, Math.max(0, scrollTop / maxScroll));
      targetFrameRef.current = fraction * (totalFrames - 1);

      // On-demand load neighborhood frames around current scroll position
      const center = Math.round(targetFrameRef.current);
      for (let offset = -2; offset <= 2; offset++) {
        const target = center + offset;
        if (target >= 0 && target < totalFrames) {
          loadFrame(target);
        }
      }
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      lastDrawnFrameRef.current = -1;
      updateScrollProgress();
      render(currentFrameRef.current);
    };

    handleResize();
    updateScrollProgress();

    // Listen to both scroll, touchmove and wheel for instant tactile reaction
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('touchmove', updateScrollProgress, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    const tick = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.002) {
        // Butter-smooth damping interpolation
        currentFrameRef.current += diff * 0.14;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      if (
        Math.abs(currentFrameRef.current - lastDrawnFrameRef.current) > 0.005 ||
        lastDrawnFrameRef.current < 0
      ) {
        render(currentFrameRef.current);
        lastDrawnFrameRef.current = currentFrameRef.current;
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    rafIdRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('touchmove', updateScrollProgress);
      window.removeEventListener('resize', handleResize);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [totalFrames, loadFrame, hasDrawnFirstFrame]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* Instant fallback first frame before canvas paints */}
      <img
        src="/frames/ezgif-frame-001.jpg"
        alt="Smooth scroll background sequence"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          hasDrawnFirstFrame ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Hardware-accelerated canvas for 60fps image sequence scrubbing */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          hasDrawnFirstFrame ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Atmospheric dark contrast veil for WCAG AA typography & glassmorphism card legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/25 to-slate-950/50" />
    </div>
  );
};
