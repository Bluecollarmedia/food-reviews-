"use client";

import { useEffect, useRef, useState } from "react";

const EDITOR_WIDTH = 480;
const EDITOR_HEIGHT = 270; // 16:9
const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function ImageCropper({
  file,
  onConfirm,
  onCancel,
}: {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(
    null
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const s = Math.max(EDITOR_WIDTH / w, EDITOR_HEIGHT / h);
    setImgSize({ w, h });
    setMinScale(s);
    setScale(s);
    setPos({
      x: (EDITOR_WIDTH - w * s) / 2,
      y: (EDITOR_HEIGHT - h * s) / 2,
    });
  }

  function clampPos(x: number, y: number, s: number, size: { w: number; h: number }) {
    return {
      x: clamp(x, EDITOR_WIDTH - size.w * s, 0),
      y: clamp(y, EDITOR_HEIGHT - size.h * s, 0),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !imgSize) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const next = clampPos(dragRef.current.posX + dx, dragRef.current.posY + dy, scale, imgSize);
    setPos(next);
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function handleZoom(newScale: number) {
    if (!imgSize) return;
    const cx = EDITOR_WIDTH / 2;
    const cy = EDITOR_HEIGHT / 2;
    const imgPtX = (cx - pos.x) / scale;
    const imgPtY = (cy - pos.y) / scale;
    const rawX = cx - imgPtX * newScale;
    const rawY = cy - imgPtY * newScale;
    const next = clampPos(rawX, rawY, newScale, imgSize);
    setScale(newScale);
    setPos(next);
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !imgSize) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sourceX = -pos.x / scale;
    const sourceY = -pos.y / scale;
    const sourceW = EDITOR_WIDTH / scale;
    const sourceH = EDITOR_HEIGHT / scale;

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-5 shadow-xl">
        <h3 className="font-display text-xl tracking-wide text-foreground">
          Position the Thumbnail
        </h3>
        <p className="mt-1 text-xs text-foreground/60">
          Drag to reposition, use the slider to zoom. This will be the 16:9 thumbnail shown on the site.
        </p>

        <div
          className="relative mt-4 touch-none overflow-hidden rounded-lg border border-border bg-black"
          style={{ width: EDITOR_WIDTH, height: EDITOR_HEIGHT, maxWidth: "100%" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={imgUrl}
              alt="Crop preview"
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute left-0 top-0 max-w-none cursor-grab select-none active:cursor-grabbing"
              style={
                imgSize
                  ? {
                      width: imgSize.w * scale,
                      height: imgSize.h * scale,
                      transform: `translate(${pos.x}px, ${pos.y}px)`,
                    }
                  : undefined
              }
            />
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-foreground/60">Zoom</span>
          <input
            type="range"
            min={minScale}
            max={minScale * 3}
            step={0.01}
            value={scale}
            onChange={(e) => handleZoom(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground/70 hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Use This Photo
          </button>
        </div>
      </div>
    </div>
  );
}
