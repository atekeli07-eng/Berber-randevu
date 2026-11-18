import { isAllowedSalonImageType, salonImageTooLarge } from "@berber/shared";

/** Tarayıcıda en uzun kenarı sınırlar ve WebP (olmazsa JPG) olarak küçültür. */
export async function resizeSalonImage(file: File, maxEdge: number): Promise<Blob> {
  if (!isAllowedSalonImageType(file.type)) {
    throw new Error("Yalnızca JPG, PNG veya WebP yükleyin.");
  }
  const tooBig = salonImageTooLarge(file.size, false);
  if (tooBig) throw new Error(tooBig);

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Görsel hazırlanamadı.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await blobFromCanvas(canvas, "image/webp", 0.82);
  const blob = webp ?? (await blobFromCanvas(canvas, "image/jpeg", 0.82));
  if (!blob) throw new Error("Görsel hazırlanamadı.");
  const stillBig = salonImageTooLarge(blob.size, true);
  if (stillBig) throw new Error(stillBig);
  return blob;
}

function blobFromCanvas(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
