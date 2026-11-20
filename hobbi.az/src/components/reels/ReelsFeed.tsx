"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { REELS } from "@/data/content";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { readStorage, writeStorage } from "@/lib/storage-client";
import { ReelCard } from "./ReelCard";
import { RatingPicker, type RatingPhase } from "./RatingPicker";
import { ReelCommentsSheet, ReelOptionsMenu, ReelShareSheet } from "./ReelsSheets";

const BURST_MS = 480;
const ratingKey = (id: number) => `rating_${id}`;

export function ReelsFeed() {
  const isMobile = useIsMobile();
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [picker, setPicker] = useState<{ id: number; phase: RatingPhase } | null>(null);
  const [comments, setComments] = useState<number | null>(null);
  const [share, setShare] = useState(false);
  const [options, setOptions] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const saved: Record<number, number> = {};
    for (const r of REELS) saved[r.id] = parseInt(readStorage(ratingKey(r.id)) || "0", 10);
    setRatings(saved);
  }, []);

  // enter → open on the next frame so the pop-in transition runs
  useEffect(() => {
    if (picker?.phase !== "enter") return;
    const raf = requestAnimationFrame(() => setPicker((p) => (p ? { ...p, phase: "open" } : p)));
    return () => cancelAnimationFrame(raf);
  }, [picker]);

  const closePicker = useCallback(() => {
    setPicker((p) => (p && p.phase !== "closing" ? { ...p, phase: "closing" } : p));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPicker(null), BURST_MS);
  }, []);

  const togglePicker = (id: number) => {
    if (picker && picker.phase !== "closing" && (isMobile || picker.id === id)) {
      closePicker();
      return;
    }
    clearTimeout(timer.current);
    setPicker({ id, phase: "enter" });
  };

  const rate = (id: number, value: number) => {
    writeStorage(ratingKey(id), value ? String(value) : null);
    setRatings((r) => ({ ...r, [id]: value }));
    closePicker();
  };

  const renderPicker = (id: number, asPortal: boolean) => (
    <RatingPicker
      id={asPortal ? "rating-portal" : undefined}
      className={asPortal ? "" : "rating-overlay"}
      phase={picker?.id === id ? picker.phase : null}
      value={ratings[id] ?? 0}
      onRate={(v) => rate(id, v)}
      onReset={() => rate(id, 0)}
    />
  );

  return (
    <div
      className="page active"
      id="page-video"
      style={isMobile ? { height: "100dvh", maxHeight: "100dvh", overflow: "hidden" } : undefined}
    >
      <div className="video-feed" id="video-feed">
        {REELS.map((reel) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            rating={ratings[reel.id] ?? 0}
            fullHeight={isMobile}
            overlay={isMobile ? null : renderPicker(reel.id, false)}
            onRatingClick={() => togglePicker(reel.id)}
            onComments={() => setComments(reel.id)}
            onShare={() => setShare(true)}
            onMore={() => setOptions(reel.id)}
          />
        ))}
      </div>

      {/* Phone: one fixed picker portal shared by all reels. */}
      {isMobile && picker && createPortal(renderPicker(picker.id, true), document.body)}

      {comments !== null && <ReelCommentsSheet reelId={comments} onClose={() => setComments(null)} />}
      {share && <ReelShareSheet onClose={() => setShare(false)} />}
      <ReelOptionsMenu reelId={options} onClose={() => setOptions(null)} />
    </div>
  );
}
