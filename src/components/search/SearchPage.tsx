"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IDEAS } from "@/data/ideas";
import { REEL_SEARCH_SUGGESTIONS } from "@/data/content";
import { useUI } from "@/providers/UIProvider";
import { IconSearchLarge } from "@/components/icons";
import { pressable } from "@/lib/a11y";
import { api } from "@/lib/api-client";
import { searchDemoReels, toReel, type ApiReel } from "@/lib/reels-client";
import { readJSON, writeStorage } from "@/lib/storage-client";
import type { Reel } from "@/types";

const RECENT_KEY = "hobbi_recent_reel_searches";
const RECENT_MAX = 3;

/**
 * "Nə axtarırsınız?" — searches videos (Lent) only; product search is the top bar's job.
 * Results show on this page; a suggestion button only fills the field.
 */
export function SearchPage() {
  const { backend } = useUI();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Reel[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = readJSON<unknown>(RECENT_KEY, []);
    if (Array.isArray(saved)) setRecent(saved.map(String).slice(0, RECENT_MAX));
  }, []);

  const submit = async () => {
    const q = (input.current?.value ?? "").trim();
    if (!q) { input.current?.focus(); return; }
    setQuery(q);
    setRecent((list) => {
      const next = [q, ...list.filter((x) => x.toLocaleLowerCase("az") !== q.toLocaleLowerCase("az"))].slice(0, RECENT_MAX);
      writeStorage(RECENT_KEY, JSON.stringify(next));
      return next;
    });
    if (backend !== "online") { setResults(searchDemoReels(q)); return; }
    setLoading(true);
    try {
      const list = await api<ApiReel[]>(`/api/reels?q=${encodeURIComponent(q)}`);
      setResults(list.map(toReel));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /** A suggestion only fills the field; the user presses "Axtar". */
  const fill = (text: string) => {
    if (!input.current) return;
    input.current.value = text;
    input.current.focus();
  };

  const seen = new Set<string>();
  const suggestions = [...recent, ...REEL_SEARCH_SUGGESTIONS]
    .filter((t) => {
      const k = t.toLocaleLowerCase("az");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 6);

  return (
    <div className="page active" id="page-search">
      <div className="search-page">
        <div className="search-page-hero">
          <h1>Nə axtarırsınız?</h1>
          <form className="search-box-wrap" onSubmit={(e) => { e.preventDefault(); void submit(); }} role="search">
            <IconSearchLarge />
            <input ref={input} type="search" id="search-input" placeholder="Video axtar: keramika, toxuculuq, sənətkar..." aria-label="Video axtarışı" enterKeyHint="search" />
            <button type="submit" className="search-btn">Axtar</button>
          </form>
          <div className="search-suggest-chips" aria-label="Axtarış təklifləri">
            {suggestions.map((t) => (
              <button key={t} type="button" className="search-suggest-chip" onClick={() => fill(t)}>
                <IconSearchLarge aria-hidden="true" />
                {t}
              </button>
            ))}
          </div>
        </div>

        {(results !== null || loading) && (
          <section className="reel-results" aria-live="polite">
            <div className="section-header" style={{ marginBottom: ".75rem" }}>
              <h2>{loading ? "Axtarılır…" : `“${query}” üçün ${results?.length ?? 0} video`}</h2>
              <button type="button" className="reel-results-clear" onClick={() => { setResults(null); setQuery(""); if (input.current) input.current.value = ""; }}>Təmizlə</button>
            </div>
            {!loading && results?.length === 0 && <p className="reel-results-empty">Video tapılmadı. Başqa söz yoxlayın.</p>}
            <div className="ideas-grid">
              {results?.map((r) => (
                <div className="idea-card reel-result" key={r.id} {...pressable} onClick={() => router.push(`/reels?r=${encodeURIComponent(r.id)}`)}>
                  {r.video
                    ? <video className="ibg" src={`${r.video}#t=0.1`} muted playsInline preload="metadata" />
                    : <div className="ibg" style={{ background: r.gradient }}>{r.emoji}</div>}
                  <div className="idea-overlay">
                    <div className="idea-title">{r.title}</div>
                    <div className="idea-views">@{r.creator}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="section-header" style={{ marginBottom: ".75rem" }}>
          <h2>İdeya və İlham</h2>
          <Link href="/reels">Hamısına bax</Link>
        </div>
        <div className="ideas-grid" id="ideas-grid">
          {IDEAS.map((idea) => (
            <div className="idea-card" key={idea.title} {...pressable} onClick={() => router.push("/reels")}>
              <div className="ibg" style={{ background: idea.color }}>{idea.emoji}</div>
              <div className="idea-overlay">
                <div className="idea-title">{idea.title}</div>
                <div className="idea-views">👁 {idea.views}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
