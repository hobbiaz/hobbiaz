"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONVERSATIONS, MESSAGE_TABS } from "@/data/content";
import { IconMsgSearch } from "@/components/icons";
import { pressable } from "@/lib/a11y";
import { api, timeAgo } from "@/lib/api-client";
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

/** Inbox + conversation view. Polls for new messages (no WebSocket). */
export function MessagesPage() {
  const { backend, user, openAuth, toast, refreshNotifications, openProduct } = useUI();
  const [tab, setTab] = useState<(typeof MESSAGE_TABS)[number]>("Hamısı");
  const [convos, setConvos] = useState<Convo[] | null>(null);
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
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
    loadThread(openId);
    refreshNotifications();
    const t = setInterval(() => { if (document.visibilityState === "visible") loadThread(openId); }, 5_000);
    return () => clearInterval(t);
  }, [openId, user, loadThread, refreshNotifications]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

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

  if (openId) {
    return (
      <div className="page active" id="page-messages">
        <div className="messages-wrap" style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 140px)", minHeight: 360 }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".5rem 0 .75rem", borderBottom: "1px solid var(--outline-var)" }}>
            <button onClick={() => { setOpenId(null); window.history.replaceState(window.history.state, "", "/messages"); }} aria-label="Geri" style={{ background: "none", border: 0, fontSize: "1.3rem", cursor: "pointer", color: "var(--on-surface)" }}>←</button>
            <Avatar name={current?.other?.name ?? "?"} src={current?.other?.avatar} />
            <div style={{ minWidth: 0 }}>
              <div className="convo-name">{current?.other?.name ?? "Söhbət"}</div>
              {current?.listing && (
                <button {...pressable} onClick={() => openProduct(current.listing!.id)} style={{ background: "none", border: 0, padding: 0, color: "var(--primary)", fontSize: ".8rem", cursor: "pointer", textAlign: "left" }}>
                  📦 {current.listing.title}
                </button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: ".75rem 0", display: "flex", flexDirection: "column", gap: ".4rem" }} aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                <div style={{ background: m.mine ? "#e76262" : "var(--surface-low, #f0f1f3)", color: m.mine ? "#fff" : "var(--on-surface)", padding: ".5rem .8rem", borderRadius: m.mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: ".9rem" }}>
                  {m.body}
                </div>
                <div style={{ fontSize: ".7rem", color: "var(--outline)", textAlign: m.mine ? "right" : "left", marginTop: ".15rem" }}>{timeAgo(m.createdAt)}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void send(); }} style={{ display: "flex", gap: ".5rem", paddingTop: ".5rem" }}>
            <div className="msg-search" style={{ flex: 1, margin: 0 }}>
              <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Mesaj yazın..." aria-label="Mesaj" maxLength={2000} />
            </div>
            <button type="submit" className="store-cta-btn" disabled={sending || !draft.trim()}>Göndər</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page active" id="page-messages">
      <div className="messages-wrap">
        <div className="msg-search">
          <IconMsgSearch />
          <input type="text" placeholder="Mesajlarda axtar..." value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Mesajlarda axtar" />
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
            <div key={c.id} {...pressable} className={`convo-item${c.unread ? " unread" : ""}`} onClick={() => setOpenId(c.id)}>
              <Avatar name={c.other?.name ?? "?"} src={c.other?.avatar} />
              <div className="convo-body">
                <div className="convo-name">{c.other?.name ?? "İstifadəçi"}{c.listing ? ` · ${c.listing.title}` : ""}</div>
                <div className="convo-preview">{c.last ? `${c.last.mine ? "Siz: " : ""}${c.last.body}` : ""}</div>
              </div>
              <div className="convo-right">
                <div className="convo-time">{timeAgo(c.updatedAt)}</div>
                {c.unread > 0 && <div className="unread-dot" aria-label={`${c.unread} oxunmamış`} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Offline demo inbox (no database). */
function DemoInbox() {
  return (
    <div className="page active" id="page-messages">
      <div className="messages-wrap">
        <p style={{ textAlign: "center", color: "var(--outline)", fontSize: ".85rem", margin: ".5rem 0 1rem" }}>Demo rejim: server qoşulmayıb</p>
        <div className="convo-list">
          {CONVERSATIONS.map((c) => (
            <div key={c.id} className={`convo-item${c.unread ? " unread" : ""}`}>
              <div className="convo-avatar-placeholder" style={{ background: c.gradient }}>{c.initial}</div>
              <div className="convo-body">
                <div className="convo-name">{c.name}</div>
                <div className="convo-preview">{c.preview}</div>
              </div>
              <div className="convo-right">
                <div className="convo-time">{c.time}</div>
                {c.unread && <div className="unread-dot" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
