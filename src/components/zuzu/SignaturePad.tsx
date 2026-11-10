import { useEffect, useRef, type PointerEvent } from "react";
import { Eraser } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SigMode } from "@/lib/tailor";
import { cn } from "@/lib/utils";

function Canvas({
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
    <div className="relative">
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={clear}
        className="absolute right-1 top-1 h-7 bg-card/80 px-2 text-xs"
      >
        <Eraser /> ပြန်ဖျက်
      </Button>
    </div>
  );
}

const MODES: { k: SigMode; label: string }[] = [
  { k: "draw", label: "✍️ လက်မှတ်ထိုးမည်" },
  { k: "type", label: "⌨️ နာမည်ရိုက်မည်" },
];

/** Signature box with two ways to sign: draw on the canvas, or type a name. */
export function SignaturePad({
  label,
  value,
  onChange,
  mode,
  onModeChange,
  text,
  onTextChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  mode: SigMode;
  onModeChange: (m: SigMode) => void;
  text: string;
  onTextChange: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <div role="radiogroup" aria-label={`${label} mode`} className="flex rounded-full bg-secondary p-0.5">
          {MODES.map(({ k, label: l }) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={mode === k}
              onClick={() => onModeChange(k)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11.5px] leading-none transition",
                mode === k ? "bg-card font-semibold text-primary shadow-soft" : "text-muted-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {mode === "draw" ? (
        <Canvas label={label} value={value} onChange={onChange} />
      ) : (
        <Input
          aria-label={`${label} နာမည်`}
          value={text}
          placeholder={placeholder}
          onChange={(e) => onTextChange(e.target.value)}
          className="h-32 rounded-xl border-dashed border-gold/60 bg-paper text-center font-display text-xl text-ink"
        />
      )}
    </div>
  );
}
