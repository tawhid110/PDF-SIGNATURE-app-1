import React, { useRef } from 'react';

export interface PreviewProps {
  pageImage: string;
  pageIndex: number;
  onClick?: (x: number, y: number, width: number, height: number) => void;
  children?: React.ReactNode;
}

export default function Preview({ pageImage, pageIndex, onClick, children }: PreviewProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to the image
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onClick(x, y, rect.width, rect.height);
  };

  return (
    <div 
      id="pdf-page-container"
      className="relative inline-block border border-gray-200 shadow-sm overflow-hidden rounded-md cursor-crosshair bg-white transition-shadow hover:shadow-md"
      onClick={handleClick}
    >
      <img 
        ref={imageRef}
        src={pageImage} 
        alt={`PDF Page ${pageIndex + 1}`} 
        className="max-w-full h-auto block select-none"
        draggable={false}
      />
      {children}
    </div>
  );
}
