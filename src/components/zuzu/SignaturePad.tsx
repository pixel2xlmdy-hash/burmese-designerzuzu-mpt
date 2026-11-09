import { useEffect, useRef, type PointerEvent } from "react";
import { Eraser } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  // Size the canvas to its box once, then paint any saved signature.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = getComputedStyle(canvas).color;
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
    // Only on mount: later value changes come from this pad itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  };

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    dirty.current = true;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser /> ဖျက်ရန်
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
        className="h-32 w-full touch-none rounded-xl border border-dashed border-gold/60 bg-paper text-ink"
        aria-label={label}
      />
    </div>
  );
}
