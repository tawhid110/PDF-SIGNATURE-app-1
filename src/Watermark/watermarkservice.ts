import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { useWatermarkStore } from './watermarkstore';
import { usePreviewStore } from '../preview/previewStore';

export interface WatermarkOptions {
  text: string;
  xRatio: number;
  yRatio: number;
  size?: number;
  color?: { r: number; g: number; b: number };
  opacity?: number;
  rotation?: number;
}

/**
 * Core service function to apply a watermark to all pages of a PDF.
 * Uses xRatio and yRatio to accurately place the watermark regardless of page dimensions.
 */
export async function burnWatermarkIntoPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { 
    text, 
    xRatio, 
    yRatio, 
    size = 48, 
    color = { r: 0.75, g: 0.75, b: 0.75 }, // Default light gray
    opacity = 0.5,
    rotation = 45
  } = options;

  const textWidth = font.widthOfTextAtSize(text, size);
  const textHeight = font.heightAtSize(size);

  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // Calculate exact coordinates based on ratios.
    // pdf-lib origin (0,0) is bottom-left. 
    // If ratios are from a top-left web UI, yRatio would need to be inverted: (1 - yRatio)
    const x = width * xRatio;
    const y = height * (1 - yRatio);

    // Draw text centered on the calculated point
    page.drawText(text, {
      x: x - textWidth / 2,
      y: y - textHeight / 2,
      size,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  }

  return await pdfDoc.save();
}

/**
 * Handler for adding a watermark.
 * Pulls state from the Zustand store, processes the PDF, and triggers a download.
 */
export async function handleAddWatermark() {
  const store = useWatermarkStore.getState();
  if (!store.pdfFile || !store.watermarkText) return;

  try {
    store.setIsProcessing(true);
    const arrayBuffer = await store.pdfFile.arrayBuffer();
    
    // Using default center ratios (0.5, 0.5) if specific placement isn't implemented in UI yet
    const updatedPdfBytes = await burnWatermarkIntoPdf(
      arrayBuffer, 
      { 
        text: store.watermarkText, 
        xRatio: 0.5, 
        yRatio: 0.5,
        size: 60,
        opacity: 0.3,
        rotation: 45
      }
    );
    
    const newFile = new File([updatedPdfBytes], `watermarked_${store.pdfFile.name}`, { type: 'application/pdf' });
    store.setPdfFile(newFile);
    store.setWatermarkText('');
    
    // Update the central preview store with the modified bytes
    const previewStore = usePreviewStore.getState();
    previewStore.setPdf(updatedPdfBytes);
    await previewStore.renderPageImage();
    
  } catch (error) {
    console.error("Failed to add watermark to PDF", error);
  } finally {
    store.setIsProcessing(false);
  }
}
