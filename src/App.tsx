/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePreviewStore } from './preview/previewStore';
import { useTextStore } from './text-and-signature/textstore';
import { useWatermarkStore } from './Watermark/watermarkstore';
import { downloadPdf } from './downloadService';
import { burnTextIntoPdf, burnImageIntoPdf } from './text-and-signature/textservice';
import { burnWatermarkIntoPdf } from './Watermark/watermarkservice';
import { useDeviceInfo } from './ui-settings/device-info';
import { PcUI } from './ui-settings/pc-ui';
import { MobileUI } from './ui-settings/mobile-ui';
import { SharedUIProps } from './ui-settings/shared-props';

export default function App() {
  const { pdfBytes, renderPageImage, pushHistory, zoom, setZoom } = usePreviewStore();
  const { overlays: textOverlays, setPdfFile: setTextPdfFile, clearOverlays: clearTextOverlays } = useTextStore();
  const { overlays: watermarkOverlays, setPdfFile: setWatermarkPdfFile, clearOverlays: clearWatermarkOverlays } = useWatermarkStore();
  const { isMobile } = useDeviceInfo();
  
  const [fileName, setFileName] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navPageInput, setNavPageInput] = useState('');

  const { currentPage, totalPages, setPage, setPdf } = usePreviewStore.getState();
  
  // Use reactive state for store methods/values needed in App.tsx effects
  const storeCurrentPage = usePreviewStore(state => state.currentPage);
  const storeTotalPages = usePreviewStore(state => state.totalPages);
  const storeSetPage = usePreviewStore(state => state.setPage);
  const storeSetPdf = usePreviewStore(state => state.setPdf);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setTextPdfFile(file);
      setWatermarkPdfFile(file);
      const buffer = await file.arrayBuffer();
      storeSetPdf(buffer);
    }
  };

  const handleDownload = () => {
    if (pdfBytes) {
      downloadPdf(pdfBytes, `modified_${fileName || 'document.pdf'}`);
    }
  };

  useEffect(() => {
    if (pdfBytes) {
      renderPageImage();
    }
  }, [pdfBytes, storeCurrentPage, renderPageImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'ArrowLeft' && storeCurrentPage > 0) {
        storeSetPage(storeCurrentPage - 1);
      } else if (e.key === 'ArrowRight' && storeCurrentPage < storeTotalPages - 1) {
        storeSetPage(storeCurrentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storeCurrentPage, storeTotalPages, storeSetPage]);

  const handlePreviewClick = (x: number, y: number, width: number, height: number) => {
    // Left intentionally blank. Overlays are created via toolbar buttons.
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(navPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= storeTotalPages) {
      storeSetPage(pageNum - 1);
    }
    setIsNavigating(false);
    setNavPageInput('');
  };

  const handleApplyAll = async () => {
    if (!pdfBytes) return;
    setIsApplying(true);
    pushHistory(pdfBytes);
    let currentBytes = new Uint8Array(pdfBytes).slice(0);

    try {
      for (const overlay of textOverlays) {
        if (overlay.type === 'signature') {
          currentBytes = await burnImageIntoPdf(currentBytes, overlay.content, {
            x: overlay.x,
            y: overlay.y,
            width: overlay.width,
            height: overlay.height
          });
        } else if (overlay.type === 'text') {
          currentBytes = await burnTextIntoPdf(currentBytes, overlay.content, {
            x: overlay.x,
            y: overlay.y,
            size: 24,
          });
        }
      }

      for (const overlay of watermarkOverlays) {
        if (overlay.type === 'watermark') {
          const previewWidth = 800; 
          const previewHeight = 1131;
          currentBytes = await burnWatermarkIntoPdf(currentBytes, {
            text: overlay.content,
            xRatio: overlay.x / previewWidth,
            yRatio: overlay.y / previewHeight,
            size: 60,
            opacity: 0.3,
            rotation: overlay.rotation || -45
          });
        }
      }

      storeSetPdf(currentBytes);
      clearTextOverlays();
      clearWatermarkOverlays();
      
      const newFile = new File([currentBytes], `modified_${fileName}`, { type: 'application/pdf' });
      setTextPdfFile(newFile);
      setWatermarkPdfFile(newFile);
    } catch (error) {
      console.error("Failed to apply overlays:", error);
    } finally {
      setIsApplying(false);
    }
  };

  const hasOverlays = textOverlays.length > 0 || watermarkOverlays.length > 0;
  const isEditingOverlay = textOverlays.some(o => o.isEditing) || watermarkOverlays.some(o => o.isEditing);

  const sharedProps: SharedUIProps = {
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
  };

  return isMobile ? <MobileUI {...sharedProps} /> : <PcUI {...sharedProps} />;
}
