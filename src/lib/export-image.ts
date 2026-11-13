// Browser-only: turns a voucher element into a picture or a one-page A4 PDF.
import { saveImage, downloadBlob } from "./download";

/** Draws the element at its real (unscaled) size, tightly cropped to its own box, as a PNG blob. */
export async function captureNode(node: HTMLElement, pixelRatio = 2): Promise<Blob> {
  // Only `toBlob` is used from html-to-image across the app, so the dev bundler always exposes it.
  const { toBlob } = await import("html-to-image");
  await document.fonts.ready;
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
    blob = await toBlob(node, opts);
  } catch {
    blob = await toBlob(node, { ...opts, skipFonts: true });
  }
  if (!blob) throw new Error("empty image");
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
