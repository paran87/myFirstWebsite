"use client";

import { useState } from "react";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/image";

/**
 * `next/image` in fill mode (parent must be positioned) that serves a
 * resized WebP instead of the full-size upload. If the optimizer can't
 * fetch the source (unlisted host, local TLS issues, quota), it retries
 * with the original file before reporting an error.
 */
export function OptimizedImage({
  src,
  alt,
  sizes,
  className = "",
  eager = false,
  quality = 75,
  onError,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  /** Load immediately instead of lazily — for above-the-fold images. */
  eager?: boolean;
  quality?: 60 | 75 | 85;
  onError?: () => void;
}) {
  const [useOriginal, setUseOriginal] = useState(!canOptimizeImage(src));

  return (
    <Image
      key={useOriginal ? "original" : "optimized"}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      loading={eager ? "eager" : "lazy"}
      unoptimized={useOriginal}
      className={className}
      onError={() => {
        if (!useOriginal) setUseOriginal(true);
        else onError?.();
      }}
    />
  );
}
