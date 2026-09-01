'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

export interface SignaturePadHandle {
  getSignature: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
  label?: string;
  labelOr?: string;
  onChange?: (data: string | null) => void;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ width, height, label = 'Signature / Mallattoo', labelOr = 'Mallattoo Galmeessi', onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    const getCanvasSize = useCallback(() => {
      if (width && height) return { w: width, h: height };
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        return { w: rect.width, h: Math.max(120, Math.min(180, rect.width * 0.35)) };
      }
      return { w: 300, h: 140 };
    }, [width, height]);

    const initCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { w, h } = getCanvasSize();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1a1a1a';
      // Draw subtle guideline
      ctx.beginPath();
      ctx.moveTo(20, h - 30);
      ctx.lineTo(w - 20, h - 30);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Reset to drawing style
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2.5;
    }, [getCanvasSize]);

    useEffect(() => {
      initCanvas();
      const handleResize = () => initCanvas();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [initCanvas]);

    const getPoint = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pt = getPoint(e);
      lastPoint.current = pt;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      setIsDrawing(true);
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (!isDrawing || !lastPoint.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pt = getPoint(e);
      const midX = (lastPoint.current.x + pt.x) / 2;
      const midY = (lastPoint.current.y + pt.y) / 2;
      ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midX, midY);
      ctx.stroke();
      lastPoint.current = pt;
      if (!hasDrawn) {
        setHasDrawn(true);
      }
    };

    const endDraw = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      setIsDrawing(false);
      lastPoint.current = null;
      // Notify parent of change
      const data = canvasRef.current?.toDataURL('image/png');
      if (onChange && data) {
        onChange(data);
      }
    };

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      // Redraw guideline
      ctx.beginPath();
      ctx.moveTo(20, h - 30);
      ctx.lineTo(w - 20, h - 30);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      setHasDrawn(false);
      if (onChange) onChange(null);
    }, [onChange]);

    const getSignature = useCallback((): string | null => {
      if (!hasDrawn) return null;
      return canvasRef.current?.toDataURL('image/png') || null;
    }, [hasDrawn]);

    const isEmpty = useCallback((): boolean => {
      return !hasDrawn;
    }, [hasDrawn]);

    useImperativeHandle(ref, () => ({ getSignature, clear, isEmpty }), [getSignature, clear, isEmpty]);

    return (
      <div ref={containerRef} className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {label}
            <br />
            <span className="text-[11px] font-normal">{labelOr}</span>
            <span className="text-red-500"> *</span>
          </label>
          {hasDrawn && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={clear}
            >
              <Eraser className="h-3 w-3 mr-1" />
              Clear / Haqi
            </Button>
          )}
        </div>
        <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            className="block w-full cursor-crosshair"
            style={{ touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-gray-400 select-none">
                Sign here / Bira qoradhu
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
