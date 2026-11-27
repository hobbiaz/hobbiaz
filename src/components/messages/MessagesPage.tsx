"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONVERSATIONS, MESSAGE_TABS } from "@/data/content";
import { IconMsgSearch, IconPen as PenIcon } from "@/components/icons";
import { Modal } from "@/components/overlays/Modal";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { pressable } from "@/lib/a11y";
import { api, timeAgo } from "@/lib/api-client";
import { BULK_MESSAGE_EVENT } from "@/lib/events";
import { useUI } from "@/providers/UIProvider";

interface Convo {
  id: string;
  other: { id: string; name: string; avatar: string | null; storeSlug?: string } | null;
  listing: { id: string; title: string; image: string | null } | null;
  last: { body: string; createdAt: string; mine: boolean } | null;
  unread: number;
  updatedAt: string;
}
interface Msg { id: string; body: string; createdAt: string; mine: boolean }

const GRADIENTS = ["#34495e,#2c3e50", "#e67e22,#f39c12", "#16a085,#1abc9c", "#8e44ad,#9b59b6", "#c0392b,#e74c3c", "#2980b9,#3498db"];
const gradientFor = (name: string) => `linear-gradient(135deg,${GRADIENTS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % GRADIENTS.length]})`;

function Avatar({ name, src }: { name: string; src?: string | null }) {
  return src
    ? <img src={src} alt="" className="convo-avatar-placeholder" style={{ objectFit: "cover" }} />
    : <div className="convo-avatar-placeholder" style={{ background: gradientFor(name) }}>{name[0]?.toUpperCase()}</div>;
}

/**
 * Inbox + conversation. Phones show one or the other; computers show the list on the left and
 * the open chat on the right. Polls for new messages (no WebSocket).
 */
export function MessagesPage() {
  const { backend, user, openAuth, toast, refreshNotifications, openProduct } = useUI();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<(typeof MESSAGE_TABS)[number]>("Hamısı");
  const [convos, setConvos] = useState<Convo[] | null>(null);
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Convo | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(() => {
    if (!user) return;
    api<Convo[]>("/api/conversations").then(setConvos).catch(() => setConvos([]));
  }, [user]);
  useEffect(() => {
    loadConvos();
    const t = setInterval(() => { if (document.visibilityState === "visible") loadConvos(); }, 20_000);
    return () => clearInterval(t);
  }, [loadConvos]);
  // ?c=<id> (from a notification) opens that conversation.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) setOpenId(c);
  }, []);
  // The pen in the top bar opens the bulk message window.
  useEffect(() => {
    const open = () => setBulkOpen(true);
    window.addEventListener(BULK_MESSAGE_EVENT, open);
    return () => window.removeEventListener(BULK_MESSAGE_EVENT, open);
  }, []);

  const loadThread = useCallback((id: string) => {
    api<Msg[]>(`/api/conversations/${id}/messages`)
      .then((list) => {
        setMessages((prev) => (prev.length === list.length && prev.at(-1)?.id === list.at(-1)?.id ? prev : list));
        setConvos((cs) => cs?.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) ?? cs);
      })
      .catch((e) => { toast(e instanceof Error ? e.message : "Xəta"); setOpenId(null); });
  }, [toast]);
  useEffect(() => {
    if (!openId || !user) return;
    setMessages([]);
    setDraft("");
    loadThread(openId);
    refreshNotifications();
    const t = setInterval(() => { if (document.visibilityState === "visible") loadThread(openId); }, 5_000);
    return () => clearInterval(t);
  }, [openId, user, loadThread, refreshNotifications]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

  const openChat = (id: string) => {
    setOpenId(id);
    window.history.replaceState(window.history.state, "", `/messages?c=${encodeURIComponent(id)}`);
  };
  const closeChat = () => {
    setOpenId(null);
    window.history.replaceState(window.history.state, "", "/messages");
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || !openId) return;
    setSending(true);
    try {
      const m = await api<Msg>(`/api/conversations/${openId}/messages`, { method: "POST", body: { body } });
      setMessages((list) => [...list, m]);
      setDraft("");
      loadConvos();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xəta");
    } finally {
      setSending(false);
    }
  };

  const deleteConvo = async (c: Convo) => {
    setConfirmDelete(null);
    try {
      await api(`/api/conversations/${encodeURIComponent(c.id)}`, { method: "DELETE" });
      setConvos((list) => list?.filter((x) => x.id !== c.id) ?? list);
      if (openId === c.id) closeChat();
      refreshNotifications();
      toast("Mesajlar silindi");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Silmək alınmadı");
    }
  };

  const visible = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase("az");
    return (convos ?? []).filter((c) => {
      if (tab === "Oxunmamışlar" && !c.unread) return false;
      if (tab === "Satıcılar" && !c.other?.storeSlug) return false;
      if (!q) return true;
      return [c.other?.name, c.listing?.title, c.last?.body].some((s) => s?.toLocaleLowerCase("az").includes(q));
    });
  }, [convos, tab, filter]);

  if (backend === "offline") return <DemoInbox />;
  if (backend !== "checking" && !user) {
    return (
      <div className="page active" id="page-messages">
        <div style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem" }} aria-hidden="true">💬</div>
          <h2 style={{ margin: "1rem 0 .5rem" }}>Mesajlarınız</h2>
          <p style={{ color: "var(--on-surface-var)", marginBottom: "1.5rem" }}>Satıcılarla yazışmaq üçün daxil olun.</p>
          <button className="store-cta-btn" onClick={() => openAuth("login")}>Daxil ol</button>
        </div>
      </div>
    );
  }

  const current = convos?.find((c) => c.id === openId);

  const thread = openId && (
    <div className="chat-pane">
      <div className="chat-head">
        <button className="chat-back" onClick={closeChat} aria-label="Geri">←</button>
        <Avatar name={current?.other?.name ?? "?"} src={current?.other?.avatar} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="convo-name">{current?.other?.name ?? "Söhbət"}</div>
          {current?.listing && (
            <button onClick={() => openProduct(current.listing!.id)} className="chat-listing-link">
              📦 {current.listing.title}
            </button>
          )}
        </div>
        {current && <button className="convo-delete" onClick={() => setConfirmDelete(current)} aria-label="Bu istifadəçi ilə mesajları sil" title="Mesajları sil">×</button>}
      </div>
      <div className="chat-messages" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
            <div className={`chat-bubble${m.mine ? " mine" : ""}`}>{m.body}</div>
            <div style={{ fontSize: ".7rem", color: "var(--outline)", textAlign: m.mine ? "right" : "left", marginTop: ".15rem" }}>{timeAgo(m.createdAt)}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="chat-form">
        <div className="msg-search" style={{ flex: 1, margin: 0 }}>
          <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Mesaj yazın..." aria-label="Mesaj" maxLength={2000} />
        </div>
        <button type="submit" className="store-cta-btn" disabled={sending || !draft.trim()}>Göndər</button>
      </form>
    </div>
  );

  const inbox = (
    <div className="inbox-pane">
      <div className="inbox-top">
        <div className="msg-search">
          <IconMsgSearch />
          <input type="text" placeholder="Mesajlarda axtar..." value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Mesajlarda axtar" />
        </div>
        {/* Phones have no top bar on this page, so the pen lives here. */}
        {isMobile && <button type="button" className="msg-pen-btn" onClick={() => setBulkOpen(true)} aria-label="Toplu mesaj göndər" title="Toplu mesaj"><PenIcon /></button>}
      </div>
      <div className="filter-tabs">
        {MESSAGE_TABS.map((t) => (
          <span key={t} {...pressable} className={`filter-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>
      <div className="convo-list">
        {convos === null && <p style={{ textAlign: "center", color: "var(--outline)", padding: "2rem" }}>Yüklənir…</p>}
        {convos !== null && visible.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--outline)", padding: "2rem" }}>
            {convos.length === 0 ? "Hələ mesaj yoxdur. Məhsul səhifəsində \"Maraqlan\" düyməsi ilə satıcıya yazın." : "Uyğun söhbət tapılmadı."}
          </p>
        )}
        {visible.map((c) => (
          <div key={c.id} {...pressable} className={`convo-item${c.unread ? " unread" : ""}${c.id === openId ? " active" : ""}`} onClick={() => openChat(c.id)}>
            <Avatar name={c.other?.name ?? "?"} src={c.other?.avatar} />
            <div className="convo-body">
              <div className="convo-name">{c.other?.name ?? "İstifadəçi"}{c.listing ? ` · ${c.listing.title}` : ""}</div>
              <div className="convo-preview">{c.last ? `${c.last.mine ? "Siz: " : ""}${c.last.body}` : ""}</div>
            </div>
            <div className="convo-right">
              <div className="convo-time">{timeAgo(c.updatedAt)}</div>
              {c.unread > 0 && <div className="unread-dot" aria-label={`${c.unread} oxunmamış`} />}
            </div>
            <button
              type="button"
              className="convo-delete"
              aria-label={`${c.other?.name ?? "İstifadəçi"} ilə mesajları sil`}
              title="Mesajları sil"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(c); }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page active" id="page-messages">
      <div className={`messages-wrap messages-layout${openId ? " has-chat" : ""}`}>
        {(!isMobile || !openId) && inbox}
        {thread}
        {!isMobile && !openId && (
          <div className="chat-pane chat-empty">
            <div style={{ fontSize: "2.4rem" }} aria-hidden="true">💬</div>
            <p>Yazışmaq üçün soldan söhbət seçin</p>
          </div>
        )}
      </div>

      <Modal id="convo-delete-modal" open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} boxStyle={{ maxWidth: 380 }}>
        <div className="confirm-box">
          <div className="confirm-title">Bu istifadəçi ilə mesajlar silinsin?</div>
          <p className="confirm-text">{confirmDelete?.other?.name ?? "İstifadəçi"} ilə yazışma yalnız sizdə silinəcək.</p>
          <div className="confirm-actions">
            <button type="button" className="confirm-no" onClick={() => setConfirmDelete(null)}>Xeyr</button>
            <button type="button" className="confirm-yes" onClick={() => confirmDelete && void deleteConvo(confirmDelete)}>Bəli</button>
          </div>
        </div>
      </Modal>

      <BulkMessageModal
        open={bulkOpen}
        recipients={(convos ?? []).map((c) => ({ id: c.id, name: c.other?.name ?? "İstifadəçi", avatar: c.other?.avatar, note: c.listing?.title }))}
        sendOne={(id, body) => api(`/api/conversations/${encodeURIComponent(id)}/messages`, { method: "POST", body: { body } })}
        onClose={() => setBulkOpen(false)}
        onSent={loadConvos}
      />
    </div>
  );
}

/** Someone you can message in "Toplu mesaj". */
interface Recipient { id: string; name: string; avatar?: string | null; note?: string }

/** Pen: one message to several people you've already talked to. */
function BulkMessageModal({ open, recipients, onClose, sendOne, onSent }: {
  open: boolean;
  recipients: Recipient[];
  onClose: () => void;
  /** Sends the text to one conversation; throws on failure. */
  sendOne: (id: string, body: string) => Promise<unknown>;
  onSent?: () => void;
}) {
  const { toast } = useUI();
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  useEffect(() => { if (!open) { setPicked([]); setText(""); setProgress(null); } }, [open]);

  const all = picked.length === recipients.length && recipients.length > 0;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const busy = progress !== null;

  const send = async () => {
    const body = text.trim();
    if (!body || !picked.length) return;
    setProgress(0);
    let okCount = 0;
    for (const [i, id] of picked.entries()) {
      try {
        await sendOne(id, body);
        okCount++;
      } catch { /* counted below */ }
      setProgress(i + 1);
    }
    onSent?.();
    toast(okCount === picked.length ? `Mesaj ${okCount} nəfərə göndərildi ✅` : `${okCount}/${picked.length} nəfərə göndərildi`);
    onClose();
  };

  return (
    <Modal id="bulk-message-modal" open={open} onClose={() => !busy && onClose()} boxStyle={{ maxWidth: 460 }}>
      <button className="modal-close" onClick={() => !busy && onClose()} aria-label="Bağla">×</button>
      <div className="bulk-box">
        <div className="confirm-title">Toplu mesaj</div>
        <p className="confirm-text">Əvvəl yazışdığınız şəxsləri seçin, mesaj hər birinə ayrıca göndəriləcək.</p>
        {recipients.length === 0 ? (
          <p className="confirm-text">Hələ heç kimlə yazışmamısınız.</p>
        ) : (
          <>
            <label className="bulk-row bulk-all">
              <input type="checkbox" checked={all} onChange={() => setPicked(all ? [] : recipients.map((c) => c.id))} disabled={busy} />
              Hamısını seç ({recipients.length})
            </label>
            <div className="bulk-list">
              {recipients.map((c) => (
                <label key={c.id} className="bulk-row">
                  <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} disabled={busy} />
                  <Avatar name={c.name} src={c.avatar} />
                  <span className="bulk-name">{c.name}{c.note ? <small> · {c.note}</small> : null}</span>
                </label>
              ))}
            </div>
          </>
        )}
        <textarea className="bulk-text" placeholder="Mesajınız..." value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} disabled={busy} />
        <button type="button" className="reel-upload-submit" disabled={busy || !text.trim() || !picked.length} onClick={send}>
          {busy ? `Göndərilir… ${progress}/${picked.length}` : `Göndər${picked.length ? ` (${picked.length})` : ""}`}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Offline demo inbox (no database): same layout as the real one, and you can type and use
 * "Toplu mesaj" — messages only live on this page until it reloads.
 */
function DemoInbox() {
  const isMobile = useIsMobile();
  const [openId, setOpenId] = useState<number | null>(null);
  const [sent, setSent] = useState<Record<number, Msg[]>>({});
  const [draft, setDraft] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const c = CONVERSATIONS.find((x) => x.id === openId);

  useEffect(() => {
    const open = () => setBulkOpen(true);
    window.addEventListener(BULK_MESSAGE_EVENT, open);
    return () => window.removeEventListener(BULK_MESSAGE_EVENT, open);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [sent, openId]);

  const add = (id: number, body: string) =>
    setSent((m) => ({ ...m, [id]: [...(m[id] ?? []), { id: `${id}-${Date.now()}-${Math.random()}`, body, createdAt: new Date().toISOString(), mine: true }] }));
  const send = () => {
    const body = draft.trim();
    if (!body || openId === null) return;
    add(openId, body);
    setDraft("");
  };

  const thread = c && (
    <div className="chat-pane">
      <div className="chat-head">
        <button className="chat-back" onClick={() => setOpenId(null)} aria-label="Geri">←</button>
        <div className="convo-avatar-placeholder" style={{ background: c.gradient }}>{c.initial}</div>
        <div className="convo-name" style={{ flex: 1 }}>{c.name}</div>
      </div>
      <div className="chat-messages" aria-live="polite">
        <div style={{ alignSelf: "flex-start", maxWidth: "78%" }}>
          <div className="chat-bubble">{c.preview}</div>
          <div style={{ fontSize: ".7rem", color: "var(--outline)", marginTop: ".15rem" }}>{c.time}</div>
        </div>
        {(sent[c.id] ?? []).map((m) => (
          <div key={m.id} style={{ alignSelf: "flex-end", maxWidth: "78%" }}>
            <div className="chat-bubble mine">{m.body}</div>
            <div style={{ fontSize: ".7rem", color: "var(--outline)", textAlign: "right", marginTop: ".15rem" }}>{timeAgo(m.createdAt)}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="chat-form">
        <div className="msg-search" style={{ flex: 1, margin: 0 }}>
          <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Mesaj yazın..." aria-label="Mesaj" maxLength={2000} />
        </div>
        <button type="submit" className="store-cta-btn" disabled={!draft.trim()}>Göndər</button>
      </form>
    </div>
  );

  const inbox = (
    <div className="inbox-pane">
      <p style={{ color: "var(--outline)", fontSize: ".8rem", margin: ".25rem 0 .75rem" }}>Demo rejim: server qoşulmayıb, mesajlar göndərilmir.</p>
      {isMobile && (
        <div className="inbox-top" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="msg-pen-btn" onClick={() => setBulkOpen(true)} aria-label="Toplu mesaj göndər"><PenIcon /></button>
        </div>
      )}
      <div className="convo-list">
        {CONVERSATIONS.map((x) => (
          <div key={x.id} {...pressable} className={`convo-item${x.unread && !sent[x.id] ? " unread" : ""}${x.id === openId ? " active" : ""}`} onClick={() => setOpenId(x.id)}>
            <div className="convo-avatar-placeholder" style={{ background: x.gradient }}>{x.initial}</div>
            <div className="convo-body">
              <div className="convo-name">{x.name}</div>
              <div className="convo-preview">{sent[x.id]?.length ? `Siz: ${sent[x.id]!.at(-1)!.body}` : x.preview}</div>
            </div>
            <div className="convo-right">
              <div className="convo-time">{sent[x.id]?.length ? "indi" : x.time}</div>
              {x.unread && !sent[x.id] && <div className="unread-dot" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page active" id="page-messages">
      <div className={`messages-wrap messages-layout${c ? " has-chat" : ""}`}>
        {(!isMobile || !c) && inbox}
        {thread}
        {!isMobile && !c && (
          <div className="chat-pane chat-empty">
            <div style={{ fontSize: "2.4rem" }} aria-hidden="true">💬</div>
            <p>Yazışmaq üçün soldan söhbət seçin</p>
          </div>
        )}
      </div>
      <BulkMessageModal
        open={bulkOpen}
        recipients={CONVERSATIONS.map((x) => ({ id: String(x.id), name: x.name }))}
        sendOne={async (id, body) => add(Number(id), body)}
        onClose={() => setBulkOpen(false)}
      />
    </div>
  );
}
