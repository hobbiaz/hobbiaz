"use client";

import { forwardRef, useState } from "react";
import type { Review } from "@/types";
import { useUI } from "@/providers/UIProvider";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { pressable } from "@/lib/a11y";

function ReviewItem({ review: r, onReply, onOpenUser, canReply }: { review: Review; onReply: (text: string) => void; onOpenUser: () => void; canReply: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const fallback = <div className="pd-avatar-fallback">{r.user[0] || "?"}</div>;

  return (
    <div className="pd-review-item" data-review-id={r.id}>
      <div {...pressable} className="pd-review-avatar" onClick={onOpenUser}>
        {r.avatar ? <ImageWithFallback src={r.avatar} alt={r.user} fallback={fallback} /> : fallback}
      </div>
      <div className="pd-review-body">
        <div className="pd-review-header">
          <span {...pressable} className="pd-review-user" onClick={onOpenUser}>{r.user}</span>
          {r.rating !== undefined && <span style={{ color: "#f5a623", marginLeft: ".4rem", fontSize: ".8rem" }} aria-label={`${r.rating} ulduz`}>{"★".repeat(r.rating)}</span>}
        </div>
        <div className="pd-review-text">{r.text}</div>
        {r.images.length > 0 && (
          <div className="pd-review-images">
            {r.images.map((src, i) => <img key={i} className="pd-review-img" src={src} alt="" />)}
          </div>
        )}
        {canReply && r.replies.length === 0 && (
          <div className="pd-review-actions">
            <button className="pd-reply-btn" onClick={() => setOpen((o) => !o)}>{open ? "Ləğv et" : "Cavab yaz"}</button>
          </div>
        )}
        <div className={`pd-reply-form${open ? " open" : ""}`} id={`pd-reply-form-${r.id}`}>
          <input
            type="text"
            className="pd-reply-input"
            placeholder="Cavabınızı yazın..."
            value={text}
            autoFocus={open}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="pd-reply-send"
            onClick={() => {
              if (!text.trim()) return;
              onReply(text.trim());
              setText("");
              setOpen(false);
            }}
          >
            Göndər
          </button>
        </div>
        {r.replies.length > 0 && (
          <div className="pd-replies">
            {r.replies.map((rep, i) => (
              <div className="pd-reply-item" key={i}>
                <div className="pd-reply-avatar">{rep.user[0] || "?"}</div>
                <div className="pd-reply-body">
                  <div className="pd-reply-user">{rep.user}</div>
                  <div className="pd-reply-text">{rep.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  reviews: Review[];
  /** Resolves true when the review was saved. */
  onSubmit: (text: string, rating: number) => Promise<boolean>;
  onReply: (review: Review, text: string) => void;
  /** Only the seller answers reviews. */
  canReply: boolean;
  /** Sellers don't review their own product. */
  canWrite: boolean;
  onOpenUser: (name: string, avatar: string) => void;
}

export const Reviews = forwardRef<HTMLDivElement, Props>(function Reviews({ reviews, onSubmit, onReply, canReply, canWrite, onOpenUser }, ref) {
  const { toast } = useUI();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim()) { toast("Zəhmət olmasa rəy yazın"); return; }
    setBusy(true);
    const saved = await onSubmit(text.trim(), rating);
    setBusy(false);
    if (!saved) return;
    setText("");
    setRating(5);
    toast("Rəyiniz əlavə edildi ✅");
    setTimeout(() => (ref && "current" in ref ? ref.current : null)?.scrollIntoView({ behavior: "smooth" }), 150);
  };

  return (
    <div className="pd-reviews" id="pd-reviews-section" ref={ref}>
      <h3 className="pd-reviews-title">Rəylər</h3>
      <div id="pd-reviews-list">
        {reviews.map((r) => (
          <ReviewItem
            key={r.id}
            review={r}
            onOpenUser={() => onOpenUser(r.user, r.avatar)}
            canReply={canReply}
            onReply={(reply) => onReply(r, reply)}
          />
        ))}
      </div>
      {reviews.length === 0 && <p style={{ color: "var(--outline)", fontSize: ".9rem", margin: ".5rem 0 1rem" }}>Hələ rəy yoxdur. İlk rəyi siz yazın!</p>}
      {canWrite && (
        <div className="pd-write-review">
          <div className="pd-write-review-title">Rəy yaz</div>
          <div role="radiogroup" aria-label="Qiymətləndirmə" style={{ display: "flex", gap: ".15rem", marginBottom: ".5rem" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ulduz`}
                onClick={() => setRating(n)}
                style={{ background: "none", border: 0, cursor: "pointer", fontSize: "1.35rem", color: n <= rating ? "#f5a623" : "var(--outline-var)", padding: 0 }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea className="pd-review-textarea" id="pd-review-input" placeholder="Məhsul haqqında fikirlərinizi yazın..." value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
          <div className="pd-review-form-row">
            <span />
            <button className="pd-send-review-btn" onClick={submit} disabled={busy}>{busy ? "Göndərilir…" : "Göndər"}</button>
          </div>
        </div>
      )}
    </div>
  );
});
