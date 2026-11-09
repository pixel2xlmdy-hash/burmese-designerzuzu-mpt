import { useState } from "react";

import { LOGO_FALLBACK, LOGO_URL } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function Logo({ className, alt = "မြောက်ပြင်သူ logo" }: { className?: string; alt?: string }) {
  const [src, setSrc] = useState(LOGO_URL);
  return (
    <img
      src={src}
      alt={alt}
      crossOrigin="anonymous"
      onError={() => setSrc(LOGO_FALLBACK)}
      className={cn("rounded-full object-cover bg-card", className)}
      draggable={false}
    />
  );
}
