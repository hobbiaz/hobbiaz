"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  title: string;
  images: string[];
  start: number;
  liked: boolean;
  onLike: () => void;
  /** The product's "Nömrəni göstər" button, rendered in the top bar. */
  phoneButton: React.ReactNode;
  onClose: () => void;
}

/**
 * Full-screen photo viewer (opened by clicking a product photo): big image on black,
 * arrows / keyboard / swipe to move, counter and thumbnails, title + phone + like + close on top.
 */
export function ImageLightbox({ title, images, start, liked, onLike, phoneButton, onClose }: Props) {
  const [index, setIndex] = useState(start);
  const count = images.length;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  // Own keyboard handling; Escape must close only the viewer, not the product page under it.
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopImmediatePropagation(); e.preventDefault(); onClose(); }
      else if (e.key === "ArrowRight") goRef.current(1);
      else if (e.key === "ArrowLeft") goRef.current(-1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Swipe on touch screens.
  const touchX = useRef<number | null>(null);

  return createPortal(
    <div className="lb-overlay" role="dialog" aria-modal="true" aria-label={`${title}: şəkillər`}>
      <div className="lb-top">
        <div className="lb-title">{title}</div>
        <div className="lb-actions">
          {phoneButton}
          <button type="button" className="lb-icon-btn" onClick={onLike} aria-label={liked ? "Bəyənməni geri al" : "Bəyən"} aria-pressed={liked}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill={liked ? "#e85c5c" : "none"} stroke={liked ? "#e85c5c" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7.5 4C4.46 4 2 6.46 2 9.5C2 15 8.5 20 12 21.163C15.5 20 22 15 22 9.5C22 6.46 19.54 4 16.5 4C14.64 4 13 4.92 12 6.34C11 4.92 9.36 4 7.5 4Z" />
            </svg>
          </button>
          <button type="button" className="lb-icon-btn" onClick={onClose} aria-label="Bağla">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>
      </div>

      <div
        className="lb-stage"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          const startX = touchX.current;
          const endX = e.changedTouches[0]?.clientX;
          touchX.current = null;
          if (startX === null || endX === undefined || Math.abs(endX - startX) < 40) return;
          go(endX < startX ? 1 : -1);
        }}
      >
        {count > 1 && (
          <button type="button" className="lb-arrow lb-prev" onClick={() => go(-1)} aria-label="Əvvəlki şəkil">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        )}
        <div className="lb-image-wrap">
          <img key={images[index]} className="lb-image" src={images[index]} alt={`${title} – şəkil ${index + 1}`} />
          <span className="lb-counter">{index + 1} / {count}</span>
        </div>
        {count > 1 && (
          <button type="button" className="lb-arrow lb-next" onClick={() => go(1)} aria-label="Növbəti şəkil">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      <div className="lb-thumbs">
        {images.map((src, i) => (
          <button key={src + i} type="button" className={`lb-thumb${i === index ? " active" : ""}`} onClick={() => setIndex(i)} aria-label={`Şəkil ${i + 1}`}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
