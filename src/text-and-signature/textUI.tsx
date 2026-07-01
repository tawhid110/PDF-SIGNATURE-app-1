import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTextStore } from './textstore';
import { useWatermarkStore } from '../Watermark/watermarkstore';
import { Type, PenTool } from 'lucide-react';
import { usePreviewStore } from '../preview/previewStore';
import { OverlayBox } from '../apps/overlays/OverlayBox';
import { CanvasSignatureModal } from '../apps/overlays/CanvasSignatureModal';

import { getVisibleCenterPercentage } from '../utils/positionHelper';

export default function TextUI() {
  const { 
    pdfFile, 
    textValue, 
    setTextValue, 
    isProcessing,
    overlays: textOverlays,
    addOverlay,
    updateOverlay,
    removeOverlay
  } = useTextStore();
  
  const { overlays: watermarkOverlays } = useWatermarkStore();

  const { pageImage } = usePreviewStore();
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [previewContainer, setPreviewContainer] = useState<Element | null>(null);

  const hasEditingOverlay = textOverlays.some(o => o.isEditing) || watermarkOverlays.some(o => o.isEditing);

  // Poll for the preview container since it might render after TextUI or unmount/remount
  useEffect(() => {
    if (!pageImage) {
      setPreviewContainer(null);
      return;
    }
    
    const interval = setInterval(() => {
      // Find the relative wrapper inside the Preview component
      const container = document.getElementById('pdf-page-container');
      if (container && container !== previewContainer) {
        setPreviewContainer(container);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [pageImage, previewContainer]);

  const handleAddText = () => {
    if (!textValue) return;
    const { x, y } = getVisibleCenterPercentage();
    addOverlay({
      type: 'text',
      scope: 'page',
      content: textValue,
      x,
      y,
      width: 150,
      height: 50,
      rotation: 0,
      isEditing: true
    });
    setTextValue('');
  };

  const handleAddSignature = () => {
    setShowSignatureModal(true);
  };

  const handleSaveSignature = (dataUrl: string) => {
    const { x, y } = getVisibleCenterPercentage();
    addOverlay({
      type: 'signature',
      scope: 'page',
      content: dataUrl,
      x,
      y,
      width: 150,
      height: 100,
      rotation: 0,
      isEditing: true
    });
    setShowSignatureModal(false);
  };

  // =========================================================================
  // RENDER INTERFACE
  // =========================================================================
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full flex flex-col md:flex-row gap-6 items-center justify-between">
        
        {/* --- TEXT ANNOTATION SECTION --- */}
        <div className="flex-1 w-full flex items-center gap-3">
          <Type className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Enter text annotation..."
            disabled={hasEditingOverlay}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm disabled:bg-gray-50 disabled:text-gray-400 transition-all font-medium"
          />
          <button
            onClick={handleAddText}
            disabled={!pdfFile || isProcessing || hasEditingOverlay || !textValue}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md whitespace-nowrap min-h-[38px]"
          >
            <Type className="w-4 h-4 shrink-0" />
            <span>Add Text</span>
          </button>
        </div>

        {/* --- SECTION DIVIDER --- */}
        <div className="hidden md:block w-px h-10 bg-gray-200"></div>

        {/* --- SIGNATURE CREATION SECTION --- */}
        <div className="flex-1 w-full flex items-center gap-3">
          <PenTool className="w-5 h-5 text-gray-500" />
          <button
            onClick={handleAddSignature}
            disabled={!pdfFile || isProcessing || hasEditingOverlay}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md whitespace-nowrap min-h-[38px]"
          >
            <PenTool className="w-4 h-4 shrink-0" />
            <span>Add Signature</span>
          </button>
        </div>
        
      </div>


      {/* Render overlays into the shared preview container using a Portal */}
      {previewContainer && createPortal(
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {textOverlays.map(overlay => (
            <OverlayBox
              key={overlay.id}
              overlay={overlay}
              onUpdate={updateOverlay}
              onApply={(o) => updateOverlay({ ...o, isEditing: false })}
              onCancel={(id) => removeOverlay(id)}
            />
          ))}
        </div>,
        previewContainer
      )}

      {showSignatureModal && (
        <CanvasSignatureModal
          onSave={handleSaveSignature}
          onClose={() => setShowSignatureModal(false)}
        />
      )}
    </div>
  );
}
