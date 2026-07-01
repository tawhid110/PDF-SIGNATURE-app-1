import React, { useRef, useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { usePreviewStore } from '../../preview/previewStore';

// --- Types ---
export interface Overlay {
  id: string;
  type: 'text' | 'signature' | 'watermark';
  content: string; // text string or data URL
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isEditing: boolean;
}

interface OverlayBoxProps {
  overlay: Overlay;
  onUpdate: (overlay: Overlay) => void;
  onApply: (overlay: Overlay) => void;
  onCancel: (id: string) => void;
}

const ResizableText = ({ content, isWatermark }: { content: string, isWatermark?: boolean }) => {
  const textRef = useRef<SVGTextElement>(null);
  const [viewBox, setViewBox] = useState('0 0 100 100');

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      // Add slight padding to avoid clipping
      setViewBox(`${bbox.x - 2} ${bbox.y - 2} ${bbox.width + 4} ${bbox.height + 4}`);
    }
  }, [content]);

  return (
    <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className="pointer-events-none">
      <text 
        ref={textRef} 
        x="0" 
        y="0" 
        dominantBaseline="hanging" 
        fill={isWatermark ? 'rgba(0,0,0,0.3)' : 'black'}
        fontFamily="sans-serif"
        fontWeight={isWatermark ? "bold" : "normal"}
        style={{ whiteSpace: 'pre' }}
      >
        {content}
      </text>
    </svg>
  );
};

export const OverlayBox: React.FC<OverlayBoxProps> = ({
  overlay,
  onUpdate,
  onApply,
  onCancel,
}) => {
  const { zoom } = usePreviewStore();
  // --- Refs & State ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(overlay.rotation);

  // Sync state if prop changes from outside
  useEffect(() => {
    setRotationAngle(overlay.rotation);
  }, [overlay.rotation]);

  // --- Rotation Logic ---
  useEffect(() => {
    if (!isRotating) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      
      if (e.type === 'touchmove' && e.cancelable) {
        e.preventDefault();
      }
      
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate center of the box
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate angle in radians, then convert to degrees
      const radians = Math.atan2(clientY - centerY, clientX - centerX);
      let degrees = radians * (180 / Math.PI) + 90; // Add 90 to make straight up = 0 deg
      
      setRotationAngle(degrees);
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      onUpdate({ ...overlay, rotation: rotationAngle });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isRotating, overlay, onUpdate, rotationAngle]);

  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    setIsRotating(true);
  };

  // --- Rnd Event Handlers ---
  const handleDragStop = (e: any, d: any) => {
    onUpdate({ ...overlay, x: d.x, y: d.y });
  };

  const handleResizeStop = (e: any, direction: any, ref: any, delta: any, position: any) => {
    onUpdate({
      ...overlay,
      width: parseInt(ref.style.width, 10),
      height: parseInt(ref.style.height, 10),
      x: position.x,
      y: position.y,
    });
  };

  // --- Action Handlers ---
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApply(overlay);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel(overlay.id);
  };

  // --- Render ---
  return (
    <Rnd
      scale={zoom}
      size={{ width: overlay.width, height: overlay.height }}
      position={{ x: overlay.x, y: overlay.y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      disableDragging={!overlay.isEditing}
      enableResizing={overlay.isEditing}
      bounds="parent"
      className={`absolute z-10 ${overlay.isEditing ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div 
        ref={containerRef}
        className={`w-full h-full relative group ${overlay.isEditing ? 'border-2 border-dashed border-blue-500' : ''}`}
        style={{ transform: `rotate(${rotationAngle}deg)` }}
      >
        
        {/* Rotate Handle */}
        {overlay.isEditing && (
          <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-11 h-11 bg-white border border-gray-300 rounded-full flex items-center justify-center cursor-crosshair shadow-sm hover:bg-gray-50 pointer-events-auto"
            onMouseDown={handleRotateStart}
            onTouchStart={handleRotateStart}
            title="Drag to rotate"
          >
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-5 bg-blue-500" />
          </div>
        )}

        {/* Content Render */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          {overlay.type === 'signature' ? (
            <img 
              src={overlay.content} 
              alt="Signature" 
              className="w-full h-full object-contain pointer-events-none" 
            />
          ) : (
            <ResizableText content={overlay.content} isWatermark={overlay.type === 'watermark'} />
          )}
        </div>

        {/* Action Buttons */}
        {overlay.isEditing && (
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-2 bg-white p-1.5 rounded-md shadow-md border border-gray-200" style={{ transform: `rotate(${-rotationAngle}deg)` }}>
            <button 
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded hover:bg-green-600 transition-colors pointer-events-auto min-h-[44px] min-w-[70px]"
            >
              Apply
            </button>
            <button 
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors pointer-events-auto min-h-[44px] min-w-[70px]"
            >
              Cancel
            </button>
          </div>
        )}

      </div>
    </Rnd>
  );
};
