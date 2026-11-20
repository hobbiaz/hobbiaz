"use client";
import { useEffect, useRef, useState } from "react";

type Reel = { id: string; title: string; videoUrl: string; owner: string; likes: number };

export function ReelFeed({ reels }: { reels: Reel[] }) {
  const refs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [likes, setLikes] = useState<Record<string, number>>(Object.fromEntries(reels.map((r) => [r.id, r.likes])));
  const [msg, setMsg] = useState("");

  useEffect(() => { // play only the video that is mostly visible
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      const v = en.target as HTMLVideoElement;
      if (en.isIntersecting && en.intersectionRatio > 0.6) void v.play().catch(() => {}); else v.pause();
    }), { threshold: [0, 0.6, 1] });
    refs.current.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, []);

  async function like(id: string) {
    const res = await fetch(`/api/reels/${id}/like`, { method: "POST" });
    if (!res.ok) { setMsg((await res.json()).error ?? "Xəta"); return; }
    const { liked } = await res.json(); setMsg("");
    setLikes((p) => ({ ...p, [id]: p[id] + (liked ? 1 : -1) }));
  }
  return (<div>{msg && <p role="alert" className="hb-error">{msg}</p>}
    {reels.map((r) => (
      <section key={r.id} style={{ marginBottom: "2rem" }}>
        <video ref={(el) => { if (el) refs.current.set(r.id, el); else refs.current.delete(r.id); }} src={r.videoUrl} muted loop playsInline controls preload="metadata" style={{ width: "100%", maxHeight: "70vh" }} />
        <h2>{r.title}</h2><p>{r.owner}</p>
        <button className="hb-btn" onClick={() => like(r.id)}>♥ {likes[r.id]}</button>
      </section>))}</div>);
}
