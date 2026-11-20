"use client";

import { useEffect, useRef, useState } from "react";
import { REEL_COMMENTS, SHARE_CONTACTS } from "@/data/content";
import { useUI } from "@/providers/UIProvider";
import { copyText } from "@/lib/storage-client";

function Sheet({ title, maxHeight, onClose, children }: { title: string; maxHeight: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="reels-sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="reels-sheet" style={{ maxHeight }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="reels-sheet-head">
          <span>{title}</span>
          <button onClick={onClose} aria-label="Bağla">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

type Comment = (typeof REEL_COMMENTS)[number];

export function ReelCommentsSheet({ reelId, onClose }: { reelId: number; onClose: () => void }) {
  const { toast, reelsToast } = useUI();
  const [comments, setComments] = useState<Comment[]>(REEL_COMMENTS);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // "Qiymət" may be asked once per reel (legacy spam guard).
  const askedPrice = useRef(new Set<number>());

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [comments]);

  const add = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setComments((c) => [...c, { user: "@siz", time: "indi", text: v, initial: "S", gradient: "#e76262" }]);
    setText("");
    toast("Rəyiniz əlavə edildi ✅");
  };

  const askPrice = () => {
    if (askedPrice.current.has(reelId)) {
      reelsToast("Siz artıq qiymət ilə maraqlanmısınız.");
      return;
    }
    askedPrice.current.add(reelId);
    add("Qiymət?");
  };

  return (
    <Sheet title="Rəylər" maxHeight="75vh" onClose={onClose}>
      <div ref={listRef} id="reels-comments-list" style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: ".85rem" }}>
        {comments.map((c, i) => (
          <div className="reels-comment" key={i}>
            <div className="reels-comment-avatar" style={{ background: c.gradient }}>{c.initial}</div>
            <div>
              <div className="reels-comment-user">{c.user} <span>{c.time}</span></div>
              <div className="reels-comment-text">{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: ".75rem 1.25rem", borderTop: "1px solid #333", display: "flex", gap: ".65rem", alignItems: "center" }}>
        <input
          id="reels-comment-input"
          className="reels-comment-input"
          type="text"
          placeholder="Rəy yazın..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            }
          }}
        />
        <button className="reels-price-btn" onClick={askPrice}>Qiymət</button>
      </div>
    </Sheet>
  );
}

export function ReelShareSheet({ onClose }: { onClose: () => void }) {
  const { toast } = useUI();
  const [sent, setSent] = useState<string[]>([]);
  return (
    <Sheet title="Mesaj vasitəsilə göndər" maxHeight="70vh" onClose={onClose}>
      <div style={{ padding: ".85rem 1.25rem", overflowY: "auto", flex: 1 }}>
        <div id="reels-share-contacts" style={{ display: "flex", gap: ".5rem", overflowX: "auto", scrollbarWidth: "none", paddingBottom: ".5rem" }}>
          {SHARE_CONTACTS.map((c) => (
            <div
              key={c.name}
              className="share-contact"
              onClick={() => {
                setSent((s) => [...s, c.name]);
                toast(`${c.name}-ə göndərildi ✅`);
              }}
            >
              <div className={`share-contact-avatar${sent.includes(c.name) ? " is-sent" : ""}`} style={{ background: c.gradient }}>{c.name[0]}</div>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: ".75rem 1.25rem", borderTop: "1px solid #333" }}>
        <button
          onClick={() => {
            onClose();
            toast("Video göndərildi! ✅");
          }}
          style={{ width: "100%", background: "#e76262", color: "white", border: "none", borderRadius: 12, padding: ".8rem", fontSize: ".9rem", fontWeight: 700, cursor: "pointer" }}
        >
          Göndər
        </button>
      </div>
    </Sheet>
  );
}

/** Bottom-sheet with save / copy link / report for a reel. */
export function ReelOptionsMenu({ reelId, onClose }: { reelId: number | null; onClose: () => void }) {
  const { toast } = useUI();
  const open = reelId !== null;
  const act = (msg: string, fn?: () => void) => () => {
    fn?.();
    toast(msg);
    onClose();
  };
  return (
    <>
      <div id="three-dots-modal" className={`three-dots-modal${open ? " open" : ""}`} role="menu">
        <div className="modal-item" id="save-item" onClick={act("Məhsul saxlanıldı")}>📌 Saxla</div>
        <div className="modal-item" id="copy-link-item" onClick={act("Link kopyalandı", () => copyText(`https://hobbi.az/reels/${reelId}`))}>
          🔗 Linki kopyala və ya Paylaş
        </div>
        <div className="modal-item" id="report-item" onClick={act("Şikayətiniz qeydə alındı")}>⚠️ Şikayət bildir</div>
      </div>
      <div id="modal-overlay-dark" className={`modal-overlay-dark${open ? " active" : ""}`} onClick={onClose} />
    </>
  );
}
