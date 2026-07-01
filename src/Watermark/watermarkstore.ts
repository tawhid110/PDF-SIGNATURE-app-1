import { create } from 'zustand';

export type OverlayScope = 'document';

export interface WatermarkOverlay {
  id: string;
  type: 'watermark';
  scope: OverlayScope;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isEditing: boolean;
}

interface WatermarkStoreState {
  // Overlay management
  overlays: WatermarkOverlay[];
  addOverlay: (overlay: Omit<WatermarkOverlay, 'id'>) => void;
  updateOverlay: (overlay: WatermarkOverlay) => void;
  removeOverlay: (id: string) => void;
  clearOverlays: () => void;

  // UI state management
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  watermarkText: string;
  setWatermarkText: (value: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

export const useWatermarkStore = create<WatermarkStoreState>((set) => ({
  // Overlay state
  overlays: [],
  addOverlay: (overlay) => set((state) => ({
    overlays: [...state.overlays, { ...overlay, id: crypto.randomUUID() }]
  })),
  updateOverlay: (overlay) => set((state) => ({
    overlays: state.overlays.map((o) => o.id === overlay.id ? overlay : o)
  })),
  removeOverlay: (id) => set((state) => ({
    overlays: state.overlays.filter((o) => o.id !== id)
  })),
  clearOverlays: () => set({ overlays: [] }),

  // UI state
  pdfFile: null,
  setPdfFile: (file) => set({ pdfFile: file }),
  watermarkText: '',
  setWatermarkText: (value) => set({ watermarkText: value }),
  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing })
}));
