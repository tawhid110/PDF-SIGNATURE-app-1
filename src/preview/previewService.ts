import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set the worker source using Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Cache for the current PDF document to avoid re-parsing on every page change
let cachedPdfBytes: ArrayBuffer | Uint8Array | null = null;
let cachedPdfDocument: any = null;

async function getCachedDocument(pdfBytes: ArrayBuffer | Uint8Array, onProgress?: (progress: number) => void) {
  if (cachedPdfBytes === pdfBytes && cachedPdfDocument) {
    if (onProgress) onProgress(100);
    return cachedPdfDocument;
  }
  const data = new Uint8Array(pdfBytes).slice(0);
  const loadingTask = pdfjsLib.getDocument({ data });
  
  if (onProgress) {
    loadingTask.onProgress = (progressData: any) => {
      if (progressData.total > 0) {
        onProgress(Math.round((progressData.loaded / progressData.total) * 100));
      }
    };
  }

  cachedPdfDocument = await loadingTask.promise;
  cachedPdfBytes = pdfBytes;
  return cachedPdfDocument;
}

/**
 * Renders a single PDF page into a base64 image string.
 * @param pdfBytes The raw bytes of the PDF.
 * @param pageIndex 0-based index of the page to render (0 is the first page).
 * @param onProgress Optional callback for loading progress.
 * @returns A promise resolving to a base64 string (data URI) of the rendered page image.
 */
export async function renderPage(pdfBytes: ArrayBuffer | Uint8Array, pageIndex: number, onProgress?: (progress: number) => void): Promise<string> {
  const pdfDocument = await getCachedDocument(pdfBytes, onProgress);

  
  // pdfjs-dist pages are 1-indexed, while our component expects 0-indexed
  const page = await pdfDocument.getPage(pageIndex + 1);
  
  // Set scale to improve image resolution
  const scale = 1.5;
  const viewport = page.getViewport({ scale });
  
  // Create an off-screen canvas to render the PDF page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Unable to get 2D context from canvas');
  }
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  } as any;
  
  await page.render(renderContext).promise;
  
  // Convert rendered canvas to base64 image string
  return canvas.toDataURL('image/png');
}

/**
 * Helper function to retrieve the total number of pages in a PDF.
 * @param pdfBytes The raw bytes of the PDF.
 * @returns A promise resolving to the total number of pages.
 */
export async function getPdfPageCount(pdfBytes: ArrayBuffer | Uint8Array): Promise<number> {
  const pdfDocument = await getCachedDocument(pdfBytes);
  return pdfDocument.numPages;
}
