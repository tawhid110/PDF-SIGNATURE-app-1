import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWatermarkStore } from './watermarkstore';
import { useTextStore } from '../text-and-signature/textstore';
import { OverlayBox } from '../apps/overlays/OverlayBox';
import { usePreviewStore } from '../preview/previewStore';

import { getVisibleCenterPercentage } from '../utils/positionHelper';

export default function WatermarkUI() {
  const { 
    pdfFile, 
    watermarkText, 
    setWatermarkText, 
    isProcessing,
    overlays: watermarkOverlays,
    addOverlay,
    updateOverlay,
    removeOverlay
  } = useWatermarkStore();

  const { overlays: textOverlays } = useTextStore();

  const { pageImage } = usePreviewStore();
  const [previewContainer, setPreviewContainer] = useState<Element | null>(null);

  const hasEditingOverlay = textOverlays.some(o => o.isEditing) || watermarkOverlays.some(o => o.isEditing);

  useEffect(() => {
    if (!pageImage) {
      setPreviewContainer(null);
      return;
    }
    
    const interval = setInterval(() => {
      const container = document.getElementById('pdf-page-container');
      if (container && container !== previewContainer) {
        setPreviewContainer(container);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [pageImage, previewContainer]);

  const handleAddWatermark = () => {
    const { x, y } = getVisibleCenterPercentage();
    addOverlay({
      type: 'watermark',
      scope: 'document',
      content: watermarkText || 'CONFIDENTIAL',
      x,
      y,
      width: 250,
      height: 60,
      rotation: -45,
      isEditing: true
    });
    setWatermarkText('');
  };

  // =========================================================================
  // RENDER INTERFACE
  // =========================================================================
  return (
    <>
      <div className="flex items-center gap-3 w-full">
        {/* --- Text Input for Watermark Content --- */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="E.G. CONFIDENTIAL OR DR."
            disabled={hasEditingOverlay}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm uppercase bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-all font-medium"
          />
        </div>

        {/* --- Shiny Transparent Glassmorphic Watermark Button --- */}
        <button
          onClick={handleAddWatermark}
          disabled={!pdfFile || isProcessing || hasEditingOverlay || !watermarkText}
          className="group relative overflow-hidden px-5 py-2 bg-white/40 border border-gray-300/60 dark:border-white/10 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-98 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300 min-h-[38px] flex items-center justify-center gap-2 whitespace-nowrap"
          title="Create Watermark overlay"
        >
          {/* Animated shiny shimmer line sweep */}
          <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
          
          {/* Transparent Watermark word with elegant shiny silver/gray metallic text design */}
          <span className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-700/80 via-gray-400 to-gray-700/80 dark:from-white/80 dark:via-gray-300 dark:to-white/80 flex items-center gap-1.5 drop-shadow-sm select-none">
            <svg className="w-3.5 h-3.5 text-gray-500/80 dark:text-gray-300/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Watermark
          </span>
        </button>
      </div>

      {/* --- Overlay Render Portals --- */}
      {previewContainer && createPortal(
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {watermarkOverlays.map(overlay => (
            <OverlayBox
              key={overlay.id}
              overlay={overlay as any} // Cast to any to handle type mismatch gracefully
              onUpdate={(o) => updateOverlay(o as any)}
              onApply={(o) => updateOverlay({ ...o, isEditing: false } as any)}
              onCancel={(id) => removeOverlay(id)}
            />
          ))}
        </div>,
        previewContainer
      )}
    </>
  );
}
