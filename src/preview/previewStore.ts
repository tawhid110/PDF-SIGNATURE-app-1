import { create } from 'zustand';
import { renderPage, getPdfPageCount } from './previewService';

interface PreviewStoreState {
  pdfBytes: Uint8Array | ArrayBuffer | null;
  history: (Uint8Array | ArrayBuffer)[];
  currentPage: number;
  totalPages: number;
  pageImage: string | null;
  isRendering: boolean;
  loadingPercentage: number;
  zoom: number;
  
  setPdf: (pdfBytes: Uint8Array | ArrayBuffer | null) => Promise<void>;
  pushHistory: (pdfBytes: Uint8Array | ArrayBuffer) => void;
  undo: () => Promise<void>;
  setPage: (pageIndex: number) => void;
  renderPageImage: () => Promise<void>;
  setZoom: (zoom: number) => void;
}

export const usePreviewStore = create<PreviewStoreState>((set, get) => ({
  pdfBytes: null,
  history: [],
  currentPage: 0,
  totalPages: 0,
  pageImage: null,
  isRendering: false,
  loadingPercentage: 0,
  zoom: 1,

  setPdf: async (pdfBytes) => {
    set({ pdfBytes, currentPage: 0, pageImage: null, totalPages: 0, history: [], zoom: 1 });
    if (pdfBytes) {
      try {
        const count = await getPdfPageCount(pdfBytes);
        set({ totalPages: count });
      } catch (error) {
        console.error('Failed to get page count', error);
      }
    }
  },

  pushHistory: (bytes: Uint8Array | ArrayBuffer) => {
    const currentHistory = get().history;
    const newHistory = [...currentHistory, bytes.slice(0)];
    if (newHistory.length > 5) {
      newHistory.shift(); // Keep only last 5 entries
    }
    set({ history: newHistory });
  },

  undo: async () => {
    const { history, currentPage } = get();
    if (history.length === 0) return;
    
    const newHistory = [...history];
    const previousBytes = newHistory.pop()!;
    
    set({ pdfBytes: previousBytes, history: newHistory, pageImage: null });
    
    try {
      const count = await getPdfPageCount(previousBytes);
      set({ totalPages: count });
      
      const prevPage = Math.min(currentPage, count - 1);
      set({ currentPage: prevPage });
      
      const imageStr = await renderPage(previousBytes, prevPage, (progress) => {
        set({ loadingPercentage: progress });
      });
      set({ pageImage: imageStr });
    } catch (error) {
      console.error('Failed to undo', error);
    }
  },
  
  setPage: (pageIndex) => set({ currentPage: pageIndex }),

  renderPageImage: async () => {
    const { pdfBytes, currentPage } = get();
    if (!pdfBytes) return;

    set({ isRendering: true, loadingPercentage: 0 });
    try {
      const imageStr = await renderPage(pdfBytes, currentPage, (progress) => {
        set({ loadingPercentage: progress });
      });
      set({ pageImage: imageStr });
    } catch (error) {
      console.error('Failed to render page image', error);
      set({ pageImage: null });
    } finally {
      set({ isRendering: false, loadingPercentage: 0 });
    }
  },
  
  setZoom: (zoom) => set({ zoom })
}));
