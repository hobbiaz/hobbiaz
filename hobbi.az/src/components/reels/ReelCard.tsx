"use client";

import { useEffect, useRef, useState } from "react";
import type { Reel } from "@/types";
import { useUI } from "@/providers/UIProvider";
import {
  IconMusic, IconPhoneWhite, IconPin, IconReelCart, IconReelCart2, IconReelComment, IconReelComment2,
  IconReelDots, IconReelDots2, IconReelShare, IconReelShare2, IconSellerBadge,
} from "@/components/icons";
import { DesktopRatingStar, MobileRatingStar } from "./StarIcons";

export function formatCount(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
}

interface Props {
  reel: Reel;
  rating: number;
  /** Rating picker rendered inside the frame (desktop only). */
  overlay: React.ReactNode;
  fullHeight: boolean;
  onRatingClick: () => void;
  onComments: () => void;
  onShare: () => void;
  onMore: () => void;
}

export function ReelCard({ reel: v, rating, overlay, fullHeight, onRatingClick, onComments, onShare, onMore }: Props) {
  const { toast } = useUI();
  const [videoFailed, setVideoFailed] = useState(false);
  const [pop, setPop] = useState(false);
  const rated = rating > 0;

  // Small bounce on the sidebar star right after rating (legacy .star-pop).
  const prevRating = useRef(rating);
  useEffect(() => {
    if (prevRating.current === rating) return;
    prevRating.current = rating;
    if (rating === 0) return;
    setPop(true);
    const t = setTimeout(() => setPop(false), 450);
    return () => clearTimeout(t);
  }, [rating]);

  const ratingBtnClass = `video-action-btn rating-btn${rated ? " is-rated" : ""}${pop ? " star-pop" : ""}`;
  const handleRating = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRatingClick();
  };

  return (
    <div className="video-card reels-desktop" data-video-id={v.id} style={fullHeight ? { height: "100dvh" } : undefined}>
      <div className="reels-stage">
        <div className="video-frame">
          <div className="video-bg-art" style={{ background: v.gradient }}>{v.emoji}</div>
          {v.video && !videoFailed && (
            <video className="video-real-el" src={v.video} autoPlay loop muted playsInline onError={() => setVideoFailed(true)} />
          )}

          {/* Phone sidebar (absolute inside the frame) */}
          <div className="video-sidebar reels-mobile-sidebar">
            <div className="video-action">
              <button className={ratingBtnClass} data-id={v.id} onClick={handleRating} aria-label="Reytinq ver">
                <MobileRatingStar rated={rated} />
              </button>
              <span>{formatCount(v.ratingCount)}</span>
            </div>
            <div className="video-action">
              <button className="video-action-btn" onClick={onComments} aria-label="Rəylər"><IconReelComment /></button>
              <span>{formatCount(v.commentCount)}</span>
            </div>
            <div className="video-action">
              <button className="video-action-btn" onClick={onShare} aria-label="Paylaş"><IconReelShare /></button>
              <span>{formatCount(v.shareCount)}</span>
            </div>
            <div className="video-action">
              <button className="video-action-btn three-dots-btn" data-id={v.id} onClick={onMore} aria-label="Daha çox"><IconReelDots /></button>
              <span />
            </div>
            <div className="video-action">
              <button className="video-action-btn" aria-label="Səbət"><IconReelCart /></button>
              <span />
            </div>
          </div>

          {overlay}

          <div className="video-info">
            <div className="video-info-bottom">
              <div className="profile-row">
                <div className="profile-left">
                  <div className="video-creator-avatar">{v.creatorAvatar}</div>
                  <div className="video-creator-name">
                    @{v.creator}
                    {v.isSeller && <IconSellerBadge />}
                  </div>
                </div>
                <button className="msg-btn">Mesaj göndər</button>
              </div>
              <div className="caption-text">
                {v.caption} <span style={{ color: "rgba(255,255,255,.75)" }}>#əl_işi #hobbi</span>
              </div>
              <div className="reels-music-ticker" aria-hidden="true">
                <IconMusic />
                <div className="reels-music-ticker-inner">
                  <span>Orijinal səs — @{v.creator}</span>
                  <span>Orijinal səs — @{v.creator}</span>
                </div>
              </div>
              <div className="info-tags">
                <button className="info-tag" onClick={() => toast(`Ünvan: ${v.address}`)}>
                  <IconPin />
                  {v.address}
                </button>
                <button className="info-tag" onClick={() => { window.location.href = `tel:${v.phone.replace(/\s/g, "")}`; }}>
                  <IconPhoneWhite />
                  {v.phone}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop sidebar (sibling of the frame) */}
        <div className="video-sidebar reels-desktop-sidebar">
          <div className="video-action">
            <button className={ratingBtnClass} data-id={v.id} onClick={handleRating} aria-label="Reytinq ver">
              <DesktopRatingStar rated={rated} />
            </button>
            <span>{formatCount(v.ratingCount)}</span>
          </div>
          <div className="video-action">
            <button className="video-action-btn" onClick={onComments} aria-label="Rəylər"><IconReelComment2 /></button>
            <span>{formatCount(v.commentCount)}</span>
          </div>
          <div className="video-action">
            <button className="video-action-btn" onClick={onShare} aria-label="Paylaş"><IconReelShare2 /></button>
            <span>{formatCount(v.shareCount)}</span>
          </div>
          <div className="video-action">
            <button className="video-action-btn three-dots-btn" data-id={v.id} onClick={onMore} aria-label="Daha çox"><IconReelDots2 /></button>
          </div>
          <div className="video-action">
            <button className="video-action-btn" onClick={() => toast("Səbətə əlavə edildi 🛒")} aria-label="Səbətə"><IconReelCart2 /></button>
            <span>Səbətə</span>
          </div>
        </div>
      </div>
    </div>
  );
}
