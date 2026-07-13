function loadImage(file: File | Blob): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
      "image/jpeg",
      quality
    );
  });
}

/** Center-crops to a square and downsizes to `size`x`size`. Used for avatars. */
export async function resizeImageToSquare(file: File | Blob, size = 256, quality = 0.85) {
  const { img, url } = await loadImage(file);
  try {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return await toBlob(canvas, quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Downsizes so neither dimension exceeds `maxDim`, keeping aspect ratio. Used for comment photos. */
export async function resizeImageMaxDimension(file: File | Blob, maxDim = 1600, quality = 0.8) {
  const { img, url } = await loadImage(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, w, h);
    return await toBlob(canvas, quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
