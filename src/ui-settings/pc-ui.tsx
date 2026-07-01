import React, { useEffect } from 'react';
import { SharedUIProps } from './shared-props';
import Preview from '../preview/Preview';
import { usePreviewStore } from '../preview/previewStore';
import TextUI from '../text-and-signature/textUI';
import WatermarkUI from '../Watermark/watermark';
import { FileText, Upload, Download, Check, ChevronLeft, ChevronRight, Undo2, Loader2 } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomKeyboardHandler } from '../zoom/ZoomKeyboardHandler';
import { ShareButton } from '../share-setting/ShareButton';

export const PcUI: React.FC<SharedUIProps> = ({
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-none p-4 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="flex items-center justify-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors shrink-0">
              <Upload className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-700">Select PDF</span>
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                onChange={onFileChange} 
              />
            </label>
            {fileName && (
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="text-sm text-gray-600 flex items-center gap-1.5 font-medium truncate">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{fileName}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={!pdfBytes}
                    className="flex items-center justify-center px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download
                  </button>
                  <ShareButton fileName={fileName || ''} />
                </div>
              </div>
            )}
          </div>
          
          <div className="w-full md:w-auto flex-1 max-w-lg flex items-center gap-4 shrink-0">
             <WatermarkUI />
          </div>
        </div>
      </div>

      <div className="flex-none p-2 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-2">
           <TextUI />
           <div className="flex items-center gap-3 shrink-0">
             <button
               onClick={undo}
               disabled={history.length === 0 || isApplying || isRendering}
               className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-2"
               title={`Undo (${history.length} available)`}
             >
               <Undo2 className="w-4 h-4" />
               <span className="hidden sm:inline">Undo</span>
             </button>
             <button
               onClick={handleApplyAll}
               disabled={!pdfBytes || isApplying || !hasOverlays}
               className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-2"
             >
               {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
               {isApplying ? 'Applying...' : 'Apply All'}
             </button>
           </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 overflow-hidden relative flex flex-col">
        {isRendering ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-lg font-medium animate-pulse">Rendering preview...</div>
            {loadingPercentage > 0 && (
              <div className="w-64 bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${loadingPercentage}%` }}></div>
              </div>
            )}
            {loadingPercentage > 0 && <div className="text-sm font-semibold">{loadingPercentage}%</div>}
          </div>
        ) : pageImage ? (
          <div className="flex flex-col h-full w-full relative" id="shared-preview-wrapper">
            
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200 z-30">
              <button
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              
              {isNavigating ? (
                <div className="flex items-center gap-2 h-[32px]">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={navPageInput}
                    onChange={(e) => setNavPageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                    className="w-16 h-full px-2 text-center border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    autoFocus
                  />
                  <button
                    onClick={handleGoToPage}
                    className="px-3 h-full bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
                  >
                    Move
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => { setIsNavigating(true); setNavPageInput(String(currentPage + 1)); }}
                  className="cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 min-h-[32px] min-w-[64px] flex items-center justify-center rounded transition-colors"
                  title="Click to go to page"
                >
                  {currentPage + 1} / {totalPages}
                </div>
              )}

              <button
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="flex-1 w-full h-full overflow-hidden relative">
              <TransformWrapper
                initialScale={1}
                minScale={0.2}
                maxScale={4}
                centerOnInit={true}
                wheel={{ step: 0.05, wheelDisabled: isEditingOverlay }}
                pinch={{ step: 5, disabled: isEditingOverlay }}
                panning={{ disabled: isEditingOverlay }}
                onTransformed={(ref) => setZoom(ref.state.scale)}
                onInit={(ref) => setZoom(ref.state.scale)}
              >
                {({ zoomIn, zoomOut }) => (
                  <>
                    <ZoomKeyboardHandler zoomIn={zoomIn} zoomOut={zoomOut} step={0.05} />
                    <TransformComponent wrapperClass="w-full h-full" contentClass="!w-auto !h-auto flex justify-center items-center pb-8 pt-20">
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
          </div>
        ) : (
          <div className="text-gray-400 h-full flex flex-col items-center justify-center p-12">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center bg-gray-50">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <span className="text-lg">No PDF selected for preview</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
