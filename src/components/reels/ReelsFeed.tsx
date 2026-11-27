"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { REELS } from "@/data/content";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/lib/api-client";
import { toReel, type ApiReel } from "@/lib/reels-client";
import { REEL_CREATED_EVENT } from "@/lib/events";
import { readStorage, writeStorage } from "@/lib/storage-client";
import { useUI } from "@/providers/UIProvider";
import type { Reel } from "@/types";
import { ReelCard } from "./ReelCard";
import { RatingPicker, type RatingPhase } from "./RatingPicker";
import { ReelCommentsPanel, ReelCommentsSheet, ReelOptionsMenu, ReelShareSheet } from "./ReelsSheets";

const BURST_MS = 480;
/** Matches the CSS transition of the desktop comments panel. */
const PANEL_MS = 420;
const ratingKey = (id: string) => `rating_${id}`;

export function ReelsFeed() {
  const isMobile = useIsMobile();
  const { backend } = useUI();
  const [reels, setReels] = useState<Reel[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [picker, setPicker] = useState<{ id: string; phase: RatingPhase } | null>(null);
  /** Desktop: the reel whose comments panel is shown; `open` drives the slide animation. */
  const [panel, setPanel] = useState<{ id: string; open: boolean } | null>(null);
  /** Phone: the reel whose comments sheet is shown. */
  const [sheet, setSheet] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [options, setOptions] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const panelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const feedRef = useRef<HTMLDivElement>(null);

  // Real reels from the API; the built-in examples only while there are none (or no database).
  const load = useCallback(() => {
    if (backend === "checking") return;
    if (backend === "offline") { setReels(REELS); return; }
    api<ApiReel[]>("/api/reels")
      .then((list) => setReels(list.length ? list.map(toReel) : REELS))
      .catch(() => setReels(REELS));
  }, [backend]);
  useEffect(() => { load(); }, [load]);
  // /reels?r=<id> (from a search result) starts at that video.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("r");
    if (!id || !reels.length) return;
    const el = feedRef.current?.querySelector<HTMLElement>(`[data-video-id="${CSS.escape(id)}"]`);
    if (el && feedRef.current) feedRef.current.scrollTo({ top: el.offsetTop });
  }, [reels]);
  useEffect(() => {
    const onCreated = () => { load(); feedRef.current?.scrollTo({ top: 0 }); };
    window.addEventListener(REEL_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(REEL_CREATED_EVENT, onCreated);
  }, [load]);

  useEffect(() => {
    const saved: Record<string, number> = {};
    for (const r of reels) saved[r.id] = parseInt(readStorage(ratingKey(r.id)) || "0", 10);
    setRatings(saved);
  }, [reels]);

  // Desktop: the top bar slides away while scrolling down through videos and back when scrolling up.
  useEffect(() => {
    document.body.classList.add("reels-page");
    const feed = feedRef.current;
    let last = feed?.scrollTop ?? 0;
    const onScroll = () => {
      if (!feed) return;
      const y = feed.scrollTop;
      if (Math.abs(y - last) < 8) return;
      document.body.classList.toggle("reels-nav-hidden", y > last && y > 40);
      last = y;
    };
    feed?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      feed?.removeEventListener("scroll", onScroll);
      document.body.classList.remove("reels-page", "reels-nav-hidden");
    };
  }, []);

  // enter → open on the next frame so the pop-in transition runs
  useEffect(() => {
    if (picker?.phase !== "enter") return;
    const raf = requestAnimationFrame(() => setPicker((p) => (p ? { ...p, phase: "open" } : p)));
    return () => cancelAnimationFrame(raf);
  }, [picker]);

  // Panel: mount closed, then open on the next frame so the slide animation runs.
  useEffect(() => {
    if (!panel || panel.open) return;
    if (panelTimer.current) return; // closing in progress
    const raf = requestAnimationFrame(() => setPanel((p) => (p ? { ...p, open: true } : p)));
    return () => cancelAnimationFrame(raf);
  }, [panel]);

  const closePicker = useCallback(() => {
    setPicker((p) => (p && p.phase !== "closing" ? { ...p, phase: "closing" } : p));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPicker(null), BURST_MS);
  }, []);

  const closePanel = useCallback(() => {
    setPanel((p) => (p ? { ...p, open: false } : p));
    clearTimeout(panelTimer.current);
    panelTimer.current = setTimeout(() => { panelTimer.current = undefined; setPanel(null); }, PANEL_MS);
  }, []);

  const openComments = (id: string) => {
    if (isMobile) { setSheet(id); return; }
    if (panel?.id === id && panel.open) { closePanel(); return; }
    clearTimeout(panelTimer.current);
    panelTimer.current = undefined;
    setPanel({ id, open: false });
  };

  // Escape closes the comments panel.
  useEffect(() => {
    if (!panel?.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel, closePanel]);

  const togglePicker = (id: string) => {
    if (picker && picker.phase !== "closing" && (isMobile || picker.id === id)) {
      closePicker();
      return;
    }
    clearTimeout(timer.current);
    setPicker({ id, phase: "enter" });
  };

  const rate = (id: string, value: number) => {
    writeStorage(ratingKey(id), value ? String(value) : null);
    setRatings((r) => ({ ...r, [id]: value }));
    closePicker();
  };

  const renderPicker = (id: string, asPortal: boolean) => (
    <RatingPicker
      id={asPortal ? "rating-portal" : undefined}
      className={asPortal ? "" : "rating-overlay"}
      phase={picker?.id === id ? picker.phase : null}
      value={ratings[id] ?? 0}
      onRate={(v) => rate(id, v)}
      onReset={() => rate(id, 0)}
    />
  );

  const sheetReel = reels.find((r) => r.id === sheet);

  return (
    <div
      className="page active"
      id="page-video"
      style={isMobile ? { height: "100dvh", maxHeight: "100dvh", overflow: "hidden" } : undefined}
    >
      <div className="video-feed" id="video-feed" ref={feedRef}>
        {reels.map((reel) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            rating={ratings[reel.id] ?? 0}
            fullHeight={isMobile}
            overlay={isMobile ? null : renderPicker(reel.id, false)}
            onRatingClick={() => togglePicker(reel.id)}
            onComments={() => openComments(reel.id)}
            onShare={() => setShare(true)}
            onMore={() => setOptions(reel.id)}
            commentsOpen={!isMobile && panel?.id === reel.id && panel.open}
            aside={!isMobile && panel?.id === reel.id
              ? <ReelCommentsPanel reelId={reel.id} live={Boolean(reel.live)} open={panel.open} onClose={closePanel} />
              : null}
          />
        ))}
      </div>

      {/* Phone: one fixed picker portal shared by all reels. */}
      {isMobile && picker && createPortal(renderPicker(picker.id, true), document.body)}

      {sheetReel && <ReelCommentsSheet reelId={sheetReel.id} live={Boolean(sheetReel.live)} onClose={() => setSheet(null)} />}
      {share && <ReelShareSheet onClose={() => setShare(false)} />}
      <ReelOptionsMenu reelId={options} onClose={() => setOptions(null)} />
    </div>
  );
}
