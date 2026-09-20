import React, { useRef, useEffect, useState } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_BG_COLOR, CANVAS_FALLBACK_BG_COLOR } from '../../game/constants';

interface DrawingCanvasProps {
  brushColor?: string;
  brushSize?: number;
  isDrawingEnabled?: boolean;
  onChange?: (dataUrl: string) => void;
}

export interface DrawingCanvasRef {
  exportDataUrl: () => string | null;
  clear: () => void;
}

export const DrawingCanvas = React.forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ brushColor = '#000000', brushSize = 5, isDrawingEnabled = true, onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

    React.useImperativeHandle(ref, () => ({
      exportDataUrl: () => {
        if (!canvasRef.current) return null;
        return canvasRef.current.toDataURL('image/png');
      },
      clear: () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = CANVAS_FALLBACK_BG_COLOR;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (onChange) onChange(canvasRef.current.toDataURL('image/png'));
      }
    }));

    /**
     * Canvas Initialization:
     * We use a fixed internal resolution so that every player's drawing
     * is exactly the same size regardless of their device. The CSS `object-fit: contain` 
     * scales it visually to fit the screen without distorting or cropping.
     */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = CANVAS_BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      if (onChange) onChange(canvas.toDataURL('image/png'));
    }, []);

    /**
     * Mouse Position Mapping:
     * Because the canvas uses `object-fit: contain`, its visual size is often smaller than
     * its actual DOM bounding box (letterboxing). This function calculates the letterbox offset 
     * and maps the physical screen coordinates to the fixed internal coordinate system.
     */
    const getMousePos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      const internalWidth = canvas.width;
      const internalHeight = canvas.height;
      
      // Calculate the scaling factor imposed by object-fit: contain
      const scale = Math.min(rect.width / internalWidth, rect.height / internalHeight);
      
      // Calculate the visual offset (letterboxing) inside the DOM element
      const offsetX = (rect.width - internalWidth * scale) / 2;
      const offsetY = (rect.height - internalHeight * scale) / 2;
      
      return {
        x: (e.clientX - rect.left - offsetX) / scale,
        y: (e.clientY - rect.top - offsetY) / scale
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingEnabled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      const pos = getMousePos(e);
      setLastPos(pos);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = brushColor;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !isDrawingEnabled || !lastPos) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const pos = getMousePos(e);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      
      // Simple quadratic curve smoothing could go here, for now simple lines
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setLastPos(pos);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      setIsDrawing(false);
      setLastPos(null);
      if (onChange && canvas) {
        onChange(canvas.toDataURL('image/png'));
      }
    };

    return (
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          objectFit: 'contain',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerOut={handlePointerUp}
      />
    );
  }
);

