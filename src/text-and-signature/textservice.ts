import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useTextStore } from './textstore';
import { usePreviewStore } from '../preview/previewStore';

export interface TextAnnotationOptions {
  x: number;
  y: number;
  size?: number;
  color?: { r: number; g: number; b: number };
}

/**
 * Core service function to burn text into the first page of a PDF.
 * Accepts raw ArrayBuffer, text content, and position/styling options.
 * Returns the updated PDF as a Uint8Array.
 */
export async function burnImageIntoPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  dataUrl: string,
  options: { x: number; y: number; width: number; height: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { height } = firstPage.getSize();

  // Strip the prefix if present
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const image = await pdfDoc.embedPng(base64Data);

  const { x, y, width: imgW, height: imgH } = options;

  // In pdf-lib, the origin (0,0) is the bottom-left corner of the page.
  // We flip the Y coordinate to make it top-down intuitive.
  firstPage.drawImage(image, {
    x,
    y: height - y - imgH,
    width: imgW,
    height: imgH,
  });

  return await pdfDoc.save();
}

export async function burnTextIntoPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  text: string,
  options: TextAnnotationOptions,
  isSignature: boolean = false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { height } = firstPage.getSize();

  // We use Helvetica-Oblique to give the signature a slightly different feel
  const font = await pdfDoc.embedFont(
    isSignature ? StandardFonts.HelveticaOblique : StandardFonts.Helvetica
  );

  const { x, y, size = 12, color = { r: 0, g: 0, b: 0 } } = options;

  // In pdf-lib, the origin (0,0) is the bottom-left corner of the page.
  // We flip the Y coordinate to make it top-down intuitive.
  firstPage.drawText(text, {
    x,
    y: height - y,
    size: isSignature ? size * 1.5 : size, 
    font,
    color: rgb(color.r, color.g, color.b),
  });

  return await pdfDoc.save();
}

/**
 * Handler for adding standard text annotation.
 * Pulls state from the Zustand store, processes the PDF, and triggers a download.
 */
export async function handleAddText() {
  const store = useTextStore.getState();
  if (!store.pdfFile || !store.textValue) return;

  try {
    store.setIsProcessing(true);
    const arrayBuffer = await store.pdfFile.arrayBuffer();
    
    // Default coordinates: near the top left
    const updatedPdfBytes = await burnTextIntoPdf(
      arrayBuffer, 
      store.textValue, 
      { x: 50, y: 100, size: 24 }
    );
    
    const newFile = new File([updatedPdfBytes], `edited_${store.pdfFile.name}`, { type: 'application/pdf' });
    store.setPdfFile(newFile);
    store.setTextValue('');
    
    // Update the central preview store with the modified bytes
    const previewStore = usePreviewStore.getState();
    previewStore.setPdf(updatedPdfBytes);
    await previewStore.renderPageImage();
    
  } catch (error) {
    console.error("Failed to add text to PDF", error);
  } finally {
    store.setIsProcessing(false);
  }
}

/**
 * Handler for adding a signature.
 * Pulls state from the Zustand store, processes the PDF, and triggers a download.
 */
export async function handleAddSignature() {
  const store = useTextStore.getState();
  if (!store.pdfFile || !store.signatureText) return;

  try {
    store.setIsProcessing(true);
    const arrayBuffer = await store.pdfFile.arrayBuffer();
    
    // Default coordinates: near the bottom left
    const updatedPdfBytes = await burnTextIntoPdf(
      arrayBuffer, 
      store.signatureText, 
      { x: 50, y: 700, size: 32 }, 
      true
    );
    
    const newFile = new File([updatedPdfBytes], `signed_${store.pdfFile.name}`, { type: 'application/pdf' });
    store.setPdfFile(newFile);
    store.setSignatureText('');
    
    // Update the central preview store with the modified bytes
    const previewStore = usePreviewStore.getState();
    previewStore.setPdf(updatedPdfBytes);
    await previewStore.renderPageImage();
    
  } catch (error) {
    console.error("Failed to add signature to PDF", error);
  } finally {
    store.setIsProcessing(false);
  }
}
