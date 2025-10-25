import React, { useState, useRef, useEffect, useCallback } from 'react';

const CROP_ASPECT_RATIO = 1 / 1; // Square
const OUTPUT_WIDTH = 256;
const OUTPUT_HEIGHT = 256;

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onClose: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onClose }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragState, setDragState] = useState({ isDragging: false, isResizing: false, startX: 0, startY: 0, handle: '' });

  const resetCrop = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight, width: displayWidth, height: displayHeight } = imageRef.current;
      
      const imageAspectRatio = naturalWidth / naturalHeight;
      let initialWidth, initialHeight;

      if (imageAspectRatio > CROP_ASPECT_RATIO) {
        initialHeight = displayHeight * 0.8;
        initialWidth = initialHeight * CROP_ASPECT_RATIO;
      } else {
        initialWidth = displayWidth * 0.8;
        initialHeight = initialWidth / CROP_ASPECT_RATIO;
      }

      const x = (displayWidth - initialWidth) / 2;
      const y = (displayHeight - initialHeight) / 2;

      setCrop({ x, y, width: initialWidth, height: initialHeight });
    }
  }, []);

  useEffect(() => {
    const imageElement = imageRef.current;
    if (imageElement) {
      imageElement.addEventListener('load', resetCrop);
      if (imageElement.complete) {
        resetCrop();
      }
      return () => imageElement.removeEventListener('load', resetCrop);
    }
  }, [imageSrc, resetCrop]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      isDragging: handle === 'move',
      isResizing: handle !== 'move',
      startX: e.clientX - crop.x,
      startY: e.clientY - crop.y,
      handle,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
        isDragging: false,
        isResizing: true,
        startX: e.clientX,
        startY: e.clientY,
        handle,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging && !dragState.isResizing) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    let newCrop = { ...crop };
    
    if (dragState.isDragging) {
        newCrop.x = e.clientX - dragState.startX;
        newCrop.y = e.clientY - dragState.startY;
    } else if (dragState.isResizing) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        let width = newCrop.width;
        let height = newCrop.height;
        let x = newCrop.x;
        let y = newCrop.y;

        if (dragState.handle.includes('right')) width = Math.max(20, width + dx);
        if (dragState.handle.includes('left')) { width = Math.max(20, width - dx); x += dx; }
        if (dragState.handle.includes('bottom')) height = Math.max(20, height + dy);
        if (dragState.handle.includes('top')) { height = Math.max(20, height - dy); y += dy; }

        if (CROP_ASPECT_RATIO) {
            if (dragState.handle.includes('left') || dragState.handle.includes('right')) {
                height = width / CROP_ASPECT_RATIO;
            } else {
                width = height * CROP_ASPECT_RATIO;
            }
        }
        
        newCrop = { x, y, width, height };
    }

    // Boundary checks
    if (newCrop.x < 0) newCrop.x = 0;
    if (newCrop.y < 0) newCrop.y = 0;
    if (newCrop.x + newCrop.width > containerRect.width) newCrop.x = containerRect.width - newCrop.width;
    if (newCrop.y + newCrop.height > containerRect.height) newCrop.y = containerRect.height - newCrop.height;

    setCrop(newCrop);
    if(dragState.isResizing) {
       setDragState(prev => ({ ...prev, startX: e.clientX, startY: e.clientY }));
    }

  }, [dragState, crop]);

  const handleMouseUp = useCallback(() => {
    setDragState({ isDragging: false, isResizing: false, startX: 0, startY: 0, handle: '' });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleSave = () => {
    const image = imageRef.current;
    if (!image) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      OUTPUT_WIDTH,
      OUTPUT_HEIGHT
    );

    const croppedImageUrl = canvas.toDataURL('image/png');
    onCropComplete(croppedImageUrl);
  };

  return (
    <div className="fixed inset-0 bg-[rgba(2,0,16,0.9)] backdrop-blur-lg flex items-center justify-center z-[250] p-4 animate-fade-in">
        <div className="relative w-full max-w-lg bg-[rgba(10,15,31,0.6)] border border-[var(--border-color)] rounded-lg p-6 flex flex-col gap-4 font-body text-white animate-scale-in">
            <h2 className="font-title text-xl text-[var(--accent-purple)] text-center">Crop Your Avatar</h2>
            <div ref={containerRef} className="relative w-full max-w-md mx-auto aspect-square bg-black/50 select-none touch-none">
                <img ref={imageRef} src={imageSrc} alt="Avatar to crop" className="max-w-full max-h-full object-contain" style={{pointerEvents: 'none'}} />
                <div 
                    className="absolute cursor-move" 
                    style={{
                        top: `${crop.y}px`,
                        left: `${crop.x}px`,
                        width: `${crop.width}px`,
                        height: `${crop.height}px`,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                        border: '2px dashed white',
                    }}
                     onMouseDown={handleMouseDown}
                >
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full cursor-nwse-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}></div>
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full cursor-nesw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}></div>
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full cursor-nesw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full cursor-nwse-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}></div>
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-2">
                <button onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-md font-title transition-colors hover:bg-white/20">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-cyan)] text-white rounded-md font-title transition hover:brightness-110">Save Avatar</button>
            </div>
        </div>
    </div>
  );
};

export default ImageCropper;