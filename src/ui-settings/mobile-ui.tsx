import React, { useState } from 'react';
import { SharedUIProps } from './shared-props';
import Preview from '../preview/Preview';
import { usePreviewStore } from '../preview/previewStore';
import TextUI from '../text-and-signature/textUI';
import WatermarkUI from '../Watermark/watermark';
import { FileText, Upload, Download, Check, ChevronLeft, ChevronRight, Undo2, Loader2, ZoomIn, ZoomOut, Menu, X } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ShareButton } from '../share-setting/ShareButton';

export const MobileUI: React.FC<SharedUIProps> = ({
  fileName,
  isApplying,
  isNavigating,
  navPageInput,
  onFileChange,
  handleDownload,
  setNavPageInput,
  setIsNavigating,
  handleGoToPage,
  handleApplyAll,
  hasOverlays,
  isEditingOverlay,
  handlePreviewClick
}) => {
  const { pdfBytes, currentPage, totalPages, pageImage, setPage, isRendering, loadingPercentage, undo, history, zoom, setZoom } = usePreviewStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      {/* Mobile Top Header */}
      <div className="flex-none bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3 w-full">
          <label className="flex items-center justify-center p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 shrink-0">
            <Upload className="w-5 h-5 text-gray-700" />
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              onChange={onFileChange} 
            />
          </label>
          {fileName ? (
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-800 truncate">{fileName}</span>
            </div>
          ) : (
            <div className="flex-1 min-w-0 text-sm text-gray-400 font-medium truncate">No PDF selected</div>
          )}
          {pdfBytes && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tools Drawer */}
      {menuOpen && pdfBytes && (
        <div className="flex-none bg-white border-b border-gray-200 shadow-md p-4 space-y-4 z-20 overflow-y-auto max-h-[50vh]">
          <div className="flex flex-col gap-4">
             <TextUI />
             <div className="border-t border-gray-100 pt-4">
               <WatermarkUI />
             </div>
             <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={undo}
                  disabled={history.length === 0 || isApplying || isRendering}
                  className="py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Undo2 className="w-4 h-4" />
                  Undo
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!pdfBytes}
                  className="py-3 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <ShareButton 
                  fileName={fileName || ''} 
                  className="w-full flex" 
                  buttonClassName="flex-1 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                />
             </div>
             <button
               onClick={() => {
                 handleApplyAll();
                 setMenuOpen(false);
               }}
               disabled={!pdfBytes || isApplying || !hasOverlays}
               className="w-full py-3 bg-blue-600 text-white text-base font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
             >
               {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
               {isApplying ? 'Applying...' : 'Apply All'}
             </button>
          </div>
        </div>
      )}

      {/* Main Preview Area */}
      <div className="flex-1 bg-gray-100 overflow-hidden relative flex flex-col">
        {isRendering ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-base font-medium animate-pulse">Rendering...</div>
            {loadingPercentage > 0 && (
              <div className="w-48 bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${loadingPercentage}%` }}></div>
              </div>
            )}
            {loadingPercentage > 0 && <div className="text-sm font-semibold">{loadingPercentage}%</div>}
          </div>
        ) : pageImage ? (
          <div className="flex flex-col h-full w-full relative">
            <div className="flex-1 w-full h-full overflow-hidden relative">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
                wheel={{ step: 0.05, wheelDisabled: isEditingOverlay }}
                pinch={{ step: 10, disabled: isEditingOverlay }}
                panning={{ disabled: isEditingOverlay }}
                onTransformed={(ref) => setZoom(ref.state.scale)}
                onInit={(ref) => setZoom(ref.state.scale)}
              >
                {() => (
                  <>
                    <TransformComponent wrapperClass="w-full h-full" contentClass="!w-auto !h-auto flex justify-center items-center pb-20 pt-4">
                      <Preview 
                        pageImage={pageImage} 
                        pageIndex={currentPage} 
                        onClick={handlePreviewClick} 
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white px-3 py-2 rounded-full shadow-xl border border-gray-200 z-30">
              <button
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              
              {isNavigating ? (
                <div className="flex items-center gap-1 h-[40px]">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={navPageInput}
                    onChange={(e) => setNavPageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                    className="w-14 h-full px-1 text-center border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    autoFocus
                  />
                  <button
                    onClick={handleGoToPage}
                    className="px-2 h-full bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
                  >
                    Go
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => { setIsNavigating(true); setNavPageInput(String(currentPage + 1)); }}
                  className="text-base font-medium text-gray-800 px-2 flex items-center justify-center rounded"
                >
                  {currentPage + 1} / {totalPages}
                </div>
              )}

              <button
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 h-full flex flex-col items-center justify-center p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center w-full max-w-sm">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <span className="text-base text-center">Tap the upload icon above to select a PDF</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
