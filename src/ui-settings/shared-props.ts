import React from 'react';

export interface SharedUIProps {
  fileName: string;
  isApplying: boolean;
  isNavigating: boolean;
  navPageInput: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDownload: () => void;
  setNavPageInput: (val: string) => void;
  setIsNavigating: (val: boolean) => void;
  handleGoToPage: () => void;
  handleApplyAll: () => Promise<void>;
  hasOverlays: boolean;
  isEditingOverlay: boolean;
  handlePreviewClick: (x: number, y: number, width: number, height: number) => void;
}
