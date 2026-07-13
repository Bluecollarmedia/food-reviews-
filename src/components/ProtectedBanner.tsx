"use client";

export default function ProtectedBanner({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      className="block h-auto w-full rounded-3xl select-none"
      style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
    />
  );
}
