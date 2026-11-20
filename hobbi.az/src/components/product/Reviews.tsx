"use client";

import { forwardRef, useState } from "react";
import type { Review } from "@/types";
import { useUI } from "@/providers/UIProvider";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { IconCameraSmall } from "@/components/icons";
import { pressable } from "@/lib/a11y";

function ReviewItem({ review: r, onReply, onOpenUser }: { review: Review; onReply: (text: string) => void; onOpenUser: () => void }) {
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
        </div>
        <div className="pd-review-text">{r.text}</div>
        {r.images.length > 0 && (
          <div className="pd-review-images">
            {r.images.map((src, i) => <img key={i} className="pd-review-img" src={src} alt="" />)}
          </div>
        )}
        <div className="pd-review-actions">
          <button className="pd-reply-btn" onClick={() => setOpen((o) => !o)}>{open ? "Ləğv et" : "Cavab yaz"}</button>
        </div>
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
  onChange: (reviews: Review[]) => void;
  onOpenUser: (name: string, avatar: string) => void;
}

export const Reviews = forwardRef<HTMLDivElement, Props>(function Reviews({ reviews, onChange, onOpenUser }, ref) {
  const { toast } = useUI();
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const addPhotos = (files: FileList | null) => {
    Array.from(files ?? []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setPhotos((p) => [...p, String(e.target?.result)]);
      reader.readAsDataURL(file);
    });
  };

  const submit = () => {
    if (!text.trim()) { toast("Zəhmət olmasa rəy yazın"); return; }
    onChange([...reviews, { id: Date.now(), user: "Siz", avatar: "", text: text.trim(), images: photos, replies: [] }]);
    setText("");
    setPhotos([]);
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
            onReply={(reply) => onChange(reviews.map((x) => (x.id === r.id ? { ...x, replies: [...x.replies, { user: "Siz", text: reply }] } : x)))}
          />
        ))}
      </div>
      <div className="pd-write-review">
        <div className="pd-write-review-title">Rəy yaz</div>
        <textarea className="pd-review-textarea" id="pd-review-input" placeholder="Məhsul haqqında fikirlərinizi yazın..." value={text} onChange={(e) => setText(e.target.value)} />
        <div className="pd-photo-previews" id="pd-photo-previews">
          {photos.map((src, i) => (
            <div className="pd-photo-thumb-wrap" key={i}>
              <img className="pd-photo-thumb" src={src} alt="" />
              <button className="pd-photo-thumb-remove" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        <div className="pd-review-form-row">
          <label className="pd-photo-label">
            <IconCameraSmall />
            Şəkil
            <input type="file" accept="image/*" multiple onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          </label>
          <button className="pd-send-review-btn" onClick={submit}>Göndər</button>
        </div>
      </div>
    </div>
  );
});
