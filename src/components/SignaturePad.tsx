import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSave: (dataUrl: string | null) => void;
  savedDataUrl?: string | null;
  ownerName: string;
  brandName: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  savedDataUrl,
  ownerName,
  brandName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize and scale canvas for crisp rendering (retina/high-dpi)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the display size of the canvas container
    const width = 180;
    const height = 48;

    // Set display/css size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale canvas for high-dpi screens
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    // Scale context back
    ctx.scale(ratio, ratio);

    // Initial styles
    ctx.strokeStyle = '#020617'; // slate 950 deep dark stroke
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If pre-drawn signature is provided, draw it onto the scaled canvas
    if (savedDataUrl) {
      setHasDrawn(true);
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = savedDataUrl;
    }
  }, [savedDataUrl]);

  // Touch and Mouse handlers
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure line settings are intact
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      // Prevent scrolling gestures on touch
      if (e.cancelable) e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      if (e.cancelable) e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const clearCanvas = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 180;
    const height = 48;
    ctx.clearRect(0, 0, width, height);
    setHasDrawn(false);
    onSave(null);
  };

  return (
    <div className="flex flex-col items-center select-none w-[180px]">
      <div className="w-full flex items-center justify-between mb-0.5">
        <span className="text-[8px] font-bold text-neutral-800 tracking-wide font-sans flex items-center gap-1">
          ✍️ Auth Signature
        </span>
        {hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[7.5px] text-neutral-400 hover:text-rose-600 font-bold tracking-tight cursor-pointer focus:outline-none flex items-center gap-0.5"
            title="Clear signature"
          >
            ✕ Clear
          </button>
        )}
      </div>

      <div 
        className="w-[180px] h-[48px] bg-[#fdfdfd] border border-dashed border-neutral-300 rounded-lg relative overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair block"
          style={{ touchAction: 'none' }}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-neutral-300 text-[6px] font-sans font-bold tracking-widest uppercase">
            <span>Sign Here</span>
          </div>
        )}
      </div>

      <div className="border-t border-neutral-900 w-[180px] text-center mt-1 pt-1.5">
        <p className="text-[10px] font-extrabold text-neutral-900 leading-none tracking-wide">
          {ownerName}
        </p>
        <p className="text-[6.5px] text-neutral-400 font-sans font-bold tracking-widest uppercase mt-1 leading-none">
          {brandName === 'Sky Automation Tech' ? 'Owner, Sky Automation Tech' : `Managing Director, ${brandName}`}
        </p>
      </div>
    </div>
  );
};
