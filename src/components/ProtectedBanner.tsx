"use client";

export default function ProtectedBanner({
  src,
  alt,
  className = "block h-auto w-full rounded-3xl select-none",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      className={className}
      style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
    />
  );
}
