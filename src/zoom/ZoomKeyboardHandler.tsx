import React, { useEffect } from "react";

export const ZoomKeyboardHandler = ({
  zoomIn,
  zoomOut,
  step = 0.05,
}: {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  step?: number;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA"].includes(activeTag)) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        zoomIn(step);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        zoomOut(step);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomIn, zoomOut, step]);
  return null;
};
