"use client";

import { useEffect, useRef, useState } from "react";
import { REEL_COMMENTS, SHARE_CONTACTS } from "@/data/content";
import { useUI } from "@/providers/UIProvider";
import { copyText } from "@/lib/storage-client";
import { api, timeAgo } from "@/lib/api-client";
import { pressable } from "@/lib/a11y";

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

interface Comment { key: string; user: string; time: string; text: string; initial: string; gradient: string }
interface ApiComment { id: string; body: string; createdAt: string; user?: { id: string; name: string } }

const GRADIENTS = ["linear-gradient(135deg,#e76262,#944a00)", "linear-gradient(135deg,#3a7bd5,#1a4a8a)", "linear-gradient(135deg,#1a7a5e,#006b58)", "linear-gradient(135deg,#7a3a8a,#b05ac0)"];
const fromApi = (c: ApiComment): Comment => {
  const name = c.user?.name ?? "Siz";
  return { key: c.id, user: "@" + name, time: timeAgo(c.createdAt), text: c.body, initial: name[0]?.toUpperCase() ?? "?", gradient: GRADIENTS[name.length % GRADIENTS.length]! };
};
const DEMO: Comment[] = REEL_COMMENTS.map((c, i) => ({ ...c, key: "demo" + i }));

/**
 * A reel's comments: list + input + "Qiymət" quick question.
 * Live reels read and write /api/reels/<id>/comments; the demo reels keep local examples.
 */
export function ReelComments({ reelId, live }: { reelId: string; live: boolean }) {
  const { toast, reelsToast, requireAuth } = useUI();
  const [comments, setComments] = useState<Comment[]>(live ? [] : DEMO);
  const [loading, setLoading] = useState(live);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // "Qiymət" may be asked once per reel (legacy spam guard).
  const askedPrice = useRef(new Set<string>());

  useEffect(() => {
    if (!live) { setComments(DEMO); return; }
    let cancelled = false;
    setLoading(true);
    api<ApiComment[]>(`/api/reels/${encodeURIComponent(reelId)}/comments`)
      .then((list) => { if (!cancelled) setComments(list.slice().reverse().map(fromApi)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reelId, live]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [comments]);

  const add = async (value: string) => {
    const v = value.trim();
    if (!v) return false;
    if (live) {
      if (!requireAuth("Rəy yazmaq üçün daxil olun")) return false;
      try {
        const c = await api<ApiComment>(`/api/reels/${encodeURIComponent(reelId)}/comments`, { method: "POST", body: { body: v } });
        setComments((list) => [...list, fromApi({ ...c, user: { id: "me", name: "Siz" } })]);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Xəta");
        return false;
      }
    } else {
      setComments((c) => [...c, { key: "local" + Date.now(), user: "@siz", time: "indi", text: v, initial: "S", gradient: "#e76262" }]);
    }
    setText("");
    toast("Rəyiniz əlavə edildi ✅");
    return true;
  };

  const askPrice = () => {
    if (askedPrice.current.has(reelId)) {
      reelsToast("Siz artıq qiymət ilə maraqlanmısınız.");
      return;
    }
    void add("Qiymət?").then((okay) => { if (okay) askedPrice.current.add(reelId); });
  };

  return (
    <>
      <div ref={listRef} className="reels-comments-list" style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: ".85rem" }}>
        {loading && <p style={{ color: "#888", fontSize: ".85rem" }}>Yüklənir…</p>}
        {!loading && comments.length === 0 && <p style={{ color: "#888", fontSize: ".85rem" }}>Hələ rəy yoxdur. İlk rəyi siz yazın!</p>}
        {comments.map((c) => (
          <div className="reels-comment" key={c.key}>
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
          className="reels-comment-input"
          type="text"
          placeholder="Rəy yazın..."
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add(text);
            }
          }}
        />
        <button className="reels-price-btn" onClick={askPrice}>Qiymət</button>
      </div>
    </>
  );
}

/** Phone: comments as a bottom sheet. */
export function ReelCommentsSheet({ reelId, live, onClose }: { reelId: string; live: boolean; onClose: () => void }) {
  return (
    <Sheet title="Rəylər" maxHeight="75vh" onClose={onClose}>
      <ReelComments reelId={reelId} live={live} />
    </Sheet>
  );
}

/** Desktop: comments open beside the video (the stage slides the video to the left). */
export function ReelCommentsPanel({ reelId, live, open, onClose }: { reelId: string; live: boolean; open: boolean; onClose: () => void }) {
  return (
    <aside className={`reel-comments-panel${open ? " is-open" : ""}`} aria-label="Rəylər" aria-hidden={!open}>
      <div className="reel-comments-inner">
        <div className="reels-sheet-head">
          <span>Rəylər</span>
          <button onClick={onClose} aria-label="Rəyləri bağla">×</button>
        </div>
        <ReelComments reelId={reelId} live={live} />
      </div>
    </aside>
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
            <div key={c.name}
              {...pressable}
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
export function ReelOptionsMenu({ reelId, onClose }: { reelId: string | null; onClose: () => void }) {
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
        <div {...pressable} className="modal-item" id="save-item" onClick={act("Məhsul saxlanıldı")}>📌 Saxla</div>
        <div {...pressable} className="modal-item" id="copy-link-item" onClick={act("Link kopyalandı", () => copyText(`https://hobbi.az/reels/${reelId}`))}>
          🔗 Linki kopyala və ya Paylaş
        </div>
        <div {...pressable} className="modal-item" id="report-item" onClick={act("Şikayətiniz qeydə alındı")}>⚠️ Şikayət bildir</div>
      </div>
      <div id="modal-overlay-dark" className={`modal-overlay-dark${open ? " active" : ""}`} onClick={onClose} />
    </>
  );
}
