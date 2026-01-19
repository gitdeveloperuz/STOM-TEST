
import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[] | null;
  initialIndex?: number;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ isOpen, onClose, images, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images]);

  if (!isOpen || !images || images.length === 0) return null;

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentImage = images[currentIndex];
  let src = '';
  
  if (currentImage) {
      if (currentImage.startsWith('data:') || currentImage.startsWith('http')) {
          src = currentImage;
      } else {
          // Fallback for raw base64 (legacy data)
          const mimeType = currentImage.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
          src = `data:${mimeType};base64,${currentImage}`;
      }
  }

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
          <div className="absolute top-4 left-4 z-[110] px-3 py-1.5 bg-black/50 text-white text-xs font-bold rounded-full border border-white/10 backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
          </div>
      )}

      {/* Navigation Buttons (Desktop & Tablet) */}
      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] p-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all backdrop-blur-sm hidden sm:flex"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] p-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all backdrop-blur-sm hidden sm:flex"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Image */}
      <div 
        className="relative z-[105] w-full h-full flex items-center justify-center p-4 sm:p-12"
        onClick={(e) => e.stopPropagation()} 
      >
        <img
          key={currentIndex} // Force re-render on change for animation if added later
          src={src}
          alt={`View ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none shadow-2xl transition-transform duration-300"
        />
      </div>
    </div>
  );
};
