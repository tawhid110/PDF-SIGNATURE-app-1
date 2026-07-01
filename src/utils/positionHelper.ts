export const getVisibleCenterPercentage = (): { x: number, y: number } => {
  const container = document.getElementById('pdf-page-container');
  if (!container) return { x: 50, y: 50 };

  const rect = container.getBoundingClientRect();
  
  // Center of the viewport
  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;
  
  const relativeX = viewportCenterX - rect.left;
  const relativeY = viewportCenterY - rect.top;
  
  let x = (relativeX / rect.width) * 100;
  let y = (relativeY / rect.height) * 100;
  
  // Clamp to keep it inside the page (e.g., between 10% and 90%)
  x = Math.max(10, Math.min(x, 90));
  y = Math.max(10, Math.min(y, 90));
  
  return { x, y };
};
