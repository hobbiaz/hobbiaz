"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

/** `<img>` that swaps to a placeholder when the remote photo fails (legacy `onerror` pattern). */
export function ImageWithFallback({
  src, alt, className, style, fallback, loading,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallback: ReactNode;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <img className={className} style={style} src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />;
}
