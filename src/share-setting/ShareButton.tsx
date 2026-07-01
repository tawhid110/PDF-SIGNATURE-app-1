import React, { useState } from 'react';
import { Share2, Loader2, Link2, Mail, ExternalLink } from 'lucide-react';
import { usePreviewStore } from '../preview/previewStore';

interface ShareButtonProps {
  fileName: string;
  className?: string;
  buttonClassName?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ fileName, className, buttonClassName }) => {
  const { pdfBytes } = usePreviewStore();
  const [isSharing, setIsSharing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleShare = async () => {
    if (!pdfBytes) return;

    const file = new File([pdfBytes], fileName || 'document.pdf', {
      type: 'application/pdf',
    });

    // Check if the browser supports sharing files
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      setIsSharing(true);
      try {
        await navigator.share({
          files: [file],
          title: fileName || 'Shared PDF',
          text: 'Here is the shared PDF document.',
        });
      } catch (error) {
        console.error('Error sharing file:', error);
      } finally {
        setIsSharing(false);
      }
    } else {
      // Fallback for browsers that don't support file sharing
      setShowOptions(true);
    }
  };

  const shareViaEmail = () => {
    // Note: We can't attach files directly to mailto links. 
    // This is just a fallback to open the email client.
    const subject = encodeURIComponent(fileName || 'Shared Document');
    const body = encodeURIComponent('Please find the document attached.');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowOptions(false);
  };

  if (!pdfBytes) return null;

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={buttonClassName || "flex items-center justify-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"}
        title="Share PDF"
      >
        {isSharing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Share2 className="w-4 h-4 mr-1.5" />}
        Share
      </button>

      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Share Options</h3>
              <p className="text-xs text-gray-500 mt-1">Direct file sharing is not supported by your browser.</p>
            </div>
            <div className="p-1">
              <button
                onClick={shareViaEmail}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                Share via Email
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
