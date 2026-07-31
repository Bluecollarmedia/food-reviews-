"use client";

import { useState } from "react";

/**
 * A thumbnail image that shows a YouTube-style shimmer placeholder while it
 * loads, then fades the real image in. Drop it inside any `relative` box.
 */
export default function ThumbnailImage({
  src,
  alt = "",
  priority = false,
  className = "absolute inset-0 h-full w-full object-cover",
}: {
  src: string;
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="thumb-shimmer absolute inset-0 overflow-hidden bg-neutral-900" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
