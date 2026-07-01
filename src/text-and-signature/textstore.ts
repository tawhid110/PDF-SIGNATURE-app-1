import { create } from 'zustand';

export type OverlayType = 'text' | 'signature';
export type OverlayScope = 'page';

export interface Overlay {
  id: string;
  type: OverlayType;
  scope: OverlayScope;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isEditing: boolean;
}

interface TextStoreState {
  // Overlay management (as requested)
  overlays: Overlay[];
  addOverlay: (overlay: Omit<Overlay, 'id'>) => void;
  updateOverlay: (overlay: Overlay) => void;
  removeOverlay: (id: string) => void;
  clearOverlays: () => void;

  // UI state management (required by textUI.tsx and textservice.ts)
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  textValue: string;
  setTextValue: (value: string) => void;
  signatureText: string;
  setSignatureText: (value: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

export const useTextStore = create<TextStoreState>((set) => ({
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
  textValue: '',
  setTextValue: (value) => set({ textValue: value }),
  signatureText: '',
  setSignatureText: (value) => set({ signatureText: value }),
  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing })
}));
