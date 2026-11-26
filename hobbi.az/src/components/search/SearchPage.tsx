"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IDEAS } from "@/data/ideas";
import { SEARCH_SUGGESTIONS } from "@/data/content";
import { usePopularSearches } from "@/hooks/useCollections";
import { useUI } from "@/providers/UIProvider";
import { IconSearchLarge } from "@/components/icons";
import { pressable } from "@/lib/a11y";

export function SearchPage() {
  const { search, recentSearches } = useUI();
  const router = useRouter();
  const popular = usePopularSearches(true);
  const input = useRef<HTMLInputElement>(null);
  const submit = () => search(input.current?.value ?? "");

  // Suggestion buttons: your recent searches, then the most searched, topped up with defaults.
  const seen = new Set<string>();
  const suggestions = [...recentSearches, ...popular, ...SEARCH_SUGGESTIONS]
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
          <div className="search-box-wrap">
            <IconSearchLarge />
            <input ref={input} type="search" id="search-input" placeholder="Məhsul, mağaza və ya sənətkar axtar..." aria-label="Axtarış" enterKeyHint="search" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            <button className="search-btn" onClick={submit}>Axtar</button>
          </div>
          <div className="search-suggest-chips" aria-label="Axtarış təklifləri">
            {suggestions.map((t) => (
              <button key={t} type="button" className="search-suggest-chip" onClick={() => search(t)}>
                <IconSearchLarge aria-hidden="true" />
                {t}
              </button>
            ))}
          </div>
        </div>

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
