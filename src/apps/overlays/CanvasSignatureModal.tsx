import React, { useRef, useState, useEffect } from 'react';
// =========================================================================
// ICONS IMPORT FOR MODAL CONTROLS
// =========================================================================
import { Trash2, Undo2, Check, X } from 'lucide-react';

// --- Types ---
interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

interface CanvasSignatureModalProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export const CanvasSignatureModal: React.FC<CanvasSignatureModalProps> = ({ onSave, onClose }) => {
  // --- Refs & State ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // --- Canvas Setup ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all completed strokes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(stroke => {
      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke && currentStroke.points.length > 0) {
      ctx.beginPath();
      currentStroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  // --- Event Handlers ---
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    // Check if it is a touch event
    const clientX = 'touches' in e 
      ? (e.touches[0] ? e.touches[0].clientX : (e.changedTouches[0] ? e.changedTouches[0].clientX : 0))
      : (e as React.MouseEvent).clientX;
      
    const clientY = 'touches' in e 
      ? (e.touches[0] ? e.touches[0].clientY : (e.changedTouches[0] ? e.changedTouches[0].clientY : 0))
      : (e as React.MouseEvent).clientY;

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    // Scale coordinates to match the internal drawing buffer dimension of the canvas
    return {
      x: (relativeX / rect.width) * canvas.width,
      y: (relativeY / rect.height) * canvas.height
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCoordinates(e);
    if (!point) return;
    setIsDrawing(true);
    setCurrentStroke({ points: [point] });
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !currentStroke) return;
    const point = getCoordinates(e);
    if (!point) return;
    
    setCurrentStroke({
      points: [...currentStroke.points, point]
    });
  };

  const handleEnd = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    setStrokes([...strokes, currentStroke]);
    setCurrentStroke(null);
  };

  // --- Actions ---
  const handleClear = () => {
    setStrokes([]);
  };

  const handleUndo = () => {
    setStrokes(strokes.slice(0, -1));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  // =========================================================================
  // RENDER MODAL INTERFACE
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* --- MODAL HEADER --- */}
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Draw Signature</h2>
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- DRAWING CANVAS CONTAINER --- */}
        <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 overflow-hidden touch-none relative shadow-inner">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-[200px] cursor-crosshair"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
          {strokes.length === 0 && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs font-medium">
              Draw your signature here with your cursor or finger
            </div>
          )}
        </div>

        {/* --- CONTROLS AND ACTION BUTTONS --- */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
          
          {/* Left panel buttons: Clear & Undo */}
          <div className="flex gap-2">
            <button 
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
              title="Clear drawings"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button 
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
              title="Undo last stroke"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          </div>
          
          {/* Right panel button: Save Signature */}
          <button 
            onClick={handleSave}
            disabled={strokes.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm hover:shadow transition-all min-h-[36px]"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Save Signature</span>
          </button>
        </div>

      </div>
    </div>
  );
};
