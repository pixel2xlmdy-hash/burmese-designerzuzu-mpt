// Browser-only: turns a voucher element into a picture or a one-page A4 PDF.
import { saveImage, downloadBlob } from "./download";

/** Draws the element at its real (unscaled) size, tightly cropped to its own box, as a PNG blob. */
async function inlineAllImages(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const restores: Array<() => void> = [];

  await Promise.all(
    imgs.map(async (img) => {
      try {
        const origSrc = img.getAttribute("src") || "";
        if (!origSrc) return;
        if (!img.complete || img.naturalWidth === 0) {
          await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          });
        }
        if (img.naturalWidth > 0 && !origSrc.startsWith("data:")) {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            img.src = dataUrl;
            restores.push(() => {
              img.src = origSrc;
            });
          }
        }
        if (img.decode) await img.decode().catch(() => {});
      } catch {
        // ignore
      }
    })
  );

  return () => restores.forEach((fn) => fn());
}

export async function captureNode(node: HTMLElement, pixelRatio = 2): Promise<Blob> {
  const { toBlob } = await import("html-to-image");
  await document.fonts.ready;
  const restoreImages = await inlineAllImages(node);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const width = node.offsetWidth;
  const height = node.scrollHeight;
  const opts = {
    pixelRatio,
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    backgroundColor: getComputedStyle(node).backgroundColor,
    style: { transform: "none", margin: "0" },
  };
  let blob: Blob | null;
  try {
    try {
      blob = await toBlob(node, opts);
    } catch {
      blob = await toBlob(node, { ...opts, skipFonts: true });
    }
  } finally {
    restoreImages();
  }
  if (!blob) throw new Error("Empty image");
  return blob;
}


export async function saveNodeAsPhoto(node: HTMLElement, filename: string) {
  await saveImage(await captureNode(node), filename);
}

/** A4 portrait, 6mm margins, picture at most 190mm wide and shrunk to stay on one page. */
export const PDF_PAGE = { width: 210, height: 297, margin: 6, maxWidth: 190 };

export function fitOnA4(pxWidth: number, pxHeight: number) {
  const availH = PDF_PAGE.height - PDF_PAGE.margin * 2;
  let w = PDF_PAGE.maxWidth;
  let h = (pxHeight / pxWidth) * w;
  if (h > availH) {
    h = availH;
    w = (pxWidth / pxHeight) * h;
  }
  return { x: (PDF_PAGE.width - w) / 2, y: PDF_PAGE.margin, w, h };
}

export async function saveNodeAsPdf(node: HTMLElement, filename: string) {
  const png = await captureNode(node);
  const bmp = await createImageBitmap(png);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { x, y, w, h } = fitOnA4(canvas.width, canvas.height);
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", x, y, w, h);
  downloadBlob(pdf.output("blob"), filename);
}
