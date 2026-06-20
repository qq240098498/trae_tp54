import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  value?: string;
  onChange?: (signatureData: string) => void;
  onSubmit?: (signatureData: string) => void;
  onCancel?: () => void;
  readonly?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

export default function SignaturePad({
  value,
  onChange,
  onSubmit,
  onCancel,
  readonly = false,
  width = 500,
  height = 200,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const lastPoint = useRef<Point | null>(null);

  const getCoordinates = useCallback((e: MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  }, []);

  const drawLine = useCallback((from: Point, to: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  const startDrawing = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (readonly) return;
      e.preventDefault();
      const point = getCoordinates(e);
      if (!point) return;
      setIsDrawing(true);
      lastPoint.current = point;
    },
    [readonly, getCoordinates]
  );

  const draw = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (readonly || !isDrawing) return;
      e.preventDefault();
      const point = getCoordinates(e);
      if (!point || !lastPoint.current) return;
      drawLine(lastPoint.current, point);
      lastPoint.current = point;
      setHasSignature(true);
    },
    [readonly, isDrawing, getCoordinates, drawLine]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
    if (!readonly) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hasData = imageData.data.some((channel, i) => i % 4 !== 3 && channel !== 0);
          if (hasData) {
            const dataUrl = canvas.toDataURL('image/png');
            onChange?.(dataUrl);
          }
        }
      }
    }
  }, [readonly, onChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange?.('');
  }, [onChange]);

  const handleSubmit = useCallback(() => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSubmit?.(dataUrl);
  }, [hasSignature, onSubmit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!readonly) {
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);
    }

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [readonly, startDrawing, draw, stopDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasSignature(true);
    };
    img.src = value;
  }, [value]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={cn(
            'w-full bg-white border-2 border-dashed rounded-xl transition-colors duration-200',
            readonly ? 'cursor-default border-gray-300' : 'cursor-crosshair',
            isDrawing ? 'border-primary-500 bg-primary-50/30' : 'border-gray-300 hover:border-primary-400'
          )}
          style={{ touchAction: readonly ? 'auto' : 'none' }}
        />
        {!hasSignature && !readonly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm">请在此处签名（支持鼠标和触摸）</span>
          </div>
        )}
        {!hasSignature && readonly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm">暂无签名</span>
          </div>
        )}
      </div>

      {!readonly && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {hasSignature ? (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                已签名
              </span>
            ) : (
              <span className="text-gray-400">请在上方区域手写签名</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            )}
            <button
              type="button"
              onClick={clearCanvas}
              className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
            >
              <Eraser className="w-4 h-4" />
              清空
            </button>
            {onSubmit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!hasSignature}
                className="btn-primary flex items-center gap-1.5 text-sm py-1.5"
              >
                <Check className="w-4 h-4" />
                提交签名
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
