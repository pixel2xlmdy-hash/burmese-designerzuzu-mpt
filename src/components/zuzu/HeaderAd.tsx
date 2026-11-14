import { useEffect, useRef, useState } from "react";

const HEADER_AD_KEY = "2309f03b8a6fbe79e4bb43f9912b91a9";
const HEADER_AD_SRC = "https://bauval.org/22/2309f03b8a6fbe79e4bb43f9912b91a9";
const AD_W = 468;
const AD_H = 60;

// Unsandboxed srcdoc frame: keeps the page's real origin/referrer for Adsterra,
// but gives this banner its own window.atOptions so it never clashes with the
// bottom 320x50 banner.
const SRC_DOC = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script type="text/javascript">atOptions={'key':'${HEADER_AD_KEY}','format':'iframe','height':${AD_H},'width':${AD_W},'params':{}};</script><script type="text/javascript" src="${HEADER_AD_SRC}"></script></body></html>`;

export function HeaderAd({ onClose }: { onClose: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      const w = box.clientWidth - 4;
      const h = box.clientHeight;
      if (w <= 0) return;
      setScale(Math.min(1, w / AD_W, h > 0 ? h / AD_H : 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      data-testid="header-ad"
      className="no-print absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-gold/50 bg-background shadow-soft"
    >
      <div className="overflow-hidden" style={{ width: AD_W * scale, height: AD_H * scale }}>
        <iframe
          title="Advertisement"
          srcDoc={SRC_DOC}
          width={AD_W}
          height={AD_H}
          scrolling="no"
          className="block border-0"
          style={{ width: AD_W, height: AD_H, transform: `scale(${scale})`, transformOrigin: "top left" }}
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close ad"
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold leading-none text-primary-foreground shadow-soft ring-2 ring-background"
      >
        ✕
      </button>
    </div>
  );
}
