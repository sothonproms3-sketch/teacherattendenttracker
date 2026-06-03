/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  key?: any;
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export default function SignaturePad({ onSave, onClear, placeholder }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize canvas with proper device pixel ratio to prevent blur
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the dimensions of the parent container
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set display size
    canvas.style.width = '100%';
    canvas.style.height = `${canvas.clientHeight || 160}px`;

    // Set actual resolution
    canvas.width = rect.width * dpr;
    canvas.height = (canvas.clientHeight || 160) * dpr;

    // Scale context to ensure correct drawing operations
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Slate 900
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling when drawing on touch screens
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    // Prevent scrolling when drawing on touch screens
    if (e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Auto-save the signature state
    saveSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    setIsEmpty(true);
    if (onClear) {
      onClear();
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Convert canvas to Data URL
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div id="signature-pad-container" className="flex flex-col gap-2">
      <div 
        id="signature-canvas-wrapper" 
        className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white group hover:border-slate-400 transition-colors"
      >
        <canvas
          id="signature-canvas"
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-40 bg-white cursor-crosshair TouchAction-none"
          style={{ touchAction: 'none' }}
        />
        {isEmpty && (
          <div 
            id="signature-placeholder" 
            className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-sans"
          >
            {placeholder || 'សរសេរហត្ថលេខានៅទីនេះ (Sign Here)'}
          </div>
        )}
      </div>
      <div id="signature-actions" className="flex justify-between items-center text-xs">
        <span className="text-slate-500 font-mono text-[10px]">
          * សរសេរដោយប្រើម្រាមដៃ ឬម៉ៅស៍ | Use finger or mouse
        </span>
        <button
          id="clear-signature-btn"
          type="button"
          onClick={clearCanvas}
          disabled={isEmpty}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:pointer-events-none font-medium transition-colors border border-amber-200/50"
        >
          <Eraser className="w-3.5 h-3.5" />
          សម្អាត (Clear)
        </button>
      </div>
    </div>
  );
}
