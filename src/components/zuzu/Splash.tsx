import { useEffect, useState } from "react";

import { playChime } from "@/lib/chime";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cleanupTap: (() => void) | undefined;
    void playChime().then((ok) => {
      if (ok) return;
      // Browsers may hold audio until the first touch — play the chime on that tap.
      const onTap = () => void playChime();
      window.addEventListener("pointerdown", onTap, { once: true });
      cleanupTap = () => window.removeEventListener("pointerdown", onTap);
    });
    const leave = setTimeout(() => setLeaving(true), 2500);
    const done = setTimeout(onDone, 2950);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
      cleanupTap?.();
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-label="မြောက်ပြင်သူ"
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-splash px-8 text-center transition-opacity duration-500",
        leaving && "pointer-events-none opacity-0",
      )}
    >
      <Logo className="h-40 w-40 animate-breathe" />
      <div className="animate-rise space-y-2" style={{ animationDelay: "250ms" }}>
        <h1 className="font-display text-4xl font-bold leading-snug text-primary">မြောက်ပြင်သူ</h1>
        <p className="font-script text-2xl italic tracking-wide text-gold">Designer Zu Zu</p>
      </div>
      <p
        className="animate-rise max-w-xs text-base leading-loose text-foreground/80"
        style={{ animationDelay: "600ms" }}
      >
        မင်္ဂလာပါ... မြောက်ပြင်သူမှ လှိုက်လှဲစွာ ကြိုဆိုပါသည်
      </p>
      <div
        className="animate-rise h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent"
        style={{ animationDelay: "900ms" }}
      />
    </div>
  );
}
