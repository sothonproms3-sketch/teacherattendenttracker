/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Camera, Upload, PenTool, Sparkles, RefreshCw, Sliders, Check, AlertCircle } from 'lucide-react';

interface SignaturePadProps {
  key?: any;
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

type TabType = 'draw' | 'scan_camera' | 'scan_upload';

export default function SignaturePad({ onSave, onClear, placeholder }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  
  // Scanned image state
  const [scannedImageSrc, setScannedImageSrc] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(140); // 0-255 brightness threshold for scan filter
  const [originalUploadSrc, setOriginalUploadSrc] = useState<string | null>(null);

  // Camera states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Initialize drawing canvas
  useEffect(() => {
    if (activeTab === 'draw') {
      initCanvas();
    } else {
      // Clean up camera stream if switching tabs
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Re-apply threshold filtering whenever threshold or upload photo changes
  useEffect(() => {
    if (originalUploadSrc) {
      applyScanFilter(originalUploadSrc, threshold);
    }
  }, [threshold, originalUploadSrc]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the dimensions of the parent container
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set display size
    canvas.style.width = '100%';
    canvas.style.height = '140px';

    // Set actual resolution
    canvas.width = rect.width * dpr;
    canvas.height = 140 * dpr;

    // Scale context to ensure correct drawing operations
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Slate 900
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, 140);
    setIsEmpty(true);
  };

  // --- DRAWING LOGIC ---
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
    if (e.cancelable) e.preventDefault();
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
    if (e.cancelable) e.preventDefault();

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
    saveDrawnSignature();
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const clearCanvas = () => {
    if (activeTab === 'draw') {
      initCanvas();
    } else {
      setScannedImageSrc(null);
      setOriginalUploadSrc(null);
      setIsEmpty(true);
    }
    if (onClear) {
      onClear();
    }
  };

  // --- CAMERA SCANNING LOGIC ---
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("មិនអាចបើកការ៉ាម៉ាបានទេ។ សូមពិនិត្យការអនុញ្ញាត (Camera access denied/failed)");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !isCameraActive) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;

    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw frame from stream
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const rawDataUrl = tempCanvas.toDataURL('image/png');

    setOriginalUploadSrc(rawDataUrl);
    applyScanFilter(rawDataUrl, threshold);
    stopCamera();
  };

  // --- FILE UPLOAD SCAN LOGIC ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOriginalUploadSrc(result);
      applyScanFilter(result, threshold);
    };
    reader.readAsDataURL(file);
  };

  // --- HIGH CONTRAST SCANNING FILTER ALGORITHM ---
  // Transforms gray paper photos into professional clean black/white scanned signatures
  const applyScanFilter = (sourceDataUrl: string, currThreshold: number) => {
    const image = new Image();
    image.src = sourceDataUrl;
    image.onload = () => {
      const processCanvas = document.createElement('canvas');
      processCanvas.width = image.width;
      processCanvas.height = image.height;
      const ctx = processCanvas.getContext('2d');
      if (!ctx) return;

      // Draw initial loaded original picture
      ctx.drawImage(image, 0, 0);

      const imgData = ctx.getImageData(0, 0, processCanvas.width, processCanvas.height);
      const data = imgData.data;

      // Apply highly specialized adaptive contrast threshold thresholding
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Dynamic greyscale calculation formula
        const grayscale = 0.299 * r + 0.587 * g + 0.114 * b;

        // If bright (the paper/background), turn into absolute translucent/white background
        if (grayscale > currThreshold) {
          data[i] = 255;     // Red
          data[i + 1] = 255; // Green
          data[i + 2] = 255; // Blue
        } else {
          // Deep dark royal blue/slate signature color for premium look
          data[i] = 15;      // Red - Slate 900 tint
          data[i + 1] = 23;  // Green
          data[i + 2] = 42;  // Blue
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const outputDataUrl = processCanvas.toDataURL('image/png');
      setScannedImageSrc(outputDataUrl);
      setIsEmpty(false);
      
      // Save it directly to the model state
      onSave(outputDataUrl);
    };
  };

  return (
    <div id="signature-scanner-panel" className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-3">
      
      {/* Tab Selectors */}
      <div id="signature-method-tabs" className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-lg text-xs font-semibold">
        <button
          id="tab-draw-trigger"
          type="button"
          onClick={() => setActiveTab('draw')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-md transition-all cursor-pointer ${
            activeTab === 'draw' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-indigo-600" />
          <span>គូរ (Draw)</span>
        </button>

        <button
          id="tab-scan-camera-trigger"
          type="button"
          onClick={() => {
            setActiveTab('scan_camera');
            startCamera();
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-md transition-all cursor-pointer ${
            activeTab === 'scan_camera' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-rose-600" />
          <span>ស្កេនរូប (Scan Camera)</span>
        </button>

        <button
          id="tab-scan-upload-trigger"
          type="button"
          onClick={() => setActiveTab('scan_upload')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-md transition-all cursor-pointer ${
            activeTab === 'scan_upload' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span>បញ្ចូលហត្ថលេខា (Upload)</span>
        </button>
      </div>

      {/* Primary Work Areas based on Tab Type */}
      <div id="signature-workspace" className="relative">
        
        {/* TAB 1: DRAW CANVAS */}
        {activeTab === 'draw' && (
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
              className="w-full h-[140px] bg-white cursor-crosshair TouchAction-none"
              style={{ touchAction: 'none' }}
            />
            {isEmpty && (
              <div 
                id="signature-placeholder" 
                className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs sm:text-sm"
              >
                {placeholder || 'សរសេរហត្ថលេខានៅទីនេះ (Sign Here)'}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CAMERA CAPTURING SCAN */}
        {activeTab === 'scan_camera' && (
          <div id="camera-workspace-panel" className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex flex-col justify-center items-center relative min-h-[140px] text-white">
            {isCameraActive ? (
              <div className="w-full relative flex flex-col">
                <video 
                  id="camera-preview-video"
                  ref={videoRef}
                  className="w-full h-44 object-cover" 
                  playsInline 
                  muted
                />
                <div id="camera-aim-bracket" className="absolute inset-x-8 inset-y-6 border border-white/30 border-dashed pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] bg-black/70 px-2 py-0.5 rounded text-indigo-300 font-medium">ដាក់ហត្ថលេខាក្នុងតំបន់នេះ | Align signature</span>
                </div>
                <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 italic">ដាក់ក្រដាសពណ៌ស សរសេរហត្ថលេខាឱ្យច្បាស់</span>
                  <button
                    id="capture-photo-btn"
                    type="button"
                    onClick={capturePhoto}
                    className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-white animate-pulse" />
                    ថតយក (Snap Signature)
                  </button>
                </div>
              </div>
            ) : scannedImageSrc ? (
              <div id="camera-captured-result" className="w-full bg-white p-3 flex flex-col gap-2 items-center">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 self-start">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  រូបភាពស្កេនដែលទទួលបាន (Scanned Signature)
                </div>
                <img 
                  id="camera-signature-img-preview"
                  src={scannedImageSrc} 
                  alt="Scanned Signature Preview" 
                  className="h-24 w-auto object-contain border border-slate-200 rounded p-1 bg-white"
                  referrerPolicy="no-referrer"
                />
                <button
                  id="retake-camera-btn"
                  type="button"
                  onClick={startCamera}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ថតថ្មីម្តងទៀត (Retake)
                </button>
              </div>
            ) : (
              <div id="camera-idle-placeholder" className="p-6 text-center flex flex-col items-center gap-2">
                {cameraError ? (
                  <>
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="text-xs text-rose-400 max-w-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('scan_upload');
                      }}
                      className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-1.5"
                    >
                      ប្រើការ Upload ជំនួសវិញ (Use Upload Instead)
                    </button>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-rose-500 animate-bounce" />
                    <p className="text-xs text-slate-300">កំពុងសុំការអនុញ្ញាតបើកការ៉ាម៉ា...</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-1 bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-xs font-bold"
                    >
                      សាកល្បងបើកឡើងវិញ (Retry Camera)
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FILE UPLOAD & FILTER */}
        {activeTab === 'scan_upload' && (
          <div id="file-upload-workspace" className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white flex flex-col items-center justify-center text-center">
            {scannedImageSrc ? (
              <div id="scan-image-preview-panel" className="w-full flex flex-col gap-2 items-center">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 self-start">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  រូបភាពស្កេនដែលទទួលបាន (Scanned Signature)
                </div>
                <img 
                  id="scanned-signature-upload-preview"
                  src={scannedImageSrc} 
                  alt="Scanned Signature Upl" 
                  className="h-24 w-auto object-contain border border-slate-250 bg-white rounded p-1"
                  referrerPolicy="no-referrer"
                />
                <button
                  id="reupload-btn"
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ជ្រើសរើសរូបភាពថ្មី (Change Image)
                </button>
              </div>
            ) : (
              <div id="upload-idle-placeholder" className="p-3">
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-700 mb-0.5">បញ្ចូលរូបថតហត្ថលេខាទូរសព្ទ</p>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">គាំទ្ររូប JPG, PNG, WEBP (ប្រព័ន្ធនឹងស្កេនកាត់ផ្ទៃខាងក្រោយដោយស្វ័យប្រវត្ត)</p>
                <button
                  id="browse-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-1.5 text-xs font-bold transition-all cursor-pointer"
                >
                  ជ្រើសរើសរូបថត (Select Photo)
                </button>
              </div>
            )}
            <input
              id="file-signature-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

      </div>

      {/* FILTER CONTROL: Threshold Adjustment Slider (Only visible for captured/uploaded scanned signatures) */}
      {originalUploadSrc && (activeTab === 'scan_camera' || activeTab === 'scan_upload') && (
        <div id="scanner-contrast-slider-box" className="bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              កម្រិតបន្សុតស្កេន (Scanner Sensitivity)
            </span>
            <span className="font-mono text-indigo-600">កម្រិត៖ {threshold}</span>
          </div>
          <input
            id="scanner-threshold-slider"
            type="range"
            min="50"
            max="220"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[8px] text-slate-400 font-mono">
            <span>រឹង/ក្រាស់ (Thicker)</span>
            <span>ស្ដើង/ច្បាស់ (Thinner/Cleans up shadows)</span>
          </div>
        </div>
      )}

      {/* Signature Action Buttons */}
      <div id="signature-action-bar" className="flex justify-between items-center text-xs mt-1 border-t border-slate-200/60 pt-2 bg-slate-50">
        <span className="text-slate-500 font-medium text-[9px] sm:text-[10px] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
          {activeTab === 'draw' 
            ? 'គូរហត្ថលេខាផ្ទាល់ដៃ | Draw with mouse/finger' 
            : 'បច្ចេកវិទ្យាស្កេនកាត់ផ្ទៃខាងក្រោយ | Auto image scanner'
          }
        </span>
        <button
          id="clear-signature-pad-btn"
          type="button"
          onClick={clearCanvas}
          disabled={isEmpty}
          className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:pointer-events-none font-bold text-[10.5px] transition-colors border border-amber-200/50 cursor-pointer"
        >
          <Eraser className="w-3.5 h-3.5" />
          សម្អាត (Clear)
        </button>
      </div>

    </div>
  );
}
