// Browser-only helpers for saving files from the app.
import { toDMY } from "./tailor";

export function todayForFile(): string {
  return toDMY(new Date()).replace(/\//g, "-");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadJson(json: string, filename: string) {
  downloadBlob(new Blob([json], { type: "application/json" }), filename);
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Saves an image: iPhones get the share sheet ("Save Image" → Photos); everyone else a direct download. */
export async function saveImage(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  if (isIOS() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  downloadBlob(blob, filename);
}

/** Reads an image file, shrinks it to fit `max` px, and returns a data URL (keeps exports offline-safe). */
export function imageFileToDataUrl(file: File, max = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * s));
      canvas.height = Math.max(1, Math.round(img.height * s));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

/** Tries to copy a web image into a data URL so photo export works; returns the URL unchanged if the site blocks it. */
export async function urlToDataUrl(src: string): Promise<string> {
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) return src;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return src;
    return await imageFileToDataUrl(new File([blob], "logo", { type: blob.type }));
  } catch {
    return src;
  }
}
